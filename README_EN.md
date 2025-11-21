# Smart Draw

> **Draw any professional and beautiful diagram you can imagine in the simplest way**

## 🌐 Online Website
Visit our online website to use directly: https://smart-draw.aizhi.site/

## 中文版本
阅读中文版本: [README.md](README.md)

## ✨ Core Features

### 🎯 AI-Powered Excellence
Powered by advanced large language models to understand your requirements and generate professional-grade charts with clear structure and logical layout.

### 🎨 Dual Drawing Engine Support
Supports both **Draw.io** and **Excalidraw** drawing engines:
- **Draw.io**: Professional & Structured - Perfect for technical documentation, enterprise architecture, and formal presentations
- **Excalidraw**: Beautiful & Creative - Ideal for brainstorming sessions, creative designs, and presentations with a hand-drawn style

### 📊 Rich Chart Types
Supports 20+ chart types, including flowcharts, architecture diagrams, sequence diagrams, ER diagrams, mind maps, network topology diagrams, Gantt charts, and more. AI can also automatically select the most suitable chart type based on your description.

### 🎨 Perfect Editor Integration
Generated charts are fully based on Draw.io or Excalidraw format, allowing free editing, style adjustments, and detail additions on the canvas—achieving the perfect combination of AI generation and manual refinement.

### ⚡ Ready to Use
Simply configure an AI API key to get started, no complex environment setup required. All configurations are stored locally in your browser for privacy and security.

## 🚀 Quick Start

### Step 1: Configure AI Service

#### Option 1: Use Access Password

If the server administrator has configured an access password, you can directly use the server-side LLM configuration without providing your own API Key:

1. Click the **"Access Password"** button in the top right corner
2. Enter the access password provided by the administrator
3. Click **"Validate Password"** to test the connection
4. Check **"Enable Access Password"** and save

Once enabled, the application will prioritize the server-side configuration, and you can start creating without configuring your own API Key!

#### Option 2: Configure Your Own AI

1. Click the **"Configure LLM"** button in the top right corner
2. Select provider type (OpenAI or Anthropic)
3. Enter your API Key
4. Select model (**Highly recommend claude-sonnet-4.5** for best results)
5. Save configuration

That's it! You're ready to start creating.

### Step 2: Choose Drawing Engine

After accessing the application, you can choose between two drawing engines:

- **Draw.io** (`/drawio`): Perfect for creating precise, professional structured diagrams
- **Excalidraw** (`/excalidraw`): Perfect for creating hand-drawn style creative diagrams

### Step 3: Create Charts

Describe your needs in natural language in the input box, for example:
- "Draw a user login flowchart"
- "Create a microservices architecture diagram including gateway, authentication service, and business services"
- "Design a database ER diagram for an e-commerce system"

AI will automatically generate the chart, which you can directly edit and adjust on the canvas.

## 💻 Local Deployment

If you want to run the project locally:

```bash
# Clone the project
git clone https://github.com/liujuntao123/smart-excalidraw-next.git
cd smart-excalidraw-next

# Install dependencies (this project uses pnpm)
pnpm install

# Start development server
pnpm dev
```

Visit http://localhost:3000 to start using.

### Configure Server-Side LLM (Optional)

If you want to provide a unified LLM configuration for users and avoid requiring them to obtain their own API Keys, you can configure the server-side access password feature:

1. Copy the environment variables example file:
```bash
cp .env.example .env
```

2. Configure the following variables in `.env`:
```bash
# Access password (users need to enter this password to use server-side LLM)
ACCESS_PASSWORD=your-secure-password

# LLM provider type (openai or anthropic)
SERVER_LLM_TYPE=anthropic

# API base URL
SERVER_LLM_BASE_URL=https://api.anthropic.com/v1

# API key
SERVER_LLM_API_KEY=sk-ant-your-key-here

# Model name
SERVER_LLM_MODEL=claude-sonnet-4-5-20250929
```

3. Restart the development server, and users can use the server-configured LLM through the access password.

**Benefits:**
- Users don't need to apply for and configure their own API Keys
- Centralized management of API usage and costs
- Suitable for team or organizational internal use
- Provide free trial experience to users

## ❓ Frequently Asked Questions

**Q: Which AI model is recommended?**
A: **claude-sonnet-4.5** is highly recommended for best performance in understanding requirements and generating charts.

**Q: What's the difference between Draw.io and Excalidraw?**
A: Draw.io is suitable for creating precise, professional structured diagrams for technical documentation and formal presentations; Excalidraw provides a hand-drawn style perfect for brainstorming and creative designs. Choose the engine that best fits your needs.

**Q: Is data secure?**
A: All configuration information is stored only in your local browser and never uploaded to any servers (unless you use the access password feature to connect to server-side configuration).

**Q: What chart types are supported?**
A: Supports 20+ types including flowcharts, architecture diagrams, sequence diagrams, ER diagrams, mind maps, network topology diagrams, Gantt charts, UML class diagrams, state diagrams, swimlane diagrams, concept maps, fishbone diagrams, SWOT analysis, and more. AI will automatically select the most suitable type.

**Q: Can generated charts be modified?**
A: Absolutely! After generation, you can freely edit on the canvas, including adjusting positions, modifying styles, adding elements, and more. Both Draw.io and Excalidraw provide powerful editing capabilities.

**Q: What is the access password feature?**
A: The access password feature allows server administrators to configure a unified LLM. Users only need to enter the password to use it, without needing to apply for their own API Key. When access password is enabled, the server-side configuration takes priority over local configuration.

**Q: What is the priority between access password and local configuration?**
A: If access password is enabled, the system will prioritize the server-side LLM configuration. Local configured API Keys will only be used when access password is not enabled.

## 🛠️ Tech Stack

Next.js 16 · React 19 · Draw.io · Excalidraw · Tailwind CSS 4 · Monaco Editor

## 📄 License

The source code of this project is released under the **PolyForm Noncommercial License 1.0.0**, which permits noncommercial use only.
Any kind of commercial use (including but not limited to selling, paid services, or SaaS offerings) requires prior written permission from the author.

Please see the `LICENSE` file at the project root, or visit:
https://polyformproject.org/licenses/noncommercial/1.0.0/
for the full license terms.

## Contact Author
WeChat ID: liujuntaoljt

<img width="200"  alt="WeChat QR Code" src="https://github.com/user-attachments/assets/6d8c4da2-af27-4213-b929-0d47fa51e9b5" />

## 💖 Sponsors

Thanks to the following sponsors for supporting this project:

If this project helps you, please consider supporting:
- ⭐ Star the project
- 💬 Share with more people who need it
- 💰 Become a sponsor (contact author via WeChat)

**Draw any professional and beautiful diagram you can imagine in the simplest way** - Making visual creation simple again
