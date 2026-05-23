# AI 智能制定学习计划 — 技术方案（v4.0.0）

**版本**: v4.0.0  
**日期**: 2026-05-23  
**状态**: 已实现（MVP）

---

## 1. 功能概述

在学习计划页面顶部提供「AI 智能制定」入口。用户主动开启并选择数据来源后，系统聚合平台内学习数据，由 AI 生成计划草案；用户预览、勾选、编辑后确认导入时间轴。

### 设计原则

- **用户主动开启**：不自动写入计划
- **先预览再导入**：AI 仅生成草案
- **数据来源可选**：用户勾选参与聚合的模块
- **可配置周期**：7 / 14 / 30 天

---

## 2. 产品交互

```
[我的计划]                    [✨ AI 智能制定]
         ↓ 点击
    ┌─────────────────────────────┐
    │  AI 智能制定计划 抽屉         │
    │  ☑ 错题本", 勾选错题/成绩/对话/笔记/社区
    │  周期：7天 | 14天 | 30天
    │  [生成计划草案] → 预览列表（可勾选）
    │  [确认导入选中计划]
    └─────────────────────────────┘
```

---

## 3. 数据来源

| 模块 | 采集内容 | 模型 |
|------|----------|------|
| 个人资料 | 年级、学校、科目 | User |
| 考试成绩 | 各科分数与趋势 | Exam |
| 错题本 | 科目错题数、掌握度、错因 | ErrorQuestion |
| 现有计划 | 进行中/未开始计划（避重） | StudyPlan |
| AI 对话 | 近期用户消息摘要 | Topic |
| 笔记 | 近期标题与标签 | Note |
| 学习社区 | 提问标签、未解问题 | Question |

---

## 4. API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/study-plan/learning-profile` | 聚合学习画像 |
| POST | `/api/study-plan/ai-generate/confirm` | 确认批量导入计划 |

### preview 请求体

```json
{
  "userId": "xxx",
  "dataSources": ["profile", "exam", "errorBook", "chat", "note", "community", "studyPlan"],
  "durationDays": 7,
  "focusSubjects": ["math", "english"]
}
```

### preview 响应体

```json
{
  "profileSummary": "…",
  "plans": [
    {
      "planTitle": "函数基础巩固",
      "subject": "math",
      "startTime": "2026-05-24",
      "endTime": "2026-05-26",
      "description": "…",
      "priority": "high",
      "dataSources": ["errorBook"]
    }
  ]
}
```

---

## 5. 后端架构

```
services/learningProfileService.js   ← 跨模块数据聚合
services/aiPlanService.js            ← Prompt + AI 调用 + 批量写入
routes/studyPlan.js                  ← 新增 3 个路由
utils/subjectMap.js                  ← 中英文科目映射
utils/ai.js                          ← 复用现有 AI 客户端
```

### AI 输出格式

强制 JSON，字段映射至 `StudyPlan`：`planTitle`、`subject`、`startTime`、`endTime`、`description`。

---

## 6. 前端架构

```
components/plan/AiPlanGeneratorDrawer.vue   ← 抽屉面板
views/StudyPlan.vue                       ← 顶部按钮集成
api/studyPlan.js                            ← API 封装
```

---

## 7. 分阶段路线

### v4.0.0（MVP，当前版本）

- 顶部入口 + 抽屉配置
- 学习画像聚合 + AI 草案生成
- 预览确认导入

### v4.0.0（已实现）

- ✅ 手动/流式 AI 制定计划 + 学习画像聚合
- ✅ **定时自动生成**：按设定时间生成并写入时间轴，通知中心 + 邮件同步
- ✅ 制定依据展示（reason / dataSources）
- ✅ 错题知识点字段 / AI 自动标注
- ✅ 用户偏好持久化（含定时规则）
- ✅ 计划进度反馈自动调整

### 后续版本

- 计划执行周报与自动复盘
- 知识库 RAG 推荐复习资料
- 跨模块统一学习报告导出

---

## 8. 风险与对策

| 风险 | 对策 |
|------|------|
| AI 返回非 JSON | 解析重试 + 规则兜底计划 |
| 新用户数据少 | 空状态引导补数据 |
| 科目中英文不一致 | subjectMap 统一映射 |
| 与现有计划冲突 | 传入 existingPlans 避重 |

---

**文档维护**: 随 v4.0.0 功能迭代更新
