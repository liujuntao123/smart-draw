import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Smart Draw",
  description: "AI 驱动的智能绘图工具 —— 用自然语言描述，一键生成专业图表",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/user-guide/02-quick-start' },
      { text: '常见问题', link: '/user-guide/07-faq' }
    ],

    sidebar: [
      {
        text: '用户指南',
        items: [
          { text: '产品简介', link: '/user-guide/01-introduction' },
          { text: '快速开始', link: '/user-guide/02-quick-start' },
          { text: '核心功能', link: '/user-guide/03-core-features' },
          { text: '配置指南', link: '/user-guide/04-configuration' },
          { text: '常见用例', link: '/user-guide/05-use-cases' },
          { text: '进阶技巧', link: '/user-guide/06-advanced-tips' },
          { text: '常见问题', link: '/user-guide/07-faq' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ViggoZ/smart-draw' }
    ]
  }
})
