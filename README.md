# 传智杯 · AI Web 应用开发挑战赛

> **参赛项目：智慧教育平台（Smart Education）**  
> 当前版本：**v4.3.4**

---

## 项目简介

智慧教育平台是一款面向 K12 学生的 **AI 驱动个性化学习系统**，采用前后端分离架构，覆盖「诊断—规划—练习—反馈—复盘」完整学习闭环。

| 层级 | 技术栈 |
|------|--------|
| 前端 | Vue 3、Element Plus、Vue Router、Axios、ECharts、Socket.IO Client |
| 后端 | Node.js、Express、MongoDB、JWT、Winston |
| AI | 大模型对话、知识库 RAG、AI 学习计划生成 |
| 文档 | `docs/` 目录 Markdown，平台内动态渲染 |

### 核心功能模块

- **AI 助手**：多学科自定义助手、知识库增强问答、多轮对话
- **知识库**：文本 / PDF / URL 导入与向量检索
- **错题集**：录入、掌握度追踪、AI 分析、日历统计
- **学习计划**：手动创建与 AI 智能生成、时间线与定时提醒
- **学习笔记**：Markdown 编辑、文件夹与标签
- **学习社区**：问答、点赞、最佳答案
- **个人中心**：考试记录、成绩分析、学习画像
- **通知中心**：实时推送（Socket.IO）
- **管理后台**：数据概览、反馈管理、演示数据导入、系统公告

### 快速开始

```bash
# 后端
cd smart-education-backend
npm install
# 配置 .env 后
npm run dev

# 前端
cd frontend
npm install
npm run serve
```

- 用户端：http://localhost:8080  
- 后端 API：http://localhost:3001  
- 管理后台：`/admin/login`（默认账号见项目配置）

---

## 版本更新摘要（v4.3.x）

| 版本 | 要点 |
|------|------|
| **v4.3.4** | 新增项目 README，完善仓库说明与文档引导 |
| **v4.3.3** | 发展规划文档、平台文档站扩展；修复 Socket.IO 连接竞态 |
| **v4.3.2** | 演示数据包（一键导入/清除）、纯色单字演示头像 |
| **v4.3.1** | 平台文档站（隐私政策 / 服务条款 / 使用文档）、更新日志样式优化 |
| **v4.3.0** | 更新日志文档站，从 `docs/changelog` 动态加载 Markdown |

更早版本（v4.2 及以下）的功能迭代、问题修复与文件变更，请查看完整更新日志。

---

## 文档与更新记录

本仓库所有说明与版本记录均维护在 **`docs/`** 目录，并可在平台内直接浏览：

| 文档类型 | 仓库路径 | 平台内入口 |
|----------|----------|------------|
| **版本更新日志** | [`docs/changelog/`](docs/changelog/) | 登录页页脚 → [更新日志](http://localhost:8080/changelog)（`/changelog`） |
| 使用文档 | [`docs/guide/user-guide.md`](docs/guide/user-guide.md) | `/platform-docs?doc=user-guide` |
| 发展规划 | [`docs/guide/development-roadmap.md`](docs/guide/development-roadmap.md) | `/platform-docs?doc=development-roadmap` |
| 隐私政策 | [`docs/legal/privacy-policy.md`](docs/legal/privacy-policy.md) | `/platform-docs?doc=privacy-policy` |
| 服务条款 | [`docs/legal/terms-of-service.md`](docs/legal/terms-of-service.md) | `/platform-docs?doc=terms-of-service` |
| 文档编写规范 | [`docs/AGENTS.md`](docs/AGENTS.md) | 供维护者参考 |

**查看详细更新说明**：请打开 [`docs/changelog/`](docs/changelog/) 目录，或启动项目后访问 **更新日志** 页面，左侧可按版本切换，右侧提供本页目录导航。

---

## 项目结构

```
smart-education/
├── frontend/                 # Vue 3 前端
├── smart-education-backend/  # Express 后端
├── database/demo/            # 演示数据包（demo-seed.json）
├── docs/                     # 文档与更新日志
│   ├── changelog/            # 各版本更新记录
│   ├── guide/                # 使用指南、发展规划
│   └── legal/                # 法律条款
└── README.md                 # 本文件
```

---

## 许可证与说明

本项目为传智杯 AI Web 应用开发挑战赛参赛作品，仅供学习、答辩与评审使用。部署前请配置 `.env` 中的数据库、JWT、邮件与 AI 接口等敏感信息，切勿将密钥提交至公开仓库。
