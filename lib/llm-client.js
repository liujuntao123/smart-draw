/**
 * LLM Client for calling OpenAI and Anthropic APIs
 */

/**
 * Call LLM API with streaming support
 * @param {Object} config - Provider configuration
 * @param {Array} messages - Chat messages array
 * @param {Function} onChunk - Callback for each chunk
 * @returns {Promise<string>} Complete response
 */
export async function callLLM(config, messages, onChunk) {
  const { type, baseUrl, apiKey, model } = config;

  if (type === 'openai') {
    return callOpenAI(baseUrl, apiKey, model, messages, onChunk);
  } else if (type === 'anthropic') {
    return callAnthropic(baseUrl, apiKey, model, messages, onChunk);
  } else {
    throw new Error(`Unsupported provider type: ${type}`);
  }
}

/**
 * Call OpenAI-compatible API
 */
async function callOpenAI(baseUrl, apiKey, model, messages, onChunk) {
  const url = `${baseUrl}/chat/completions`;

  // Process messages to support multimodal content (text + images)
  const processedMessages = messages.map(processMessageForOpenAI);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: processedMessages,
      stream: true,
      // max_tokens: 64000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  return processOpenAIStream(response.body, onChunk);
}

/**
 * Process OpenAI streaming response
 */
async function processOpenAIStream(body, onChunk) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              if (onChunk) onChunk(content);
            }
          } catch (e) {
            console.error('Failed to parse SSE:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullText;
}

/**
 * Call Anthropic API
 */
async function callAnthropic(baseUrl, apiKey, model, messages, onChunk) {
  const url = `${baseUrl}/messages`;

  // Convert messages format for Anthropic with multimodal support
  const systemMessage = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');
  const processedMessages = chatMessages.map(processMessageForAnthropic);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model,
      messages: processedMessages,
      system: systemMessage ? [{ type: 'text', text: systemMessage.content }] : undefined,
      max_tokens: 64000,
      stream: true,
      temperature: 1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${error}`);
  }

  return processAnthropicStream(response.body, onChunk);
}

/**
 * Process Anthropic streaming response
 */
async function processAnthropicStream(body, onChunk) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        
        try {
          const json = JSON.parse(trimmed.slice(6));
          
          if (json.type === 'content_block_delta') {
            const content = json.delta?.text;
            if (content) {
              fullText += content;
              if (onChunk) onChunk(content);
            }
          }
        } catch (e) {
          console.error('Failed to parse SSE:', e);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullText;
}

/**
 * Process message for OpenAI API with multimodal support
 * @param {Object} message - Message object
 * @returns {Object} Processed message for OpenAI
 */
function processMessageForOpenAI(message) {
  // If message doesn't have image data, return as-is
  if (!message.image && !message.images) {
    return message;
  }

  const images = message.images || (message.image ? [message.image] : []);
  const parts = [
    {
      type: 'text',
      text: message.content
    },
    ...images.map(img => ({
      type: 'image_url',
      image_url: {
        url: `data:${img.mimeType};base64,${img.data}`,
        detail: 'high'
      }
    }))
  ];

  return {
    role: message.role,
    content: parts
  };
}

/**
 * Process message for Anthropic API with multimodal support
 * @param {Object} message - Message object
 * @returns {Object} Processed message for Anthropic
 */
function processMessageForAnthropic(message) {
  const role = message.role === 'assistant' ? 'assistant' : 'user';
  const textParts = extractTextPartsForAnthropic(message);
  const imagePayloads = extractImagePayloads(message);
  const imageParts = imagePayloads.map((img) => createAnthropicImagePart(img)).filter(Boolean);

  const content = [...textParts, ...imageParts];

  if (content.length === 0) {
    content.push({ type: 'text', text: '' });
  }

  return {
    role,
    content,
  };
}

function extractTextPartsForAnthropic(message) {
  if (Array.isArray(message.content)) {
    const parts = message.content
      .filter((part) => part?.type === 'text' && typeof part.text === 'string')
      .map((part) => ({ type: 'text', text: part.text }));
    if (parts.length > 0) {
      return parts;
    }
  }

  const textContent = typeof message.content === 'string' ? message.content : '';
  return textContent ? [{ type: 'text', text: textContent }] : [];
}

function extractImagePayloads(message) {
  const payloads = [];
  const pushPayload = (candidate) => {
    const normalized = normalizeImagePayload(candidate);
    if (normalized) {
      payloads.push(normalized);
    }
  };

  if (Array.isArray(message.imagePayloads)) {
    message.imagePayloads.forEach(pushPayload);
  }

  if (Array.isArray(message.images)) {
    message.images.forEach(pushPayload);
  }

  if (message.image) {
    pushPayload(message.image);
  }

  if (Array.isArray(message.content)) {
    message.content.forEach((part) => {
      if (part?.type === 'image_url' && part.image_url?.url) {
        const parsed = parseDataUrl(part.image_url.url);
        if (parsed) {
          payloads.push(parsed);
        }
      } else if (part?.type === 'image' && part.source?.type === 'base64') {
        pushPayload({
          data: part.source.data,
          mimeType: part.source.media_type,
          cache_control: part.cache_control,
        });
      }
    });
  }

  return payloads;
}

function normalizeImagePayload(candidate) {
  if (!candidate) return null;

  if (candidate.data) {
    return {
      data: candidate.data,
      mimeType: candidate.mimeType || candidate.media_type || candidate.type || 'image/png',
      cache_control: candidate.cache_control || candidate.cacheControl,
    };
  }

  if (candidate.source?.type === 'base64' && candidate.source?.data) {
    return {
      data: candidate.source.data,
      mimeType: candidate.source.media_type || 'image/png',
      cache_control: candidate.cache_control || candidate.cacheControl,
    };
  }

  if (candidate.url && typeof candidate.url === 'string') {
    const parsed = parseDataUrl(candidate.url);
    if (parsed) return parsed;
  }

  if (candidate.image_url?.url) {
    const parsed = parseDataUrl(candidate.image_url.url);
    if (parsed) return parsed;
  }

  return null;
}

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const trimmed = dataUrl.trim();
  const match = /^data:(.*?);base64,(.*)$/i.exec(trimmed);
  if (!match) return null;
  const mimeType = match[1] || 'image/png';
  const data = match[2] || '';
  if (!data) return null;
  return {
    data,
    mimeType,
  };
}

function createAnthropicImagePart(img) {
  if (!img?.data) return null;
  const mediaType = img.mimeType || 'image/png';
  const part = {
    type: 'image',
    source: {
      type: 'base64',
      media_type: mediaType,
      data: img.data,
    },
  };

  if (img.cache_control && typeof img.cache_control === 'object') {
    part.cache_control = img.cache_control;
  }

  return part;
}

/**
 * Test configuration connection with a simple API call
 * @param {Object} config - Provider configuration
 * @returns {Promise<Object>} Test result with success status and message
 */
export async function testConnection(config) {
  const { type, baseUrl, apiKey } = config;

  try {
    // Try to fetch models as a simple connection test
    const models = await fetchModels(type, baseUrl, apiKey);

    if (models && models.length > 0) {
      return {
        success: true,
        message: `连接成功，找到 ${models.length} 个可用模型`,
        models: models.slice(0, 5) // Return first 5 models for preview
      };
    } else {
      return {
        success: false,
        message: '连接成功但未找到可用模型'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `连接失败: ${error.message}`
    };
  }
}

/**
 * Fetch available models from provider
 * @param {string} type - Provider type
 * @param {string} baseUrl - API base URL
 * @param {string} apiKey - API key
 * @returns {Promise<Array>} List of available models
 */
export async function fetchModels(type, baseUrl, apiKey) {
  if (type === 'openai') {
    const url = `${baseUrl}/models`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    return (Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : Array.isArray(data) ? data : [])
      .map(model => ({
        id: typeof model === 'string' ? model : (model.id || model.name || model.model || model.slug),
        name: typeof model === 'string' ? model : (model.name || model.id || model.model || model.slug),
      }))
      .filter(m => m.id);
  } else if (type === 'anthropic') {
    // Request actual models from provider like OpenAI, but with Anthropic headers
    const url = `${baseUrl}/models`;
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    return (Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : Array.isArray(data) ? data : [])
      .map(model => ({
        id: typeof model === 'string' ? model : (model.id || model.name || model.model || model.slug),
        name: typeof model === 'string' ? model : (model.name || model.id || model.model || model.slug),
      }))
      .filter(m => m.id);
  } else {
    throw new Error(`Unsupported provider type: ${type}`);
  }
}

