# 学习社区功能规格文档

**文档版本**: 1.0  
**创建日期**: 2026-05-22  
**用途**: 记录学习社区页面的完整功能,用于重构参考

---

## 📋 功能概述

学习社区是一个同伴互助答疑平台,学生可以在这里发起提问、回答问题、收藏问题、管理自己的疑问。

---

## 🎯 核心功能模块

### 1. 数据统计展示
**位置**: 顶部统计栏  
**数据项**:
- 疑问总数 (totalQuestions)
- 未解决疑问数 (unsolvedQuestions)  
- 我的疑问总数 (myQuestions)

**数据来源**: `GET /api/community/stats?userId={userId}`

---

### 2. 问题列表展示
**布局**: 2列2行网格布局,每页显示4个问题  
**分页**: 使用 el-pagination 组件

**问题卡片信息**:
- 用户头像 (userAvatar)
- 用户名 (userName)
- 发布时间 (createTime) - 格式化显示
- 问题标题 (title)
- 问题标签 (tags) - 最多显示2个,超出显示"+N"
- 解决状态 (solved) - 已解决/待解决
- 收藏按钮 - 点击收藏/取消收藏

**卡片边框颜色**: 循环使用4种颜色 (#0969da, #35b778, #ffc107, #e74c3c)

**数据来源**: `GET /api/community/questions?userId={userId}`

---

### 3. 状态筛选功能
**筛选选项**:
- 全部 (questionStatusFilter = '')
- 待解决 (questionStatusFilter = 'unsolved')
- 已解决 (questionStatusFilter = 'solved')

**交互**: 点击按钮切换筛选状态,再次点击取消筛选

---

### 4. 用户信息展示
**位置**: 右侧边栏顶部  
**显示信息**:
- 头像 (avatar)
- 昵称 (nickname)
- 学校 (school)
- 年级 (grade) - 需要转换为中文显示

**数据来源**: localStorage
- edu-user-id
- edu-nickname
- edu-avatar
- edu-school
- edu-grade

**年级映射**:
```javascript
{
  'primary_1': '一年级', 'primary_2': '二年级', ..., 'primary_6': '六年级',
  'junior_1': '初一', 'junior_2': '初二', 'junior_3': '初三',
  'senior_1': '高一', 'senior_2': '高二', 'senior_3': '高三'
}
```

---

### 5. 我的收藏功能
**位置**: 右侧边栏  
**显示**: 前2条收藏,点击可查看详情  
**操作**: "管理"按钮打开收藏管理对话框

**数据来源**: `GET /api/community/favorites?userId={userId}`

**收藏管理对话框功能**:
- 全选/取消全选
- 批量删除收藏
- 查看问题详情
- 显示问题元信息(用户名、发布时间)

---

### 6. 发起提问功能
**触发**: 点击"发起提问"按钮  
**表单字段**:
- 问题标题 (title) - 必填
- 问题描述 (content) - 必填,多行文本
- 相关标签 (tags) - 多选,最多2个
  - 动态科目标签 (从 userSubjects 获取)
  - 固定标签: 作业、考试、难题

**API**: `POST /api/community/questions`
```javascript
{
  title: string,
  content: string,
  tags: string[],
  userId: string,
  userName: string,
  userAvatar: string
}
```

---

### 7. 管理我的疑问功能
**触发**: 点击"管理我的疑问"按钮  
**显示**: 我发布的所有疑问列表

**功能**:
- 全选/取消全选
- 批量删除疑问
- 标记已解决/未解决
- 查看问题详情
- 显示回答数量

**数据过滤**: `questions.filter(q => q.userId === currentUserId)`

---

### 8. 问题详情查看
**触发**: 点击问题卡片  
**显示内容**:
- 用户信息 (头像、昵称、学校、年级)
- 问题标题
- 问题内容
- 问题标签
- 解决状态
- 回答列表
- 回答输入框

**问题详情API**: `GET /api/community/questions/{questionId}/answers?userId={userId}`

**用户信息API**: `GET /api/user/profile/{userId}`

---

### 9. 回答功能
**回答列表显示**:
- 回答者头像、昵称
- 回答时间
- 回答内容 (支持 Markdown 渲染)
- 最佳答案标记
- 点赞数量和按钮

**提交回答**:
**API**: `POST /api/community/questions/{questionId}/answers`
```javascript
{
  content: string,
  userId: string,
  userName: string,
  userAvatar: string
}
```

**回答输入框**:
- 占位输入框 (只读,点击打开对话框)
- 对话框输入 (多行文本,最多500字)

---

### 10. 回答互动功能

#### 10.1 点赞回答
**API**: 
- 点赞: `POST /api/community/answers/{answerId}/like`
- 取消: `DELETE /api/community/answers/{answerId}/like`

#### 10.2 设为最佳答案
**条件**: 仅问题发布者可操作,且问题未解决  
**API**: `POST /api/community/answers/{answerId}/mark-best`
```javascript
{
  questionId: string,
  userId: string
}
```

---

### 11. 问题状态管理

#### 11.1 标记已解决
**条件**: 仅问题发布者可操作  
**API**: `POST /api/community/questions/{questionId}/solve`
```javascript
{ userId: string }
```

#### 11.2 标记未解决
**API**: `POST /api/community/questions/{questionId}/unsolve`
```javascript
{ userId: string }
```

---

### 12. 收藏功能

#### 12.1 添加收藏
**API**: `POST /api/community/favorites`
```javascript
{
  userId: string,
  questionId: string
}
```

#### 12.2 取消收藏
**API**: `DELETE /api/community/favorites/{questionId}`
```javascript
{ userId: string }
```

#### 12.3 批量删除收藏
循环调用删除API

---

### 13. 问题删除功能

#### 13.1 单个删除
**条件**: 仅问题发布者可操作  
**API**: `DELETE /api/community/questions/{questionId}`
```javascript
{ userId: string }
```

#### 13.2 批量删除
循环调用删除API

---

## 🔧 工具函数

### formatTime(timeStr)
**功能**: 格式化时间显示  
**规则**:
- 60秒内: "刚刚"
- 60分钟内: "N分钟前"
- 24小时内: "N小时前"
- 7天内: "N天前"
- 超过7天: 显示日期 "YYYY-MM-DD"

**输入**: 北京时间字符串 "YYYY-MM-DD HH:mm:ss"

### getGradeLabel(grade)
**功能**: 年级代码转中文  
**映射**: 见上文年级映射表

### getQuestionBorderColor(index)
**功能**: 获取问题卡片边框颜色  
**颜色数组**: ['#0969da', '#35b778', '#ffc107', '#e74c3c']  
**规则**: index % 4

### renderMarkdown(content)
**功能**: Markdown 渲染  
**使用**: marked 库

---

## 📊 数据结构

### Question (问题)
```javascript
{
  id: string,
  userId: string,
  userName: string,
  userAvatar: string,
  title: string,
  content: string,
  tags: string[],
  solved: boolean,
  answerCount: number,
  createTime: string,
  userSchool: string,  // 从用户信息获取
  userGrade: string    // 从用户信息获取
}
```

### Answer (回答)
```javascript
{
  id: string,
  userId: string,
  userName: string,
  userAvatar: string,
  content: string,
  isBest: boolean,
  liked: boolean,
  likeCount: number,
  createTime: string
}
```

### Stats (统计)
```javascript
{
  totalQuestions: number,
  unsolvedQuestions: number,
  myQuestions: number
}
```

---

## 🎨 样式特点

### 问题卡片
- 彩色边框 (2px solid)
- 圆角 12px
- 悬停效果: 阴影 + 上移2px
- 网格布局: 2列2行

### 对话框
- 蓝色描边 (3px solid #0969da)
- 阴影效果
- 居中显示

### 表单标签
- 蓝色背景标签样式
- 圆角 4px
- 白色文字

---

## 📱 响应式设计

### 断点
- 1200px+: 3列统计卡片
- 993px-1199px: 3列统计卡片
- 768px-992px: 3列统计卡片
- 576px以下: 1列统计卡片

---

## 🔗 依赖组件

### Element Plus 组件
- el-icon, el-avatar, el-tag, el-button
- el-dialog, el-form, el-input, el-select, el-checkbox
- el-pagination, el-empty, el-message, el-message-box

### 图标
- QuestionFilled, Warning, ChatDotRound, Star, Medal
- School, Reading, Delete, Check, Plus, Filter, DataAnalysis

### 第三方库
- axios: HTTP 请求
- marked: Markdown 渲染

### 工具函数
- getUserSubjects: 获取用户科目列表

---

## 🚀 生命周期

### onMounted
1. 加载用户科目 (getUserSubjects)
2. 加载统计数据 (loadStats)
3. 加载问题列表 (loadQuestions)
4. 加载我的收藏 (loadMyFavorites)

---

## ⚠️ 注意事项

1. **用户ID**: 从 localStorage 获取 'edu-user-id'
2. **时间格式**: 后端返回北京时间字符串,需要转换处理
3. **响应数据**: 使用 response.data 访问数据 (axios 拦截器已处理)
4. **错误处理**: 所有 API 调用都需要 try-catch
5. **加载状态**: 使用 loading 和 v-loading 指令
6. **确认操作**: 删除操作需要 ElMessageBox.confirm
7. **成功提示**: 使用 ElMessage.success/error
8. **数据刷新**: 操作成功后需要重新加载相关数据

---

**文档结束**
