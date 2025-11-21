'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import './LandingPage.css';

const translations = {
  zh: {
    nav: {
      home: '首页',
      features: '特性',
      excalidraw: 'Excalidraw',
      drawio: 'Draw.io'
    },
    hero: {
      title: 'AI\n绘图神器',
      subtitle: '以最简单的方式绘制任何专业美观的图表',
      getStartedDrawio: '开始使用 Draw.io',
      getStartedExcalidraw: '开始使用 Excalidraw'
    },
    features: {
      title: '特性',
      aiDriven: {
        title: 'AI驱动的卓越体验',
        description: 'AI理解并生成专业图表'
      },
      chartTypes: {
        title: '20+种图表类型',
        description: '流程图、架构图、时序图等等'
      },
      integration: {
        title: '完美集成绘图工具',
        description: '兼容 Excalidraw 和 Draw.io'
      }
    },
    engines: {
      title: '选择您的绘图引擎',
      drawio: {
        title: 'Draw.io',
        subtitle: '专业与结构化',
        description: 'Draw.io 擅长创建精确、专业的图表。非常适合技术文档、企业架构和正式演示，在这些场景中，一致性和清晰度至关重要。',
        cta: '试用 Draw.io'
      },
      excalidraw: {
        title: 'Excalidraw',
        subtitle: '美观与创意',
        description: 'Excalidraw 为您的图表带来手绘、艺术风格。非常适合头脑风暴、创意设计和需要更个性化、吸引人的视觉效果的演示。',
        cta: '试用 Excalidraw'
      }
    },
    getStarted: {
      title: '开始使用',
      step1: {
        title: '1. 选择您喜欢的绘图引擎',
        description: '选择 Draw.io 获得专业性，或选择 Excalidraw 获得美感'
      },
      step2: {
        title: '2. 配置 API Key 或访问密码',
        description: '设置您的 OpenAI/Anthropic API key，或使用访问密码'
      },
      step3: {
        title: '3. 用自然语言描述您的需求',
        description: '只需告诉我们您想创建什么图表'
      },
      magic: '✨ 接下来，见证奇迹的时刻！'
    },
    footer: '© 2025 Smart Draw. 由 AI 驱动. 用 ❤️ 构建'
  },
  en: {
    nav: {
      home: 'Home',
      features: 'Features',
      excalidraw: 'Excalidraw',
      drawio: 'Draw.io'
    },
    hero: {
      title: 'AI-Powered\nDiagram Tool',
      subtitle: 'Draw any professional and beautiful diagram you can imagine in the simplest way',
      getStartedDrawio: 'Get Started with Draw.io',
      getStartedExcalidraw: 'Get Started with Excalidraw'
    },
    features: {
      title: 'Features',
      aiDriven: {
        title: 'AI-Driven Excellence',
        description: 'AI understands and generates professional charts'
      },
      chartTypes: {
        title: '20+ Chart Types',
        description: 'Flowcharts, architecture diagrams, sequence diagrams and more'
      },
      integration: {
        title: 'Perfect Integration with Drawing Tools',
        description: 'Compatible with Excalidraw and Draw.io'
      }
    },
    engines: {
      title: 'Choose Your Drawing Engine',
      drawio: {
        title: 'Draw.io',
        subtitle: 'Professional & Structured',
        description: 'Draw.io excels at creating precise, professional diagrams with a structured approach. Perfect for technical documentation, enterprise architecture, and formal presentations where consistency and clarity are paramount.',
        cta: 'Try Draw.io'
      },
      excalidraw: {
        title: 'Excalidraw',
        subtitle: 'Beautiful & Creative',
        description: 'Excalidraw brings a hand-drawn, artistic style to your diagrams. Ideal for brainstorming sessions, creative designs, and presentations that need a more personal, engaging visual touch with unique character.',
        cta: 'Try Excalidraw'
      }
    },
    getStarted: {
      title: 'Get Started',
      step1: {
        title: '1. Choose Your Favorite Drawing Engine',
        description: 'Pick Draw.io for professionalism or Excalidraw for aesthetics'
      },
      step2: {
        title: '2. Configure API Key or Access Password',
        description: 'Set up your OpenAI/Anthropic API key, or use the access password'
      },
      step3: {
        title: '3. Describe Your Needs in Natural Language',
        description: 'Simply tell us what diagram you want to create'
      },
      magic: '✨ And the magic happens!'
    },
    footer: '© 2025 Smart Draw. Powered by AI. Built with ❤️'
  }
};

