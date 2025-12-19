'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import AppHeader from '@/components/AppHeader';
import dynamic from 'next/dynamic';
import FloatingChat from '@/components/FloatingChat';
import FloatingCodeEditor from '@/components/FloatingCodeEditor';
import ConfigManager from '@/components/ConfigManager';
import ContactModal from '@/components/ContactModal';
import HistoryModal from '@/components/HistoryModal';
import CombinedSettingsModal from '@/components/CombinedSettingsModal';
import Notification from '@/components/Notification';
import ConfirmDialog from '@/components/ConfirmDialog';
import { configService } from '@/lib/config-service';
import { useEngine } from '@/hooks/useEngine';
import { drawioProcessor, excalidrawProcessor } from '@/lib/code-processor';

// Dynamically import Canvas components to avoid SSR issues
const DrawioCanvas = dynamic(() => import('@/components/DrawioCanvas'), {
  ssr: false,
});

const ExcalidrawCanvas = dynamic(() => import('@/components/ExcalidrawCanvas'), {
  ssr: false,
});

export default function DrawPage() {
  // 引擎类型状态（核心状态）
  const [engineType, setEngineType] = useState('drawio'); // 'drawio' | 'excalidraw'

  // 调用useEngine Hook获取引擎实例
  const engine = useEngine(engineType);

  // 配置状态
  const [config, setConfig] = useState(null);
  const [usePassword, setUsePassword] = useState(false);

  // 模态框状态
  const [isConfigManagerOpen, setIsConfigManagerOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCombinedSettingsOpen, setIsCombinedSettingsOpen] = useState(false);

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning'
  });

  // 通知状态
  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Chat面板宽度（用于调整画布padding）
  const [chatPanelWidth, setChatPanelWidth] = useState(0);

  // 待恢复的历史记录（用于引擎切换后自动恢复）
  const [pendingHistory, setPendingHistory] = useState(null);

  // 清空悬浮代码编辑器缓存和内容（在引擎切换时调用）
  const clearFloatingCodeCache = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const ls = window.localStorage;
      const keysToRemove = [];
      for (let i = 0; i < ls.length; i += 1) {
        const key = ls.key(i);
        if (!key) continue;
        if (key.startsWith('smart-diagram-floating-code-cache')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => {
        try {
          ls.removeItem(key);
        } catch {
          // ignore single-key errors
        }
      });
    } catch (e) {
      console.error('Failed to clear floating code cache:', e);
    }

    try {
      window.dispatchEvent(new CustomEvent('floating-code-editor-reset'));
    } catch (e) {
      console.error('Failed to dispatch floating code editor reset event:', e);
    }
  }, []);

  // 在客户端挂载后，从 localStorage 恢复引擎类型，避免 SSR 与 CSR 初始值不一致
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined'
        ? localStorage.getItem('smart-diagram-engine-type')
        : null;
      if (saved === 'drawio' || saved === 'excalidraw') {
        setEngineType(saved);
      }
    } catch (e) {
      console.error('Failed to read engine type from localStorage:', e);
    }
  }, []);

  // 将当前引擎类型持久化到 localStorage，便于刷新后恢复
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('smart-diagram-engine-type', engineType);
    } catch (e) {
      console.error('Failed to save engine type to localStorage:', e);
    }
  }, [engineType]);

  // 引擎切换完成后，自动恢复待处理的历史记录
  useEffect(() => {
    if (!pendingHistory) return;
    // 确保引擎类型已切换到目标类型
    if (pendingHistory.editor !== engineType) return;

    // 恢复历史记录
    const restoreHistory = async () => {
      try {
        await engine.handleRestoreHistory(pendingHistory);
        setIsHistoryModalOpen(false);
        showNotification({ title: '已恢复', message: '历史记录已恢复', type: 'success' });
      } catch (e) {
        console.error('Failed to restore history:', e);
        showNotification({ title: '恢复失败', message: '历史记录恢复失败', type: 'error' });
      } finally {
        setPendingHistory(null);
      }
    };

    restoreHistory();
  }, [engineType, pendingHistory, engine, showNotification]);

  // Load config on mount and listen for config changes
  useEffect(() => {
    const savedConfig = configService.getCurrentConfig();
    if (savedConfig) {
      setConfig(savedConfig);
    }

    // Load password access state
    const passwordEnabled = configService.isPasswordMode();
    setUsePassword(passwordEnabled);

    // Listen for unified config change event
    const handleConfigChange = (e) => {
      const newConfig = e.detail?.config || configService.getCurrentConfig();
      setConfig(newConfig);
      setUsePassword(configService.isPasswordMode());
    };

    // Listen for storage changes to sync across tabs (fallback)
    const handleStorageChange = (e) => {
      const key = e?.key;

      // 任意 LLM 配置相关 key 变化时，重新计算"最终生效配置"
      const configKeys = [
        'smart-diagram-local-configs',
        'smart-diagram-active-local-config',
        'smart-diagram-remote-config',
        'smart-diagram-use-password',
      ];

      if (!key || configKeys.includes(key)) {
        const newConfig = configService.getCurrentConfig();
        setConfig(newConfig);
        setUsePassword(configService.isPasswordMode());
      }
    };

    window.addEventListener('config-changed', handleConfigChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('config-changed', handleConfigChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Listen for chat panel open/close and width to set right padding
  useEffect(() => {
    const onVisibility = (e) => {
      try {
        const open = !!e?.detail?.open;
        const width = Number(e?.detail?.width || 0);
        setChatPanelWidth(open ? width : 0);
      } catch {
        setChatPanelWidth(0);
      }
    };
    window.addEventListener('chatpanel-visibility-change', onVisibility);
    return () => window.removeEventListener('chatpanel-visibility-change', onVisibility);
  }, []);

  // Notification helpers
  const showNotification = useCallback((opts) => {
    setNotification({ isOpen: true, title: opts.title || '', message: opts.message || '', type: opts.type || 'info' });
  }, []);

  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * 引擎切换处理
   * 弹窗确认，切换后清空对话和画布
   */
  const handleEngineSwitch = useCallback((newEngine) => {
    if (newEngine === engineType) return;

    // 弹窗确认
    setConfirmDialog({
      isOpen: true,
      title: '切换绘图引擎',
      message: '切换绘图引擎将清空当前对话历史和画布内容，确定要切换吗？',
      type: 'warning',
      onConfirm: () => {
        clearFloatingCodeCache();
        setEngineType(newEngine);
        // 调用引擎的handleNewChat清空状态
        engine.handleNewChat();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [engineType, engine, clearFloatingCodeCache]);

  /**
   * 发送消息处理
   * 调用引擎的handleSendMessage
   */
  const handleSendMessage = useCallback(async (input, attachments, chartType) => {
    await engine.handleSendMessage(input, attachments, chartType, config, showNotification);
  }, [engine, config, showNotification]);

  /**
   * 针对指定的 AI 消息执行重试
   */
  const handleRetryMessage = useCallback(async (messageIndex) => {
    if (!engine || typeof engine.handleRetryMessage !== 'function') return;
    await engine.handleRetryMessage(messageIndex, showNotification);
  }, [engine, showNotification]);

  /**
   * 从外部（如聊天面板）应用代码
   * 需要触发事件同步给 FloatingCodeEditor
   */
  const handleChatApplyCode = useCallback(async (code) => {
    const targetCode = typeof code === 'string' ? code : '';
    await engine.handleApplyCode(code);
    if (!targetCode || typeof window === 'undefined') return;
    try {
      window.dispatchEvent(
        new CustomEvent('canvas-code-changed', {
          detail: {
            engineType,
            code: targetCode,
            // open:true,
          },
        }),
      );
    } catch (error) {
      console.error('Failed to dispatch canvas code change event:', error);
    }
  }, [engine, engineType]);

  /**
   * 直接从 FloatingCodeEditor 应用代码
   * 编辑器本身已通过事件获得代码，不需要额外派发
   */
  const handleEditorApplyCode = useCallback(async (code) => {
    await engine.handleApplyCode(code);
  }, [engine]);

  /**
   * 代码处理函数
   * 根据引擎类型调用相应的代码处理管道
   * 流程：代码检测修复 -> 返回修复后的代码
   */
  const processCode = useCallback((code) => {
    if (engineType === 'excalidraw') {
      return excalidrawProcessor.process(code);
    }
    return drawioProcessor.process(code);
  }, [engineType]);

  /**
   * Draw.io 画布 autosave 回调
   * 仍然调用引擎的 handleCanvasChange 做持久化
   */
  const handleDrawioAutosave = useCallback(async (code) => {
    await engine.handleCanvasChange(code);
  }, [engine]);

  /**
   * 新建对话处理
   * 调用引擎的handleNewChat，同时清空代码编辑器
   */
  const handleNewChat = useCallback(() => {
    clearFloatingCodeCache();
    engine.handleNewChat();
  }, [engine, clearFloatingCodeCache]);

  /**
   * 恢复历史记录处理
   * 检查引擎类型是否匹配，不匹配时询问是否切换
   */
  const handleApplyHistory = useCallback(async (history) => {
    if (!history) return;
    console.log('history', history);

    // 检查引擎类型是否匹配
    if (history.editor && history.editor !== engineType) {
      setConfirmDialog({
        isOpen: true,
        title: '切换引擎',
        message: `该历史记录使用的是 ${history.editor === 'drawio' ? 'Draw.io' : 'Excalidraw'} 引擎，当前是 ${engineType === 'drawio' ? 'Draw.io' : 'Excalidraw'} 引擎。\n\n是否切换引擎？切换后将清空当前对话。`,
        type: 'warning',
        onConfirm: () => {
          clearFloatingCodeCache();
          // 保存待恢复的历史，引擎切换后由 useEffect 自动恢复
          setPendingHistory(history);
          setEngineType(history.editor);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }

    // 引擎类型匹配，直接恢复
    await engine.handleRestoreHistory(history);
    setIsHistoryModalOpen(false);
    showNotification({ title: '已恢复', message: '历史记录已恢复', type: 'success' });
  }, [engineType, engine, showNotification, clearFloatingCodeCache]);

  /**
   * 缓存 Excalidraw elements 解析结果
   * 只有当 usedCode 真正改变时才重新解析，避免流式更新时频繁重新渲染
   */
  const excalidrawElements = useMemo(() => {
    if (engineType !== 'excalidraw' || !engine.usedCode) return [];

    try {
      const parsed = JSON.parse(engine.usedCode);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.elements)) return parsed.elements;
      if (parsed && Array.isArray(parsed.items)) return parsed.items;
      return [];
    } catch (e) {
      return [];
    }
  }, [engineType, engine.usedCode]);

  /**
   * 渲染画布组件
   * 根据engineType动态渲染DrawioCanvas或ExcalidrawCanvas
   */
  const renderCanvas = () => {
    if (engineType === 'excalidraw') {
      // Excalidraw需要解析JSON为elements
      return (
        <ExcalidrawCanvas
          elements={excalidrawElements}
          showNotification={showNotification}
          onChange={(newElements) => {
            try {
              const code = JSON.stringify(newElements || [], null, 2);
              window.dispatchEvent(
                new CustomEvent('canvas-code-changed', {
                  detail: {
                    engineType: 'excalidraw',
                    code,
                  },
                }),
              );
            } catch (error) {
              console.error('Failed to serialize Excalidraw elements:', error);
            }
          }}
        />
      );
    }

    // Draw.io直接使用XML
    return (
      <DrawioCanvas
        xml={engine.usedCode}
        autosave
        onSave={(xmlOrData) => {
          // 提取XML并通过事件通知代码编辑器
          const xml = typeof xmlOrData === 'string' ? xmlOrData : (xmlOrData?.data || '');
          if (!xml) return;

          window.dispatchEvent(
            new CustomEvent('canvas-code-changed', {
              detail: {
                engineType: 'drawio',
                code: xml
              },
            }),
          );
        }}
        // onAutosave={handleDrawioAutosave}
      />
    );
  };

  return (
    // <div className="flex flex-col h-screen bg-gray-50" style={{ paddingRight: chatPanelWidth || 0 }}>
    <div className="flex flex-col h-screen bg-gray-50" style={{ paddingRight: 0 }}>
      {/* Header */}
      <AppHeader />

      {/* Main Content - Full Screen Canvas */}
      <div className="flex-1 overflow-hidden">
        {renderCanvas()}
      </div>

      {/* Floating Chat */}
      <FloatingChat
        engineType={engineType}
        onEngineSwitch={handleEngineSwitch}
        onSendMessage={handleSendMessage}
        onRetryMessage={handleRetryMessage}
        onApplyCode={handleChatApplyCode}
        isGenerating={engine.isGenerating}
        messages={engine.messages}
        streamingContent={engine.streamingContent} // ✨ 传递流式内容
        onNewChat={handleNewChat}
        conversationId={engine.conversationId}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenSettings={() => setIsCombinedSettingsOpen(true)}
      />

      {/* Floating Code Editor */}
      <FloatingCodeEditor
        engineType={engineType}
        onApplyCode={handleEditorApplyCode}
        processCode={processCode}
        messages={engine.messages}
      />

      {/* Config Manager Modal */}
      <ConfigManager
        isOpen={isConfigManagerOpen}
        onClose={() => setIsConfigManagerOpen(false)}
        onConfigSelect={(selectedConfig) => setConfig(selectedConfig)}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onApply={handleApplyHistory}
        editorType={engineType}
      />

      {/* Combined Settings Modal */}
      <CombinedSettingsModal
        isOpen={isCombinedSettingsOpen}
        onClose={() => setIsCombinedSettingsOpen(false)}
        usePassword={usePassword}
        currentConfig={config}
        onConfigSelect={(newConfig) => {
          setConfig(newConfig);
        }}
      />

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {/* Notification */}
      <Notification
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  );
}
