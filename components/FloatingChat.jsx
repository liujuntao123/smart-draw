'use client';

import { useState, useEffect, useRef } from 'react';
import { WandSparkles, Send, Plus, Image as ImageIcon, Bot, MessageSquarePlus, Minimize2, Copy, Check, Code2, X as XIcon, FileText, CheckCircle2, ChevronDown, SquareMousePointer, Settings, Clock, MoveUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button.jsx';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Small helper to trigger <input type="file" multiple accept="image/*">
function ImagePicker({ onPick, children }) {
  const inputRef = useRef(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length && onPick) onPick(files);
          // Reset value so selecting the same file again still triggers change
          e.target.value = '';
        }}
      />
      <span onClick={() => inputRef.current?.click()}>{children}</span>
    </>
  );
}

// Helper to trigger <input type="file" accept=".md,.txt">
function TextFilePicker({ onPick, children }) {
  const inputRef = useRef(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".md,.txt,text/markdown,text/plain"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length && onPick) onPick(files);
          e.target.value = '';
        }}
      />
      <span onClick={() => inputRef.current?.click()}>{children}</span>
    </>
  );
}

export default function FloatingChat({
  engineType = 'drawio', // ✨ v6.0: 当前引擎类型
  onEngineSwitch, // ✨ v6.0: 引擎切换回调
  onSendMessage,
  isGenerating,
  messages = [],
  streamingContent = '', // ✨ 流式生成中的内容
  onFileUpload,
  onImageUpload,
  onNewChat,
  onApplyXml, // ⚠️ Deprecated, use onApplyCode
  onApplyCode, // ✨ v6.0: 应用代码回调
  conversationId,
  onOpenHistory,
  onOpenSettings,
  onRetryMessage,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const panelRef = useRef(null);

  // ✨ 收起按钮的可拖拽位置状态
  const [collapsedY, setCollapsedY] = useState(() => {
    // 从 localStorage 读取保存的位置，默认 168px (top-42 = 10.5rem = 168px)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smart-diagram-collapsed-btn-y');
      if (saved) return parseInt(saved, 10);
    }
    return 168;
  });
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false); // 标记是否发生过真正的拖拽
  const dragStartYRef = useRef(0);
  const dragStartTopRef = useRef(0);
  const [input, setInput] = useState('');
  const [images, setImages] = useState([]); // {file, url, name, type}
  const [files, setFiles] = useState([]); // {file, name, type, size}
  const [chartType, setChartType] = useState('auto');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showEngineMenu, setShowEngineMenu] = useState(false); // ✨ v6.0: 引擎切换菜单
  const typeMenuRef = useRef(null);
  const typeMenuButtonRef = useRef(null);
  const engineMenuRef = useRef(null); // ✨ v6.0
  const engineMenuButtonRef = useRef(null); // ✨ v6.0
  const bottomRef = useRef(null);
  const [shouldStickToBottom, setShouldStickToBottom] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(-1);

  // ✨ v6.0: 引擎选项
  const engineOptions = [
    { value: 'drawio', label: 'Draw.io' },
    { value: 'excalidraw', label: 'Excalidraw' },
  ];
  const currentEngineLabel = engineOptions.find(o => o.value === engineType)?.label || 'Draw.io';

  const chartTypeOptions = [
    { value: 'auto', label: '自动' },
    { value: 'flowchart', label: '流程图' },
    { value: 'mindmap', label: '思维导图' },
    { value: 'orgchart', label: '组织架构图' },
    { value: 'sequence', label: '时序图' },
    { value: 'class', label: 'UML类图' },
    { value: 'er', label: 'ER图' },
    { value: 'gantt', label: '甘特图' },
    { value: 'timeline', label: '时间线' },
    { value: 'tree', label: '树形图' },
    { value: 'network', label: '网络拓扑图' },
    { value: 'architecture', label: '架构图' },
    { value: 'dataflow', label: '数据流图' },
    { value: 'state', label: '状态图' },
    { value: 'swimlane', label: '泳道图' },
    { value: 'concept', label: '概念图' },
    { value: 'fishbone', label: '鱼骨图' },
    { value: 'swot', label: 'SWOT分析图' },
    { value: 'pyramid', label: '金字塔图' },
    { value: 'funnel', label: '漏斗图' },
    { value: 'venn', label: '韦恩图' },
    { value: 'matrix', label: '矩阵图' },
    { value: 'infographic', label: '信息图' },
  ];
  const currentTypeLabel = chartTypeOptions.find(o => o.value === chartType)?.label || '自动识别';

  const handleSend = async () => {
    if ((input.trim() === '' && images.length === 0 && files.length === 0) || isGenerating) return;

    // Read text files to string
    const readText = (file) => new Promise((resolve) => {
      try {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => resolve('');
        reader.readAsText(file);
      } catch (e) {
        resolve('');
      }
    });

    const typedText = input.trim();
    let combinedText = typedText;
    if (files.length > 0) {
      const texts = await Promise.all(files.map(({ file, name }) => readText(file).then(t => ({ name, text: t }))));
      const parts = texts
        .map(({ name, text }) => {
          const safe = (text || '').toString();
          if (!safe) return '';
          return `# 来自文件: ${name}\n\n${safe}`;
        })
        .filter(Boolean);
      if (parts.length) {
        combinedText = [combinedText, ...parts].filter(Boolean).join('\n\n');
      }
    }

    // Pass images up so the page can serialize and send
    // Combine images and files into attachments array
    const attachments = [
      ...images.map(({ file, type, name }) => ({ file, type, name, kind: 'image', url: URL.createObjectURL(file) })),
      ...files.map(({ file, name, type, size }) => ({ file, name, type, size, kind: 'file' }))
    ];
    onSendMessage(combinedText, attachments, chartType);

    // Clear input and caches
    setInput('');
    images.forEach(img => img.url && URL.revokeObjectURL(img.url));
    setImages([]);
    setFiles([]);
  };

  // Auto-resize textarea
  const textareaRef = useRef(null);
  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };
  useEffect(() => {
    adjustTextareaHeight();
  }, [input, isOpen]);

  // Auto scroll chat to bottom on updates
  useEffect(() => {
    try {
      if (!bottomRef.current) return;
      const viewport = bottomRef.current.parentElement?.parentElement;
      if (!viewport) return;
      const atBottom = Math.abs((viewport.scrollHeight - viewport.scrollTop) - viewport.clientHeight) <= 2;
      if (shouldStickToBottom || atBottom) {
        bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
      }
    } catch {}
  }, [messages, isGenerating, isOpen, shouldStickToBottom, streamingContent]);


  // Reset input and selected attachments when conversation changes (new chat)
  useEffect(() => {
    if (!conversationId) return;
    setInput('');
    // Revoke any object URLs to avoid leaks
    try {
      images?.forEach(img => img?.url && URL.revokeObjectURL(img.url));
    } catch {}
    setImages([]);
    setFiles([]);
  }, [conversationId]);

  // Close chart type menu on outside click or Escape
  useEffect(() => {
    if (!showTypeMenu) return;
    const handleClickOutside = (e) => {
      const menuEl = typeMenuRef.current;
      const buttonEl = typeMenuButtonRef.current;
      if (
        menuEl && !menuEl.contains(e.target) &&
        (!buttonEl || !buttonEl.contains(e.target))
      ) {
        setShowTypeMenu(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowTypeMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [showTypeMenu]);

  // ✨ v6.0: Close engine menu on outside click or Escape
  useEffect(() => {
    if (!showEngineMenu) return;
    const handleClickOutside = (e) => {
      const menuEl = engineMenuRef.current;
      const buttonEl = engineMenuButtonRef.current;
      if (
        menuEl && !menuEl.contains(e.target) &&
        (!buttonEl || !buttonEl.contains(e.target))
      ) {
        setShowEngineMenu(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowEngineMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [showEngineMenu]);

  // Notify page about chat panel visibility and width to allow padding adjustment
  useEffect(() => {
    const notify = () => {
      try {
        const rect = isOpen && panelRef.current ? panelRef.current.getBoundingClientRect() : null;
        const reserve = rect ? Math.round(Math.max(0, window.innerWidth - rect.left)) : 0; // includes right-2 gap
        window.dispatchEvent(
          new CustomEvent('chatpanel-visibility-change', {
            detail: { open: !!isOpen, width: reserve }
          })
        );
      } catch {}
    };

    if (isOpen) {
      // Wait for layout to settle before measuring
      const id = requestAnimationFrame(notify);
      const onResize = () => notify();
      window.addEventListener('resize', onResize);
      return () => {
        cancelAnimationFrame(id);
        window.removeEventListener('resize', onResize);
      };
    } else {
      // When closed, send width 0
      notify();
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Backspace removes last image chip when text cursor at start and no selection
    if (e.key === 'Backspace') {
      const el = textareaRef.current;
      const atStart = el && el.selectionStart === 0 && el.selectionEnd === 0;
      const hasAnyChips = images.length > 0 || files.length > 0;
      if (atStart && hasAnyChips) {
        e.preventDefault();
        if (images.length > 0) {
          const last = images[images.length - 1];
          if (last?.url) URL.revokeObjectURL(last.url);
          setImages(prev => prev.slice(0, -1));
        } else if (files.length > 0) {
          setFiles(prev => prev.slice(0, -1));
        }
      }
    }
  };

  // Detect code content (Draw.io XML or Excalidraw JSON)
  const isCodeContent = (text = '') => {
    if (typeof text !== 'string') return false;
    const trimmed = text.trim();
    if (/```(xml|json)[\s\S]*```/i.test(trimmed)) return true;
    // Draw.io XML heuristics
    if (/^(<\?xml|<mxfile|<diagram|<mxGraphModel|<graph)/i.test(trimmed)) return true;
    // Excalidraw JSON heuristics
    if ((trimmed.startsWith('{') || trimmed.startsWith('[')) ) return true;
    return false;
  };

  const extractCode = (text = '') => {
    if (typeof text !== 'string') return text;
    // Prefer fenced blocks
    const fenced = text.match(/```\s*(xml|json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[2]) return fenced[2].trim();
    return text.trim();
  };

  const copyUserMessage = async (content = '', idx) => {
    try {
      let textToCopy = '';
      if (typeof content === 'string') {
        textToCopy = content;
      } else if (Array.isArray(content)) {
        const textContent = content.find(c => c.type === 'text');
        textToCopy = textContent?.text || '';
      } else {
        textToCopy = String(content || '');
      }
      await navigator.clipboard.writeText(textToCopy);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(-1), 1200);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  // ✨ 拖拽处理函数
  const handleDragStart = (e) => {
    // 阻止默认行为，避免选中文本
    e.preventDefault();
    isDraggingRef.current = true;
    hasDraggedRef.current = false; // 重置拖拽标记
    dragStartYRef.current = e.clientY || e.touches?.[0]?.clientY || 0;
    dragStartTopRef.current = collapsedY;

    // 用于存储最新的 Y 值，解决闭包问题
    let latestY = collapsedY;

    const handleDragMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const clientY = moveEvent.clientY || moveEvent.touches?.[0]?.clientY || 0;
      const deltaY = clientY - dragStartYRef.current;
      // 超过 5px 的移动才算真正的拖拽
      if (Math.abs(deltaY) > 5) {
        hasDraggedRef.current = true;
      }
      const newY = dragStartTopRef.current + deltaY;
      // 限制在视口范围内（留出按钮高度的边距）
      const minY = 16;
      const maxY = window.innerHeight - 72;
      const clampedY = Math.max(minY, Math.min(maxY, newY));
      latestY = clampedY;
      setCollapsedY(clampedY);
    };

    const handleDragEnd = () => {
      isDraggingRef.current = false;
      if (hasDraggedRef.current) {
        // 保存位置到 localStorage
        localStorage.setItem('smart-diagram-collapsed-btn-y', String(latestY));
      }
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
  };

  if (!isOpen) {
    return (
      <button
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onClick={() => {
          // 只有在没有发生拖拽时才触发点击
          if (!hasDraggedRef.current) {
            setIsOpen(true);
          }
        }}
        style={{ top: collapsedY }}
        className="fixed right-2 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-105 active:scale-95 transition-shadow cursor-grab active:cursor-grabbing flex items-center justify-center z-50 select-none"
      >
        <WandSparkles className="w-6 h-6 pointer-events-none" />
      </button>
    );
  }

  return (
    <>
    <Card ref={panelRef} className="fixed top-42 bottom-16 right-2 md:w-[340px] h-auto shadow-2xl flex flex-col z-50 bg-white/95 supports-[backdrop-filter]:bg-white/85 backdrop-blur-xl border border-zinc-200 rounded-[24px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white/50 border-b border-zinc-100/50">
        {/* ✨ v6.0: 左侧 - 引擎切换下拉菜单 */}
        <div className="relative flex items-center">
          <button
            ref={engineMenuButtonRef}
            onClick={() => setShowEngineMenu(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition-all group"
            title="切换绘图引擎"
          >
            <span>{currentEngineLabel}</span>
            <ChevronDown className={cn(
              'w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 transition-transform duration-200',
              showEngineMenu ? 'rotate-180' : 'rotate-0'
            )} />
          </button>

          {/* 引擎下拉菜单 */}
          {showEngineMenu && (
            <div
              ref={engineMenuRef}
              className="absolute left-0 top-full mt-2 w-40 bg-white border border-zinc-100 rounded-xl shadow-xl shadow-zinc-200/50 z-50 p-1 animate-in fade-in zoom-in-95 duration-100"
            >
              {engineOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setShowEngineMenu(false);
                    if (onEngineSwitch) onEngineSwitch(opt.value);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                    engineType === opt.value 
                      ? 'bg-zinc-100 text-zinc-900 font-medium' 
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 右侧 - 操作按钮 */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
            title="配置"
            onClick={() => onOpenSettings && onOpenSettings()}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
            title="历史记录"
            onClick={() => onOpenHistory && onOpenHistory()}
          >
            <Clock className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
            title="新建对话"
            onClick={() => (onNewChat ? onNewChat() : window.dispatchEvent(new CustomEvent('new-chat')))}
          >
            <MessageSquarePlus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
            title="收起面板"
            onClick={() => setIsOpen(false)}
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-5 py-2">
        <div className="space-y-6 ">
          {messages.length === 0 ? (
            <div className="flex flex-col py-6 gap-4">
              <div className="text-center text-zinc-400 text-sm mb-2">
                <p>选择一个示例开始，或直接输入需求</p>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { text: '画一个用户登录流程图', icon: '🔐' },
                  { text: '设计一个电商系统架构图', icon: '🏗️' },
                  { text: '创建一个项目管理思维导图', icon: '🧠' },
                  { text: '绘制公司组织架构图', icon: '👥' },
                  { text: '画一个订单状态流转图', icon: '📦' },
                  { text: '设计用户注册时序图', icon: '⏱️' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(item.text);
                      textareaRef.current?.focus();
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-100 bg-white hover:bg-zinc-50 hover:border-zinc-200 transition-all text-left group"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm text-zinc-600 group-hover:text-zinc-900">{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isUser = msg.role === 'user'
              const isSystem = msg.role === 'system'
              const isAssistant = msg.role === 'assistant'

              if (isSystem) {
                // Check if it's an error message
                const isError = msg.content && msg.content.includes('❌');
                return (
                  <div
                    key={idx}
                    className={cn(
                      'flex w-full my-4 text-xs',
                    )}
                  >
                    <div className="flex flex-col items-start gap-2">
                      <div
                        className={cn(
                          'px-4 py-1.5 rounded-full flex items-center gap-2 border shadow-sm',
                          isError
                            ? 'bg-red-50 border-red-100 text-red-600'
                            : 'bg-zinc-50 border-zinc-100 text-zinc-500'
                        )}
                      >
                        {isError ? <XIcon className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        <span>{msg.content}</span>
                      </div>
                      {isError && onRetryMessage && (
                        <button
                          type="button"
                          disabled={isGenerating}
                          onClick={() => onRetryMessage(idx)}
                          className={cn(
                            'mt-1.5 ml-1 inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors px-2 py-1 rounded-md hover:bg-zinc-50',
                            isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          )}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>重新生成</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={idx}
                  className={cn(
                    'flex w-full group',
                    isUser ? 'justify-end' : 'justify-start'
                  )}
                >
                  {(!isUser && (isCodeContent(msg.content))) ? (
                    <div className="flex flex-col items-start gap-2 w-full min-w-0 animate-in slide-in-from-left-2 duration-300">
                      <div className="flex items-center gap-2 mb-1 pl-1">
                         <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                             <WandSparkles className="w-3.5 h-3.5 text-white" />
                         </div>
                         <span className="text-xs font-medium text-zinc-500">AI 生成</span>
                      </div>
                      <CodeBubble
                        codeText={extractCode(msg.content)}
                        onApplyCode={onApplyCode}
                        onApplyXml={onApplyXml}
                      />
                      {isAssistant && onRetryMessage && (
                        <button
                          type="button"
                          disabled={isGenerating}
                          onClick={() => onRetryMessage(idx)}
                          className={cn(
                            'ml-1 inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors px-2 py-1 rounded-md hover:bg-zinc-100',
                            isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          )}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>重新生成</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={cn('flex flex-col max-w-[85%]', isUser ? 'items-end' : 'items-start')}>
                      
                      {!isUser && (
                        <div className="flex items-center gap-2 mb-1.5 pl-1">
                             <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                                 <WandSparkles className="w-3.5 h-3.5 text-white" />
                             </div>
                        </div>
                      )}

                      <div className="relative group/bubble">
                        {/* Copy button for user messages */}
                        {isUser && (
                            <button
                              onClick={() => copyUserMessage(msg.content, idx)}
                              className="absolute -left-8 top-2 opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full"
                              title="复制"
                            >
                              {copiedIndex === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        )}
                        
                        <div
                          className={cn(
                            'px-4 py-3 text-[14px] leading-6 shadow-sm whitespace-pre-wrap break-words break-all',
                            isUser 
                              ? 'bg-zinc-100 text-zinc-900 rounded-[20px] rounded-tr-sm' 
                              : 'bg-white border border-zinc-100 text-zinc-800 rounded-[20px] rounded-tl-sm'
                          )}
                        >
                          {msg.content && (
                            <div>
                              {typeof msg.content === 'string'
                                ? msg.content
                                : Array.isArray(msg.content)
                                  ? msg.content.find(c => c.type === 'text')?.text || ''
                                  : ''
                              }
                            </div>
                          )}
                          {isUser && Array.isArray(msg.content) && msg.content.some(c => c.type === 'image_url') && (
                            <div className={cn('mt-3 flex flex-wrap gap-2')}>
                              {msg.content.filter(c => c.type === 'image_url').map((im, i) => (
                                <img
                                  key={i}
                                  src={im.image_url?.url || ''}
                                  alt={`image-${i}`}
                                  className={cn(
                                    'w-20 h-20 rounded-lg object-cover ring-1 ring-black/5 shadow-sm'
                                  )}
                                />
                              ))}
                            </div>
                          )}
                          {isUser && Array.isArray(msg.files) && msg.files.length > 0 && (
                            <div className={cn('mt-3 flex flex-wrap gap-2')}>
                              {msg.files.map((f, i) => (
                                <span key={i} className={cn(
                                  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-700 shadow-sm'
                                )}>
                                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                                  <span className="truncate max-w-[160px]" title={f.name}>{f.name || 'file'}</span>
                                </span>
                              ))}
                            </div>
                          )}
                          {isUser && Array.isArray(msg.images) && msg.images.length > 0 && (
                            <div className={cn('mt-3 flex flex-wrap gap-2')}>
                              {msg.images.map((im, i) => (
                                <img
                                  key={i}
                                  src={im.url}
                                  alt={im.name || 'image'}
                                  className={cn(
                                    'w-20 h-20 rounded-lg object-cover ring-1 ring-black/5 shadow-sm'
                                  )}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {isAssistant && onRetryMessage && (
                        <button
                          type="button"
                          disabled={isGenerating}
                          onClick={() => onRetryMessage(idx)}
                          className={cn(
                            'mt-1.5 ml-1 inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors px-2 py-1 rounded-md hover:bg-zinc-50',
                            isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          )}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>重新生成</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
          {isGenerating && (
            <div className="flex justify-start w-full animate-in fade-in duration-300">
              <div className="w-full min-w-0">
                {/* ✨ 实时显示生成的代码 */}
                {streamingContent && streamingContent.trim() ? (
                   <div className="flex flex-col items-start gap-2 w-full min-w-0">
                     <div className="flex items-center gap-2 mb-1 pl-1">
                         <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center">
                             <WandSparkles className="w-3.5 h-3.5 text-zinc-400 animate-pulse" />
                         </div>
                         <span className="text-xs font-medium text-zinc-500">正在绘制...</span>
                      </div>
                      <StreamingCodeBubble codeText={streamingContent} />
                   </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50/80 border border-zinc-100 rounded-2xl w-fit">
                    <div className="flex space-x-1.5 items-center">
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-zinc-500">思考中...</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Auto-scroll sentinel */}
          <div id="chat-bottom-sentinel" ref={bottomRef} className="h-1" />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 pt-0 bg-transparent">
        <div className="relative">
          {/* Input Container */}
          <div
            className={cn(
              "flex flex-col bg-white border transition-all duration-200 rounded-2xl overflow-hidden shadow-sm",
              isGenerating
                ? "border-zinc-200 opacity-80"
                : "border-zinc-300 hover:border-zinc-400 focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary"
            )}
          >
            {/* Attachment Chips (overlay) */}
            {(files.length > 0 || images.length > 0) && (
              <div className="px-3 pt-3 flex flex-wrap gap-2">
                {/* text files */}
                {files.map((f, idx) => (
                  <div
                    key={`f-${idx}`}
                    className="group flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-md border border-zinc-200 bg-zinc-50"
                  >
                    <div className="flex items-center justify-center w-5 h-5 rounded bg-white border border-zinc-100 text-zinc-500">
                      <FileText className="w-3 h-3" />
                    </div>
                    <span className="text-xs text-zinc-700 truncate max-w-[120px]" title={f.name}>
                      {f.name}
                    </span>
                    <button
                      onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="ml-1 hover:bg-zinc-200 rounded p-0.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {/* images */}
                {images.map((img, idx) => (
                  <div
                    key={`i-${idx}`}
                    className="group flex items-center gap-1.5 pl-1 pr-1 py-1 rounded-md border border-zinc-200 bg-zinc-50"
                  >
                    <img src={img.url} alt={img.name} className="w-5 h-5 rounded object-cover bg-white" />
                    <span className="text-xs text-zinc-700 truncate max-w-[120px]" title={img.name}>
                      {img.name || 'image'}
                    </span>
                    <button
                      onClick={() => {
                        if (img.url) URL.revokeObjectURL(img.url);
                        setImages(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="ml-1 hover:bg-zinc-200 rounded p-0.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={(e) => {
                const { items, files } = e.clipboardData || {};
                const pastedFiles = [];
                if (items && items.length) {
                  for (const item of items) {
                    if (item.kind === 'file') {
                      const f = item.getAsFile();
                      if (f && f.type.startsWith('image/')) pastedFiles.push(f);
                    }
                  }
                } else if (files && files.length) {
                  for (const f of files) {
                    if (f.type.startsWith('image/')) pastedFiles.push(f);
                  }
                }
                if (pastedFiles.length > 0) {
                  e.preventDefault();
                  const next = pastedFiles.map(f => ({
                    file: f,
                    url: URL.createObjectURL(f),
                    name: f.name,
                    type: f.type
                  }));
                  setImages(prev => [...prev, ...next]);
                }
              }}
              placeholder="描述你的需求，支持上传图片/文件..."
              rows={1}
              maxLength={10000}
              className={cn(
                "min-h-[50px] max-h-[30vh] w-full px-3 py-3 resize-none bg-transparent border-none focus-visible:ring-0 text-sm text-zinc-800 placeholder:text-zinc-400",
                "no-scrollbar"
              )}
              disabled={isGenerating}
            />

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between px-2 py-2 bg-zinc-50/50 border-t border-zinc-100">
              <div className="flex items-center gap-0.5">
                <TextFilePicker
                  onPick={(picked) => {
                    const arr = Array.from(picked || []);
                    const allowed = arr.filter(f => {
                      const ext = (f.name || '').toLowerCase().split('.').pop();
                      const okExt = ext === 'md' || ext === 'txt';
                      const type = (f.type || '').toLowerCase();
                      const okType = type.includes('text') || type.includes('markdown') || type === '';
                      return okExt || okType;
                    });
                    if (allowed.length) {
                      const next = allowed.map(f => ({
                        file: f,
                        name: f.name,
                        type: f.type,
                        size: f.size
                      }));
                      setFiles(prev => [...prev, ...next]);
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                      }
                    }
                  }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 rounded-lg"
                    title="上传文件"
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                </TextFilePicker>

                <ImagePicker
                  onPick={(files) => {
                    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
                    if (imgs.length) {
                      const next = imgs.map(f => ({
                        file: f,
                        url: URL.createObjectURL(f),
                        name: f.name,
                        type: f.type
                      }));
                      setImages(prev => [...prev, ...next]);
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                      }
                    }
                  }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 rounded-lg"
                    title="上传图片"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                </ImagePicker>

                <div className="h-4 w-px bg-zinc-200 mx-1" />

                <button
                  ref={typeMenuButtonRef}
                  onClick={() => setShowTypeMenu((v) => !v)}
                  className="h-7 px-2.5 text-xs font-medium rounded-md text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900 transition-colors flex items-center gap-1"
                  title="选择图表类型"
                >
                  {currentTypeLabel}
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              </div>

              <div>
                <Button
                  onClick={handleSend}
                  disabled={
                    ((!input.trim() && images.length === 0 && files.length === 0) || isGenerating)
                  }
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-lg shadow-sm transition-all duration-200",
                    ((!input.trim() && images.length === 0 && files.length === 0) || isGenerating)
                      ? "bg-zinc-100 text-zinc-300"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  title="发送"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MoveUp className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {showTypeMenu && (
            <div
              ref={typeMenuRef}
              className="absolute left-2 bottom-14 w-48 max-h-64 overflow-y-auto rounded-xl bg-white border border-zinc-200 shadow-xl p-1.5 text-sm z-10 animate-in slide-in-from-bottom-2 fade-in duration-200"
            >
              <div className="px-2 py-1.5 text-xs font-medium text-zinc-400">图表类型</div>
              {chartTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setChartType(opt.value);
                    setShowTypeMenu(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg transition-colors text-zinc-700",
                    chartType === opt.value
                      ? "bg-zinc-100 font-medium text-zinc-900"
                      : "hover:bg-zinc-50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
    <style jsx global>{`
      .no-scrollbar::-webkit-scrollbar { width: 0; height: 0; }
      .no-scrollbar::-webkit-scrollbar-thumb { background: transparent; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `}</style>
    </>
  );
}

// ✨ 流式生成中的代码气泡（简化版，只显示代码，不可交互）
function StreamingCodeBubble({ codeText }) {
  const preRef = useRef(null);

  // Keep streaming code view pinned to bottom as new chunks arrive
  useEffect(() => {
    try {
      if (!preRef.current) return;
      const el = preRef.current;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }, [codeText]);

  return (
    <div className="w-full min-w-0 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 shadow-sm">
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-100/50 border-b border-zinc-200">
        <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500">
          <Code2 className="w-3.5 h-3.5" />
          <span>代码生成中...</span>
        </div>
      </div>
      <div className="relative w-full min-w-0">
        <pre
          ref={preRef}
          className={cn(
            'font-mono text-[12px] leading-relaxed px-4 py-3 whitespace-pre-wrap break-words break-all text-zinc-600 max-h-[36vh] overflow-auto w-full max-w-full min-w-0'
          )}
        >{codeText}</pre>
      </div>
    </div>
  );
}

function CodeBubble({ codeText, onApplyCode, onApplyXml }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  // ✨ v6.0: 优先使用 onApplyCode，回退到 onApplyXml
  const handleApply = () => {
    if (typeof onApplyCode === 'function') {
      onApplyCode(codeText);
    } else if (typeof onApplyXml === 'function') {
      onApplyXml(codeText);
    } else {
      // Fallback: dispatch event
      try {
        window.dispatchEvent(new CustomEvent('apply-xml', { detail: { xml: codeText } }));
      } catch {}
    }
  };

  return (
    <div className="w-[98%] min-w-0 rounded-xl overflow-hidden border border-zinc-200 bg-white shadow-sm group/code">
      <div
        className="flex items-center justify-between px-3 py-2 bg-zinc-50 border-b border-zinc-100 cursor-pointer hover:bg-zinc-100 transition-colors"
        onClick={() => setExpanded(v => !v)}
        title={expanded ? '收起' : '展开'}
      >
        <div className="flex items-center gap-2 text-[12px] font-medium text-zinc-600">
          <Code2 className="w-4 h-4 text-zinc-400" />
          <span className="font-mono text-zinc-500">Generated Code</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleApply();
            }}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-all"
            title="应用到画布"
          >
            <SquareMousePointer className="w-3.5 h-3.5" />
            <span>应用</span>
          </button>
          <div className="w-px h-3.5 bg-zinc-200 mx-0.5" />
          <ChevronDown
            className={cn(
              'w-4 h-4 text-zinc-400 transition-transform duration-200',
              expanded ? 'rotate-180' : 'rotate-0'
            )}
          />
        </div>
      </div>
      {expanded && (
        <div className="relative w-full min-w-0 bg-zinc-50/50">
          <div className="absolute right-2 top-2 z-10 flex gap-2">
             <button
                onClick={copyToClipboard}
                className="px-2 h-7 text-[11px] rounded-md bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm flex items-center gap-1.5 transition-all"
                title="复制代码"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? '已复制' : '复制'}</span>
              </button>
          </div>
          
          <pre
            className={cn(
              'font-mono text-[12px] leading-6 px-4 py-4 pt-8 whitespace-pre-wrap break-words break-all text-zinc-700 max-h-[36vh] overflow-auto w-full max-w-full min-w-0'
            )}
          >{codeText}</pre>
        </div>
      )}
    </div>
  );
}