export default function LandingPage() {
  // Load language preference from localStorage on initialization
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage === 'zh' || savedLanguage === 'en') {
        return savedLanguage;
      }
    }
    return 'zh';
  });
  const t = translations[language];

  // Helper function to conditionally apply handwriting font for non-Chinese text
  const getHandwritingClass = () => language === 'zh' ? 'landing-handwriting' : '';

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    // 动态加载 Paper CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/papercss@1.9.2/dist/paper.min.css';
    link.id = 'paper-css';
    document.head.appendChild(link);

    // 组件卸载时移除样式
    return () => {
      const paperLink = document.getElementById('paper-css');
      if (paperLink) {
        document.head.removeChild(paperLink);
      }
    };
  }, []);

  return (
    <div className="paper !m-0 !p-0 ">
      {/* Header / Navigation - Fixed */}
      <nav className="split-nav !h-[83px] !fixed !top-0 !left-0 !right-0 !z-50 !bg-white !shadow-md">
        <div className="nav-brand">
          <img
          src="/logo.png"
          alt="Smart Draw"
          className="!h-full !border-none w-auto select-none cursor-pointer hover:opacity-80 transition-opacity"
        />
        </div>
        <div className="collapsible">
          <input id="collapsible1" type="checkbox" name="collapsible1" />
          <label htmlFor="collapsible1">
            <div className="bar1"></div>
            <div className="bar2"></div>
            <div className="bar3"></div>
          </label>
          <div className="collapsible-body">
            <div className="flex  items-center h-full">
              <div className="!flex !gap-2">
                <button
                  onClick={() => setLanguage('zh')}
                  className={`${getHandwritingClass()} paper-btn btn-small ${language === 'zh' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  中文
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`${getHandwritingClass()} paper-btn btn-small ${language === 'en' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  EN
                </button>
              </div>
              {/* <div><a href="#home" className={getHandwritingClass()}>{t.nav.home}</a></div>
              <div><a href="#features" className={getHandwritingClass()}>{t.nav.features}</a></div> */}
              <div className='!m-0 !mr-2'><Link href="/excalidraw" className={`${getHandwritingClass()} paper-btn`}>{t.nav.excalidraw}</Link></div>
              <div className='!m-0'><Link href="/drawio" className={`${getHandwritingClass()} paper-btn`}>{t.nav.drawio}</Link></div>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed header */}
      <div className="!h-[83px]"></div>

      {/* Hero Section */}
      <div className=" container !max-w-[1200px]">
        <div className="row">
          <div className="col-6 col">
            <h1 className={`hero-title ${language === 'zh' ? 'hero-title-handwriting' : ''}`} style={{ whiteSpace: 'pre-line' }}>{t.hero.title}</h1>
            <p className={`mb-4 ${getHandwritingClass()}`}>
              {t.hero.subtitle}
            </p>
            <div className="flex gap-2">

            <Link href="/drawio" className={`${getHandwritingClass()} paper-btn btn-primary btn-md`}>
              {t.hero.getStartedDrawio}
            </Link>
            <Link href="/excalidraw" className={`${getHandwritingClass()} paper-btn btn-primary btn-md`}>
              {t.hero.getStartedExcalidraw}
            </Link>
            </div>
          </div>
          <div className="col-6 flex items-center col hero-illustration">
            <img
              src="/banner.png"
              alt="AI Chart Generation"
              className="w-full h-auto "
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container !max-w-[1200px] !mt-15 !p-10" id="features">
      <h2 className={`text-center !mb-10 ${language === 'zh' ? 'section-title-handwriting' : ''}`}>{t.features.title}</h2>
        <div className="row">
          {/* Feature 1: AI-Driven Excellence */}
          <div className="sm-6 md-4 col">
            <div className="card feature-card">
              <div className="card-body">
                <img src="/brain.png" alt="AI-Driven" className="feature-icon w-16 h-16 mx-auto mb-4" />
                <h4 className={`card-title ${language === 'zh' ? 'feature-title-handwriting' : ''}`}>{t.features.aiDriven.title}</h4>
                <p className={`card-text ${getHandwritingClass()}`}>
                  {t.features.aiDriven.description}
                </p>
              </div>
            </div>
          </div>


          {/* Feature 3: 20+ Chart Types */}
          <div className="sm-6 md-4 col">
            <div className="card feature-card">
              <div className="card-body">
                <img src="/chart-list.png" alt="Chart Types" className="feature-icon w-16 h-16 mx-auto mb-4" />
                <h4 className={`card-title ${language === 'zh' ? 'feature-title-handwriting' : ''}`}>{t.features.chartTypes.title}</h4>
                <p className={`card-text ${getHandwritingClass()}`}>
                  {t.features.chartTypes.description}
                </p>
              </div>
            </div>
          </div>

          {/* Feature 4: Perfect Integration */}
          <div className="sm-6 md-4 col">
            <div className="card feature-card">
              <div className="card-body">
                <img src="/draw.png" alt="Drawing Tools" className="feature-icon w-16 h-16 mx-auto mb-4" />
                <h4 className={`card-title ${language === 'zh' ? 'feature-title-handwriting' : ''}`}>{t.features.integration.title}</h4>
                <p className={`card-text ${getHandwritingClass()}`}>
                  {t.features.integration.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Drawing Engines Section */}
      <div className="container !max-w-[1200px] !mt-15 !p-10">
        <h2 className={`text-center !mb-10 ${language === 'zh' ? 'section-title-handwriting' : ''}`}>{t.engines.title}</h2>
        <div className="row">
          {/* Draw.io Engine */}
          <div className="sm-12 md-6 col">
            <div className="card engine-card">
              <div className="card-body">
                <h3 className={`card-title text-center !mb-4 ${getHandwritingClass()}`}>{t.engines.drawio.title}</h3>
                <p className={`${getHandwritingClass()} card-text text-center !mb-4`}>
                  <strong>{t.engines.drawio.subtitle}</strong>
                </p>
                <p className={`card-text ${getHandwritingClass()}`}>
                  {t.engines.drawio.description}
                </p>
                <div className="text-center !mt-6">
                  <Link href="/drawio" className={`${getHandwritingClass()} paper-btn btn-secondary`}>
                    {t.engines.drawio.cta}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Excalidraw Engine */}
          <div className="sm-12 md-6 col">
            <div className="card engine-card">
              <div className="card-body">
                <h3 className={`card-title text-center !mb-4 ${getHandwritingClass()}`}>{t.engines.excalidraw.title}</h3>
                <p className={`${getHandwritingClass()} card-text text-center !mb-4`}>
                  <strong>{t.engines.excalidraw.subtitle}</strong>
                </p>
                <p className={`card-text ${getHandwritingClass()}`}>
                  {t.engines.excalidraw.description}
                </p>
                <div className="text-center !mt-6">
                  <Link href="/excalidraw" className={`${getHandwritingClass()} paper-btn btn-secondary`}>
                    {t.engines.excalidraw.cta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Get Started Section */}
      <div className=" container !max-w-[1200px] !mt-10 !p-10">

        <div className="row flex-center">
          <div className="sm-12 md-11 lg-10 col">
            <h2 className={`mb-10 text-center ${getHandwritingClass()} ${language === 'zh' ? 'section-title-handwriting' : ''}`}>{t.getStarted.title}</h2>
            <div className="flex gap-30">
            <div className="steps-container w-100">
              <div className="step-item my-6 w-full">
                {/* <div className="step-number">1</div> */}
                <div className="step-content">
                  <h4 className={language === 'zh' ? 'step-title-handwriting' : ''}>{t.getStarted.step1.title}</h4>
                  <p className={getHandwritingClass()}>{t.getStarted.step1.description}</p>
                </div>
              </div>
              <div className="step-item my-6 w-full">
                {/* <div className="step-number">2</div> */}
                <div className="step-content">
                  <h4 className={language === 'zh' ? 'step-title-handwriting' : ''}>{t.getStarted.step2.title}</h4>
                  <p className={getHandwritingClass()}>{t.getStarted.step2.description}</p>
                </div>
              </div>
              <div className="step-item my-6 w-full">
                {/* <div className="step-number">3</div> */}
                <div className="step-content">
                  <h4 className={language === 'zh' ? 'step-title-handwriting' : ''}>{t.getStarted.step3.title}</h4>
                  <p className={getHandwritingClass()}>{t.getStarted.step3.description}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 mt-6">
              <img
                src="/magic.png"
                alt="Magic"
                className="!w-auto !h-[90%] "
              />
          </div>
        </div>

            <p className={`${getHandwritingClass()} text-center !mt-8 !text-lg !font-medium`} style={{color: '#0066cc'}}>
              {t.getStarted.magic}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className='!w-full mb-6 mt-20'>
        <p className="footer-text text-center">
          {t.footer}
        </p>
      </footer>
    </div>
  );
}
