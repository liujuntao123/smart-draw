# 配置指南

本文档介绍如何配置 Smart Draw 的 AI 服务。



## 本地配置管理

支持保存多套配置，方便在不同场景切换：

1. 打开设置面板
2. 点击 **添加配置**
3. 填写配置名称和参数
4. 保存后可在配置列表中切换



## 推荐模型配置

| 服务商 | 推荐模型 | 特点 |
|--------|----------|------|
| Anthropic | claude-sonnet-4-5-20250929 | 图表生成质量最佳 |
| OpenAI | gpt-4o | 响应速度快 |



## 自定义 API 地址

如果使用代理服务或私有部署，可以修改 Base URL：

- **OpenAI 官方**：`https://api.openai.com/v1`
- **Anthropic 官方**：`https://api.anthropic.com/v1`
- **自定义代理**：填写您的代理地址



[← 上一篇：核心功能详解](03-core-features.md) 

 [下一篇：常见用例 →](05-use-cases.md)
