# Smart Draw

> **用自然语言，以最简单的方式绘制任何专业美观的图表**

## 🌐 在线网站
进入在线网站直接使用：https://smart-draw.aizhi.site/


## English Version
Read the English version: [README_EN.md](README_EN.md)


## ✨ 核心特性

### 🎯 AI 驱动，效果出众
通过先进的大语言模型理解你的需求，生成结构清晰、布局合理的专业级图表。

### 🎨 双引擎支持
支持 **Draw.io** 和 **Excalidraw** 两种绘图引擎：
- **Draw.io**：专业与结构化，适合技术文档、企业架构和正式演示
- **Excalidraw**：美观与创意，适合头脑风暴、创意设计和需要手绘风格的演示

### 📊 丰富图表类型
支持 20+ 种图表类型，包括流程图、架构图、时序图、ER 图、思维导图、网络拓扑图、甘特图等。也可以让AI根据你的描述自动选择最合适的图表类型。

### 🎨 完美编辑器集成
生成的图表完全基于 Draw.io 或 Excalidraw 格式，可以在画布上自由编辑、调整样式、添加细节，实现 AI 生成与手动精修的完美结合。

### ⚡ 开箱即用
只需配置一个 AI API 密钥即可开始使用，无需复杂的环境搭建。所有配置保存在本地浏览器，隐私安全有保障。



## 🚀 快速开始

### 第一步：配置 AI 服务

#### 方式一：使用访问密码

如果服务器管理员已配置访问密码，你可以直接使用服务器端的 LLM 配置，无需自己提供 API Key：

1. 点击右上角的 **"访问密码"** 按钮
2. 输入管理员提供的访问密码
3. 点击 **"验证密码"** 测试连接
4. 勾选 **"启用访问密码"** 并保存

启用后，应用将优先使用服务器端配置，你无需配置自己的 API Key 即可开始创作！

#### 方式二：配置自己的 AI

1. 点击右上角的 **"配置 LLM"** 按钮
2. 选择提供商类型（OpenAI 或 Anthropic）
3. 填入你的 API Key
4. 选择模型（**推荐使用 claude-sonnet-4.5**，效果最佳）
5. 保存配置

就这么简单！现在你可以开始创作了。

### 第二步：选择绘图引擎

访问应用后，你可以选择两种绘图引擎：

- **Draw.io** (`/drawio`)：适合创建精确、专业的结构化图表
- **Excalidraw** (`/excalidraw`)：适合创建手绘风格的创意图表

### 第三步：创建图表

在输入框中用自然语言描述你的需求，例如：
- "画一个用户登录的流程图"
- "创建一个微服务架构图，包含网关、认证服务和业务服务"
- "设计一个电商系统的数据库 ER 图"

AI 会自动生成图表，你可以在画布上直接编辑和调整。

## 💻 本地部署

如果你想在本地运行项目：

```bash
# 克隆项目
git clone https://github.com/liujuntao123/smart-excalidraw-next.git
cd smart-excalidraw-next

# 安装依赖（本项目使用 pnpm）
pnpm install

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000 即可使用。

### 配置服务器端 LLM（可选）

如果你想为用户提供统一的 LLM 配置，避免他们自己申请 API Key，可以配置服务器端访问密码功能：

1. 复制环境变量示例文件：
```bash
cp .env.example .env
```

2. 在 `.env` 中配置以下变量：
```bash
# 访问密码（用户需要输入此密码才能使用服务器端 LLM）
ACCESS_PASSWORD=your-secure-password

# LLM 提供商类型（openai 或 anthropic）
SERVER_LLM_TYPE=anthropic

# API 基础 URL
SERVER_LLM_BASE_URL=https://api.anthropic.com/v1

# API 密钥
SERVER_LLM_API_KEY=sk-ant-your-key-here

# 模型名称
SERVER_LLM_MODEL=claude-sonnet-4-5-20250929
```

3. 重启开发服务器，用户即可通过访问密码使用服务器端配置的 LLM。

**优势：**
- 用户无需自己申请和配置 API Key
- 统一管理 API 使用和成本
- 适合团队或组织内部使用
- 提供免费体验给用户

## ❓ 常见问题

**Q: 推荐使用哪个 AI 模型？**
A: 强烈推荐使用 **claude-sonnet-4.5**，它在理解需求和生成图表方面表现最佳。

**Q: Draw.io 和 Excalidraw 有什么区别？**
A: Draw.io 适合创建精确、专业的结构化图表，适用于技术文档和正式演示；Excalidraw 提供手绘风格，适合头脑风暴和创意设计。你可以根据需求选择合适的引擎。

**Q: 数据安全吗？**
A: 所有配置信息仅保存在你的浏览器本地，不会上传到任何服务器（除非你使用访问密码功能连接到服务器端配置）。

**Q: 支持哪些图表类型？**
A: 支持流程图、架构图、时序图、ER 图、思维导图、网络拓扑图、甘特图、UML类图、状态图、泳道图、概念图、鱼骨图、SWOT分析等 20+ 种类型。AI 会自动选择最合适的类型。

**Q: 生成的图表可以修改吗？**
A: 当然可以！生成后可以在画布上自由编辑，包括调整位置、修改样式、添加元素等。Draw.io 和 Excalidraw 都提供了强大的编辑功能。

**Q: 什么是访问密码功能？**
A: 访问密码功能允许服务器管理员配置统一的 LLM，用户只需输入密码即可使用，无需自己申请 API Key。启用访问密码后，将优先使用服务器端配置，忽略本地配置。

**Q: 访问密码和本地配置的优先级是什么？**
A: 如果启用了访问密码，系统将优先使用服务器端的 LLM 配置。只有在未启用访问密码时，才会使用本地配置的 API Key。

## 🛠️ 技术栈

Next.js 16 · React 19 · Draw.io · Excalidraw · Tailwind CSS 4 · Monaco Editor

## 📄 许可证

本项目源码基于 **PolyForm Noncommercial License 1.0.0** 发布，仅允许非商业用途使用。
任何形式的商业使用（包括但不限于出售、付费服务、SaaS 等）都必须事先获得作者的书面授权。

完整协议条款请参见项目根目录下的 `LICENSE` 文件，或访问：
https://polyformproject.org/licenses/noncommercial/1.0.0/

## 联系作者
微信号： liujuntaoljt

<img width="200"  alt="微信图片_20251103110224_44_85" src="https://github.com/user-attachments/assets/6d8c4da2-af27-4213-b929-0d47fa51e9b5" />

## 💖 赞助

感谢以下赞助者对本项目的支持：

如果这个项目对你有帮助，欢迎通过以下方式支持：
- ⭐ 给项目点个 Star
- 💬 分享给更多需要的人
- 💰 成为赞助者（联系作者微信）



**用自然语言，以最简单的方式绘制任何专业美观的图表** - 让可视化创作回归简单
