'use client';

import { useState, useCallback } from 'react';
import { historyManager } from '@/lib/history-manager';
import { configService } from '@/lib/config-service';
import { parseSSEStream, parseSSEStreamAlt } from '@/lib/sse-parser';

/**
 * 共享的引擎逻辑 Hook
 * 提供两个引擎（Draw.io 和 Excalidraw）的通用功能
 */
export function useEngineShared() {
  // 生成唯一对话 ID
  const newConversationId = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  // 共享状态
  const [usedCode, setUsedCode] = useState('');
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [conversationId, setConversationId] = useState(newConversationId());
  const [lastError, setLastError] = useState(null);

  /**
   * 将图片文件转为 base64
   */
  const fileToBase64 = useCallback(
    (file) =>
      new Promise((resolve) => {
        try {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result || '';
            const base64 =
              typeof result === 'string' ? result.split(',')[1] : '';
            resolve(base64 || '');
          };
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        } catch {
          resolve('');
        }
      }),
    [],
  );

  /**
   * 构建 multimodal 用户消息
   * @param {string} textContent - 文本内容
   * @param {Array} attachments - 附件数组
   * @returns {Object} 用户消息对象
   */
  const buildUserMessage = useCallback(
    async (textContent, attachments = []) => {
      const userMessage = {
        role: 'user',
        content: textContent,
      };

      // 处理图片附件
      if (Array.isArray(attachments) && attachments.length > 0) {
        const imageAttachments = attachments.filter(
          (att) => att.kind === 'image',
        );
        if (imageAttachments.length > 0) {
          const encodedImages = await Promise.all(
            imageAttachments.map(async ({ file, type, name }) => ({
              data: await fileToBase64(file),
              mimeType: (file && file.type) || type || 'image/png',
              name: (file && file.name) || name || 'image',
            })),
          );

          const safeImages = encodedImages.filter((img) => !!img.data);

          if (safeImages.length > 0) {
            userMessage.content = [
              { type: 'text', text: textContent },
              ...safeImages.map((img) => ({
                type: 'image_url',
                image_url: {
                  url: `data:${img.mimeType};base64,${img.data}`,
                },
              })),
            ];

            // 保存独立的图像 payload，供不同厂商的 LLM 客户端按需序列化
            userMessage.imagePayloads = safeImages.map((img) => ({
              data: img.data,
              mimeType: img.mimeType,
              name: img.name,
            }));
          }
        }
      }

      return userMessage;
    },
    [fileToBase64],
  );

  /**
   * 构建完整的 messages 数组
   * @param {Object} systemMessage - 系统消息
   * @param {Object} userMessage - 用户消息
   * @param {Array} currentMessages - 当前消息历史
   * @param {number} historyLimit - 历史消息限制条数
   * @returns {Array} 完整的消息数组
   */
  const buildFullMessages = useCallback(
    (systemMessage, userMessage, currentMessages, historyLimit = 3) => {
      const history = currentMessages
        .filter(
          (m) =>
            ['user', 'assistant'].includes(m.role) &&
            typeof m.content === 'string',
        )
        .slice(-historyLimit);

      return [systemMessage, ...history, userMessage];
    },
    [],
  );

  /**
   * 调用 LLM 流式接口并处理响应
   * @param {Object} llmConfig - LLM 配置
   * @param {Array} fullMessages - 完整消息数组
   * @returns {Promise<string>} 累积的生成内容
   */
  const callLLMStream = useCallback(async (llmConfig, fullMessages) => {
    const headers = {
      'Content-Type': 'application/json',
    };

    // 如果启用了访问密码模式，则通过请求头传递 access-password，
    // 由服务端根据环境变量自动注入 apiKey
    if (typeof window !== 'undefined') {
      try {
        const usePassword =
          localStorage.getItem('smart-diagram-use-password') === 'true';
        const accessPassword =
          localStorage.getItem('smart-diagram-access-password') || '';
        if (usePassword && accessPassword) {
          headers['x-access-password'] = accessPassword;
        }
      } catch {
        // ignore
      }
    }

    const response = await fetch('/api/llm/stream', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        config: llmConfig,
        messages: fullMessages,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'LLM 请求失败';
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Failed to parse error response, use status text
        errorMessage = `请求失败 (${response.status}): ${response.statusText}`;
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    return response;
  }, []);

  /**
   * 验证 LLM 配置是否有效
   * @param {Function} showNotification - 通知函数
   * @returns {Object|null} 返回有效的配置对象，或 null
   */
  const validateConfig = useCallback((showNotification) => {
    const activeConfig = configService.getCurrentConfig();
    const validation = configService.validateConfig(activeConfig);

    if (!validation.isValid) {
      if (showNotification) {
        showNotification({
          title: '配置缺失',
          message: '请先在右上角配置 LLM',
          type: 'error',
        });
      }
      return null;
    }

    const baseConfig = {
      type: activeConfig.type,
      baseUrl: activeConfig.baseUrl,
      model: activeConfig.model,
    };

    // 本地配置模式下才需要在前端携带 apiKey；
    // 访问密码模式下 apiKey 仅存在于服务端环境变量中。
    if (typeof window === 'undefined') {
      return { ...baseConfig, apiKey: activeConfig.apiKey };
    }

    try {
      const usePassword = configService.isPasswordMode();
      if (!usePassword) {
        return { ...baseConfig, apiKey: activeConfig.apiKey };
      }
    } catch {
      // 读取失败时退回到直接返回 apiKey（用于本地配置）
      return { ...baseConfig, apiKey: activeConfig.apiKey };
    }

    // 访问密码模式：不在前端传播 apiKey
    return baseConfig;
  }, []);

  /**
   * 发送消息模板方法（策略模式）
   * 统一处理两个引擎的消息发送流程，只有后处理逻辑不同
   *
   * @param {Object} params - 参数对象
   * @param {string} params.input - 用户输入
   * @param {Array} params.attachments - 附件数组
   * @param {string} params.chartType - 图表类型
   * @param {string} params.systemPrompt - 系统提示词
   * @param {Function} params.userPromptTemplate - 用户提示词模板函数
   * @param {Function} params.postProcessFn - 后处理函数（引擎特定）
   * @param {Function} params.sseParserFn - SSE 解析函数（可选，默认标准解析）
   * @param {string} params.editor - 引擎类型 ('drawio' | 'excalidraw')
   * @param {Function} params.showNotification - 通知函数
   */
  const handleSendMessageTemplate = useCallback(
    async ({
      input,
      attachments = [],
      chartType = 'auto',
      systemPrompt,
      userPromptTemplate,
      postProcessFn,
      sseParserFn = parseSSEStream,
      editor,
      showNotification,
    }) => {
      const trimmed = (input || '').trim();
      if (!trimmed && (!attachments || attachments.length === 0)) return;

      try {
        setIsGenerating(true);
        setStreamingContent('');
        setLastError(null);

        // 1. 验证 LLM 配置
        const llmConfig = validateConfig(showNotification);
        if (!llmConfig) return;

        // 2. 构造 System Message
        const systemMessage = {
          role: 'system',
          content: systemPrompt,
        };

        // 3. 构造 User Message（应用模板）
        const userContent = userPromptTemplate(trimmed, chartType);
        const userMessage = await buildUserMessage(userContent, attachments);

        // 4. 组装完整 messages（包含历史）
        const fullMessages = buildFullMessages(systemMessage, userMessage, messages, 3);

        // 追踪 user message
        setMessages((prev) => [...prev, userMessage]);
        await historyManager.addMessage(conversationId, userMessage, editor, llmConfig, chartType);

        // 5. 调用后端流式接口
        const response = await callLLMStream(llmConfig, fullMessages);

        // 6. 处理 SSE 流
        const accumulatedCode = await sseParserFn(response, {
          onChunk: (content) => setStreamingContent(content),
        });

        // 7. 结束流式，清空 streamingContent
        setStreamingContent('');

        // 8. 后处理代码（引擎特定逻辑）
        const finalCode = postProcessFn(accumulatedCode);

        const assistantMessage = {
          role: 'assistant',
          content: finalCode,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        await historyManager.addMessage(conversationId, assistantMessage, editor, llmConfig, chartType);

        // 返回最终代码（供引擎自动应用）
        return finalCode;
      } catch (error) {
        console.error('Generate error:', error);
        setStreamingContent('');

        const errorMessage = error.message || '生成失败';
        setLastError(errorMessage);

        // Add error message to chat
        const errorChatMessage = {
          role: 'system',
          content: `❌ 错误: ${errorMessage}`,
        };
        setMessages((prev) => [...prev, errorChatMessage]);

        if (showNotification) {
          showNotification({
            title: '生成失败',
            message: errorMessage,
            type: 'error',
          });
        }

        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [
      conversationId,
      messages,
      buildUserMessage,
      buildFullMessages,
      callLLMStream,
      validateConfig,
      setIsGenerating,
      setStreamingContent,
      setMessages,
      setLastError,
    ]
  );

  /**
   * 基于现有消息历史，针对某一条 AI 回复执行「重新生成」：
   * - 截断当前 messages：保留目标消息之前的所有消息
   * - 复用其前一条 user 消息作为本次请求输入
   * - 使用相同 systemPrompt 和后处理逻辑重新调用 LLM
   *
   * @param {Object} params - 参数对象
   * @param {number} params.targetIndex - 需要重试的目标消息在 messages 中的索引
   * @param {string} params.systemPrompt - 系统提示词
   * @param {Function} params.postProcessFn - 后处理函数（引擎特定）
   * @param {Function} params.sseParserFn - SSE 解析函数（可选，默认标准解析）
   * @param {string} params.editor - 引擎类型 ('drawio' | 'excalidraw')
   * @param {Function} params.showNotification - 通知函数
   */
  const handleRetryMessageTemplate = useCallback(
    async ({
      targetIndex,
      systemPrompt,
      postProcessFn,
      sseParserFn = parseSSEStream,
      editor,
      showNotification,
    }) => {
      if (typeof targetIndex !== 'number') return;

      const currentMessages = messages || [];
      if (targetIndex < 0 || targetIndex >= currentMessages.length) return;

      const target = currentMessages[targetIndex];
      if (!target) return;

      // 寻找目标消息之前最近的一条 user 消息
      let userIndex = -1;
      for (let i = targetIndex - 1; i >= 0; i -= 1) {
        const m = currentMessages[i];
        if (m && m.role === 'user') {
          userIndex = i;
          break;
        }
      }
      if (userIndex === -1) return;

      const userMessage = currentMessages[userIndex];

      // messages 截断到目标消息之前（包含 userMessage 本身）
      const truncatedMessages = currentMessages.slice(0, targetIndex);

      // 构造历史：仅使用 userMessage 之前的对话片段
      const historyForBuild = currentMessages.slice(0, userIndex);

      try {
        setIsGenerating(true);
        setStreamingContent('');
        setLastError(null);

        // 验证配置
        const llmConfig = validateConfig(showNotification);
        if (!llmConfig) return;

        const systemMessage = {
          role: 'system',
          content: systemPrompt,
        };

        const fullMessages = buildFullMessages(
          systemMessage,
          userMessage,
          historyForBuild,
          3
        );

        // 先在前端截断消息列表，立即反映到 UI
        setMessages(truncatedMessages);

        const response = await callLLMStream(llmConfig, fullMessages);

        const accumulatedCode = await sseParserFn(response, {
          onChunk: (content) => setStreamingContent(content),
        });

        setStreamingContent('');

        const finalCode = postProcessFn(accumulatedCode);

        const assistantMessage = {
          role: 'assistant',
          content: finalCode,
        };

        const nextMessages = [...truncatedMessages, assistantMessage];
        setMessages(nextMessages);
        await historyManager.replaceConversation(
          conversationId,
          nextMessages,
          editor,
          llmConfig
        );

        return finalCode;
      } catch (error) {
        console.error('Generate (retry) error:', error);
        setStreamingContent('');

        const errorMessage = error.message || '生成失败';
        setLastError(errorMessage);

        const errorChatMessage = {
          role: 'system',
          content: `❌ 错误: ${errorMessage}`,
        };
        setMessages((prev) => [...prev, errorChatMessage]);

        if (showNotification) {
          showNotification({
            title: '生成失败',
            message: errorMessage,
            type: 'error',
          });
        }

        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [
      messages,
      conversationId,
      buildFullMessages,
      callLLMStream,
      validateConfig,
      setIsGenerating,
      setStreamingContent,
      setMessages,
      setLastError,
    ]
  );

  /**
   * 新建对话：重置状态
   */
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setUsedCode('');
    setStreamingContent('');
    setLastError(null);
    setConversationId(newConversationId());
  }, []);

  /**
   * 恢复历史对话基础逻辑
   * @param {Object} history - 历史记录对象
   * @param {Function} applyCodeFn - 应用代码的函数
   */
  const restoreHistoryBase = useCallback(
    async (history, applyCodeFn) => {
      try {
        setConversationId(history.id);

        const msgs = await historyManager.getConversationMessages(history.id);
        const safeMsgs = Array.isArray(msgs) ? msgs : [];
        setMessages(safeMsgs);

        if (applyCodeFn) {
          const lastAssistant = [...safeMsgs].reverse().find(
            (m) => m && m.role === 'assistant' && typeof m.content === 'string',
          );
          const code = lastAssistant?.content || '';
          await applyCodeFn(code);
        }
      } catch (error) {
        console.error('Restore history error:', error);
      }
    },
    []
  );

  return {
    // 状态
    usedCode,
    setUsedCode,
    messages,
    setMessages,
    isGenerating,
    setIsGenerating,
    streamingContent,
    setStreamingContent,
    conversationId,
    setConversationId,
    lastError,
    setLastError,

    // 工具函数
    fileToBase64,
    buildUserMessage,
    buildFullMessages,
    callLLMStream,
    validateConfig,

    // 模板方法（核心）
    handleSendMessageTemplate,
    handleRetryMessageTemplate,

    // 操作
    handleNewChat,
    restoreHistoryBase,

    // SSE 解析器（导出供特殊需求使用）
    parseSSEStream,
    parseSSEStreamAlt,
  };
}
