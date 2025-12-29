'use client';

import { useCallback } from 'react';
import { fixJSON } from '@/lib/fixUnclosed';
import { optimizeExcalidrawCode } from '@/lib/optimizeArrows';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from '@/lib/prompts/excalidraw';
import { excalidrawProcessor } from '@/lib/code-processor';
import { useEngineShared } from './useEngineShared';

/**
 * Excalidraw 引擎 Hook
 * 使用模板方法处理消息发送，只定义特定的后处理逻辑
 */
export function useExcalidrawEngine() {
  // 使用共享的引擎逻辑
  const shared = useEngineShared();

  const {
    usedCode,
    setUsedCode,
    messages,
    isGenerating,
    streamingContent,
    conversationId,
    lastError,
    handleSendMessageTemplate,
    handleNewChat,
    restoreHistoryBase,
    parseSSEStreamAlt,
    handleRetryMessageTemplate,
  } = shared;

  /**
   * 后处理 Excalidraw JSON 代码：使用代码处理管道
   */
  const postProcessExcalidrawCode = useCallback((code) => {
    return excalidrawProcessor.process(code);
  }, []);

  /**
   * 将 JSON 文本解析为 Excalidraw elements 数组
   */
  const parseElements = useCallback((jsonText) => {
    try {
      // const fixed = fixJSON(jsonText || '');
      const optimized = optimizeExcalidrawCode
        ? optimizeExcalidrawCode(jsonText)
        : jsonText;
      const data = JSON.parse(optimized);

      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.elements)) return data.elements;
      if (data && Array.isArray(data.items)) return data.items;

      return [];
    } catch (e) {
      console.error('Failed to parse Excalidraw JSON:', e);
      return [];
    }
  }, []);

  /**
   * 应用代码到画布：
   * - 解析 / 修复 / 优化 JSON
   * - 更新 usedCode
   * - 写入本地状态
   */
  const handleApplyCode = useCallback(
    async (code) => {
      try {
        const processed = postProcessExcalidrawCode(code || '');
        const fixed = fixJSON(processed);
        const optimized = optimizeExcalidrawCode
          ? optimizeExcalidrawCode(fixed)
          : fixed;

        setUsedCode(optimized);
      } catch (error) {
        console.error('Apply code error:', error);
      }
    },
    [postProcessExcalidrawCode, setUsedCode],
  );

  /**
   * 发送消息并调用 LLM：
   * 使用模板方法，只需提供 Excalidraw 特定的后处理逻辑
   * 注意：不再自动应用到画布，由用户通过编辑器点击"应用"按钮
   */
  const handleSendMessage = useCallback(
    async (input, attachments = [], chartType = 'auto', _unusedConfig, showNotification) => {
      try {
        // 调用模板方法，传入 Excalidraw 特定的配置
        // 生成的代码会通过 streamingContent 传递给编辑器
        await handleSendMessageTemplate({
          input,
          attachments,
          chartType,
          systemPrompt: SYSTEM_PROMPT,
          userPromptTemplate: USER_PROMPT_TEMPLATE,
          postProcessFn: postProcessExcalidrawCode,
          sseParserFn: parseSSEStreamAlt, // Excalidraw 使用备用解析器
          editor: 'excalidraw',
          showNotification,
        });

        // 不再自动应用到画布，由用户通过编辑器点击"应用"按钮
      } catch (error) {
        // 错误已在模板方法中处理
        console.error('Excalidraw message send error:', error);
      }
    },
    [handleSendMessageTemplate, postProcessExcalidrawCode, parseSSEStreamAlt]
  );

  /**
   * 针对指定的 assistant 消息执行重试：
   * - 截断该消息及其之后的历史
   * - 复用其前一条 user 消息重新调用 LLM
   */
  const handleRetryMessage = useCallback(
    async (targetIndex, showNotification) => {
      try {
        await handleRetryMessageTemplate({
          targetIndex,
          systemPrompt: SYSTEM_PROMPT,
          postProcessFn: postProcessExcalidrawCode,
          sseParserFn: parseSSEStreamAlt,
          editor: 'excalidraw',
          showNotification,
        });
      } catch (error) {
        console.error('Excalidraw message retry error:', error);
      }
    },
    [handleRetryMessageTemplate, postProcessExcalidrawCode, parseSSEStreamAlt]
  );

  /**
   * 画布编辑回调：
   * - 将 elements 序列化为 JSON
   * - 更新 usedCode
   * - 写入本地状态
  */
  const handleCanvasChange = useCallback(
    async (elements) => {
      try {
        const code = JSON.stringify(elements);
        setUsedCode(code);
      } catch (error) {
        console.error('Canvas change error:', error);
      }
    },
    [setUsedCode],
  );

  /**
   * 恢复历史对话：
   * - 恢复 conversationId
   * - 恢复 messages
   * - 应用 usedCode 到画布
   */
  const handleRestoreHistory = useCallback(
    async (history) => {
      await restoreHistoryBase(history, handleApplyCode);
    },
    [restoreHistoryBase, handleApplyCode],
  );

  // 对外暴露引擎能力
  return {
    // 状态
    usedCode,
    messages,
    isGenerating,
    conversationId,
    streamingContent,
    lastError,

    // 工具（给外部使用）
    parseElements,

    // 操作
    handleSendMessage,
    handleRetryMessage,
    handleApplyCode,
    handleCanvasChange,
    handleNewChat,
    handleRestoreHistory,
  };
}
