"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AppHeader() {
  const router = useRouter();
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isSponsorOpen, setIsSponsorOpen] = useState(false);

  const handleLogoClick = () => {
    router.push("/");
  };

  const handleNoticeClick = () => {
    setIsNoticeOpen(true);
  };

  const handleCloseNotice = () => {
    setIsNoticeOpen(false);
  };

  return (
    <>
      <header className="flex items-center justify-between gap-4 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        {/* Logo Area */}
        <div 
          className="flex items-center cursor-pointer group select-none" 
          onClick={handleLogoClick}
        >
          <h1 className="flex items-baseline text-xl sm:text-2xl">
            {/* Smart: 稳重、现代、科技感 */}
            <span className="font-sans font-bold text-slate-700 tracking-tight">
              Smart
            </span>
            {/* Draw: 艺术、流动、多彩 */}
            <span 
              className="ml-1 font-serif italic font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 text-2xl sm:text-3xl group-hover:scale-105 transition-transform duration-300 ease-out origin-left"
              style={{ letterSpacing: '-0.02em' }}
            >
              Draw
            </span>
            {/* 装饰性的小圆点，增加设计细节 */}
            <span className="ml-0.5 mb-1 w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-pulse"></span>
          </h1>
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4 ml-auto">
          {/* Notice Button */}
          <button
            type="button"
            onClick={handleNoticeClick}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-50 to-rose-50 text-pink-600 border border-pink-200 hover:from-pink-100 hover:to-rose-100 hover:text-pink-700 hover:border-pink-300 transition-all shadow-sm active:scale-95"
          >
            🎁 限时领 Key
          </button>
          {/* Documentation Link */}
          <a
            href="https://smart-draw-doc.aizhi.site"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-900 transition-colors p-1.5 hover:bg-gray-100 rounded-full"
            aria-label="文档"
            title="文档"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </a>
          {/* Buy Me a Coffee Button */}
          <button
            type="button"
            onClick={() => setIsSponsorOpen(true)}
            className="text-gray-500 hover:text-gray-900 transition-colors p-1.5 hover:bg-gray-100 rounded-full"
            aria-label="Buy me a coffee"
            title="Buy me a coffee"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
          </button>
          {/* GitHub Link */}
          <a
            href="https://github.com/liujuntao123/smart-draw"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-900 transition-colors p-1.5 hover:bg-gray-100 rounded-full"
            aria-label="GitHub Repository"
          >
            <svg
              height="22"
              viewBox="0 0 16 16"
              width="22"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>

        </div>
      </header>

      {isNoticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseNotice} />
          <div className="relative bg-white rounded-xl border border-gray-200 w-full max-w-sm mx-4 overflow-hidden shadow-2xl transform transition-all">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-semibold text-gray-800">
                🎁 进群限时领取免费 claude-4.5-sonnet key
              </h2>
              <button
                type="button"
                onClick={handleCloseNotice}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-200"
                aria-label="关闭"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="p-6 bg-white flex flex-col items-center">
              <div className="p-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                 <img
                  src="/qrcode.png"
                  alt="进群二维码"
                  className="w-full h-auto rounded-md"
                />
              </div>
              <p className="mt-4 text-xs text-gray-500 text-center">
                扫描上方二维码加入群聊
              </p>
            </div>
          </div>
        </div>
      )}

      {isSponsorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSponsorOpen(false)} />
          <div className="relative bg-white rounded-xl border border-gray-200 w-full max-w-sm mx-4 overflow-hidden shadow-2xl transform transition-all">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-semibold text-gray-800">
                ☕ 请作者喝杯奶茶
              </h2>
              <button
                type="button"
                onClick={() => setIsSponsorOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-200"
                aria-label="关闭"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="p-6 bg-white flex flex-col items-center">
              <div className="p-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                <img
                  src="/sponsor.png"
                  alt="赞助二维码"
                  className="w-full h-auto rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}