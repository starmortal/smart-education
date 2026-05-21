<template>
  <div class="changelog-page">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="nav-left">
        <img class="logo" src="../assets/logo.png" alt="logo" @click="goHome" style="cursor: pointer;" />
        <span class="brand" @click="goHome" style="cursor: pointer;">智慧教育平台</span>
      </div>
      <div class="nav-right">
        <el-button text @click="goBack">返回</el-button>
      </div>
    </header>

    <!-- 主内容区 -->
    <div class="changelog-container">
      <div class="changelog-header">
        <h1>更新日志</h1>
        <p class="subtitle">记录平台的每一次进步</p>
      </div>

      <!-- 版本列表 -->
      <div class="version-list">
        <!-- 版本 2.9.0 -->
        <div class="version-item" @click="toggleVersion(0)">
          <div class="version-header">
            <div class="version-info">
              <span class="version-number">v2.9.0</span>
              <span class="version-date">2026-03-10</span>
              <el-tag type="success" size="small">最新版本</el-tag>
            </div>
            <el-icon class="expand-icon" :class="{ expanded: expandedVersion === 0 }">
              <ArrowDown v-if="expandedVersion !== 0" />
              <ArrowUp v-else />
            </el-icon>
          </div>
          
          <transition name="changelog-expand">
            <div v-if="expandedVersion === 0" class="changelog-content" @click.stop>
              <!-- 使用文档系统 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#10b981"><Plus /></el-icon>
                  <span>使用文档系统</span>
                </div>
                <ul class="change-list">
                  <li>新增完整的使用文档页面，全面介绍平台功能</li>
                  <li>涵盖AI答疑、错题集、学习计划、我的笔记、学习社区、个人中心、意见反馈七大功能</li>
                  <li>每个功能提供详细的4步使用教程和特色说明</li>
                  <li>支持无需登录直接访问，方便新用户了解平台</li>
                  <li>登录页面底部导航新增"使用文档"链接</li>
                </ul>
              </div>

              <!-- AI答疑功能增强 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#3b82f6"><Star /></el-icon>
                  <span>AI答疑功能增强</span>
                </div>
                <ul class="change-list">
                  <li>保存笔记弹框新增标签选择功能</li>
                  <li>支持选择"重点"、"难点"、"AI解答"等预设标签</li>
                  <li>动态显示用户设置的学习科目标签</li>
                  <li>最多选择2个标签，与手动添加笔记保持一致</li>
                  <li>默认选中"AI解答"标签，便于分类管理</li>
                  <li>添加标签必选验证，确保笔记分类完整</li>
                </ul>
              </div>

              <!-- 学习社区优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ec4899"><Star /></el-icon>
                  <span>学习社区优化</span>
                </div>
                <ul class="change-list">
                  <li>统计栏和主内容区之间新增鼓励讨论提示</li>
                  <li>提示内容："遇到AI无法理解的复杂问题？欢迎在这里与同学们互相讨论，集思广益找到答案！"</li>
                  <li>问题详情弹框高度优化，改为70vh最大高度</li>
                  <li>只保留弹框内部滚动，隐藏滚动条提升视觉效果</li>
                  <li>支持点击遮罩层关闭弹框，操作更便捷</li>
                </ul>
              </div>

              <!-- 用户体验提升 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#f59e0b"><Star /></el-icon>
                  <span>用户体验提升</span>
                </div>
                <ul class="change-list">
                  <li>使用文档采用响应式设计，支持桌面端和移动端访问</li>
                  <li>功能导航支持点击跳转和滚动监听，自动高亮当前模块</li>
                  <li>AI答疑保存笔记时提供更丰富的标签选择</li>
                  <li>学习社区问题详情查看体验优化</li>
                  <li>所有新增功能都保持与平台整体设计风格一致</li>
                </ul>
              </div>

              <!-- 技术架构优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#8b5cf6"><Tools /></el-icon>
                  <span>技术架构优化</span>
                </div>
                <ul class="change-list">
                  <li>新增UserGuide.vue使用文档页面组件</li>
                  <li>路由系统新增/user-guide路径配置</li>
                  <li>AI答疑页面集成用户科目工具函数</li>
                  <li>优化笔记保存接口，支持标签数组传递</li>
                  <li>完善前端表单验证逻辑，提升数据完整性</li>
                </ul>
              </div>

              <!-- 文档完善 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#10b981"><Plus /></el-icon>
                  <span>文档完善</span>
                </div>
                <ul class="change-list">
                  <li>详细的功能使用教程，降低新用户学习成本</li>
                  <li>每个功能模块都有步骤化指导和特色说明</li>
                  <li>使用emoji和颜色标注突出功能亮点</li>
                  <li>支持平滑滚动和智能导航定位</li>
                  <li>统一的视觉设计语言，提升品牌识别度</li>
                </ul>
              </div>
            </div>
          </transition>
        </div>

        <!-- 版本 2.8.0 -->
        <div class="version-item" @click="toggleVersion(1)">
          <div class="version-header">
            <div class="version-info">
              <span class="version-number">v2.8.0</span>
              <span class="version-date">2026-03-10</span>
            </div>
            <el-icon class="expand-icon" :class="{ expanded: expandedVersion === 1 }">
              <ArrowDown v-if="expandedVersion !== 1" />
              <ArrowUp v-else />
            </el-icon>
          </div>
          
          <transition name="changelog-expand">
            <div v-if="expandedVersion === 1" class="changelog-content" @click.stop>
              <!-- 错题集功能优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#10b981"><Plus /></el-icon>
                  <span>错题集功能优化</span>
                </div>
                <ul class="change-list">
                  <li>错题集顶部三个统计（错题总数、未掌握、已掌握）改为全局统计</li>
                  <li>右侧科目统计也改为全局统计，不受筛选条件影响</li>
                  <li>用户点击"未掌握"或"已掌握"筛选时，统计数据保持不变</li>
                  <li>新增后端全局统计接口，提供准确的统计数据</li>
                  <li>增删改错题后自动刷新全局统计，确保数据实时性</li>
                </ul>
              </div>

              <!-- 学习计划功能优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#3b82f6"><TrendCharts /></el-icon>
                  <span>学习计划功能优化</span>
                </div>
                <ul class="change-list">
                  <li>学习计划顶部三个统计（计划总数、进行中、已完成）改为全局统计</li>
                  <li>右侧状态统计也改为全局统计，不受筛选条件影响</li>
                  <li>用户筛选不同状态时，统计数据保持全局视角</li>
                  <li>新增后端全局统计接口，确保统计准确性</li>
                  <li>计划状态变更后自动刷新全局统计</li>
                </ul>
              </div>

              <!-- 智能状态识别 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ec4899"><Star /></el-icon>
                  <span>智能状态识别</span>
                </div>
                <ul class="change-list">
                  <li>学习计划支持根据完成进度自动识别状态</li>
                  <li>0% 进度自动识别为"未开始"状态</li>
                  <li>1-99% 进度自动识别为"进行中"状态</li>
                  <li>100% 进度自动识别为"已完成"状态</li>
                  <li>用户拖动进度条时实时显示状态变化提示</li>
                  <li>前后端统一状态识别逻辑，确保数据一致性</li>
                </ul>
              </div>

              <!-- 用户体验提升 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#f59e0b"><Star /></el-icon>
                  <span>用户体验提升</span>
                </div>
                <ul class="change-list">
                  <li>统计数据始终显示全局视角，用户对整体情况一目了然</li>
                  <li>筛选功能不影响统计显示，避免用户困惑</li>
                  <li>进度调整时的智能提示，让用户清楚状态变化</li>
                  <li>统计数据实时更新，确保信息准确性</li>
                  <li>优化页面加载性能，统计数据快速展示</li>
                </ul>
              </div>

              <!-- 技术架构优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#8b5cf6"><Tools /></el-icon>
                  <span>技术架构优化</span>
                </div>
                <ul class="change-list">
                  <li>新增错题集全局统计后端接口 /api/error-questions/global-stats</li>
                  <li>新增学习计划全局统计后端接口 /api/study-plans/global-stats</li>
                  <li>前端分离全局统计和筛选统计的数据管理</li>
                  <li>优化统计数据缓存机制，提升页面响应速度</li>
                  <li>完善状态识别算法，支持多种进度场景</li>
                </ul>
              </div>
            </div>
          </transition>
        </div>

        <!-- 版本 2.7.0 -->
        <div class="version-item" @click="toggleVersion(2)">
          <div class="version-header">
            <div class="version-info">
              <span class="version-number">v2.7.0</span>
              <span class="version-date">2026-03-10</span>
            </div>
            <el-icon class="expand-icon" :class="{ expanded: expandedVersion === 2 }">
              <ArrowDown v-if="expandedVersion !== 2" />
              <ArrowUp v-else />
            </el-icon>
          </div>
          
          <transition name="changelog-expand">
            <div v-if="expandedVersion === 2" class="changelog-content" @click.stop>
              <!-- 反馈系统优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#10b981"><Plus /></el-icon>
                  <span>反馈系统优化</span>
                </div>
                <ul class="change-list">
                  <li>优化意见反馈功能，简化状态管理为"已提交"和"已回复"两种状态</li>
                  <li>用户提交反馈后自动发送邮件通知到管理员邮箱 2492592700@qq.com</li>
                  <li>邮件包含反馈类型、用户信息、反馈内容、提交时间等详细信息</li>
                  <li>新增管理员反馈管理系统，支持独立登录和反馈处理</li>
                  <li>管理员可在线查看反馈列表、回复用户反馈</li>
                  <li>反馈历史记录显示状态标签和管理员回复内容</li>
                  <li>支持按状态筛选反馈（已提交/已回复）</li>
                  <li>管理员回复后用户可在反馈历史中查看回复内容</li>
                </ul>
              </div>

              <!-- 管理员系统 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ef4444"><Lock /></el-icon>
                  <span>管理员系统</span>
                </div>
                <ul class="change-list">
                  <li>新增独立的管理员登录页面，需要指定邮箱和密码验证</li>
                  <li>管理员反馈管理页面支持查看反馈详情和用户截图</li>
                  <li>支持在线回复用户反馈，回复后状态自动更新为"已回复"</li>
                  <li>管理员页面采用独立的设计风格，与用户系统区分</li>
                  <li>支持分页显示反馈列表，便于管理大量反馈</li>
                  <li>管理员路由不暴露在普通用户导航中，确保安全性</li>
                  <li>支持按状态筛选反馈列表，便于管理大量反馈</li>
                </ul>
              </div>

              <!-- 顶部导航栏统一优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#3b82f6"><Brush /></el-icon>
                  <span>顶部导航栏统一优化</span>
                </div>
                <ul class="change-list">
                  <li>所有页面顶部导航栏统一添加智慧教育平台Logo</li>
                  <li>Logo位置固定在最左侧，点击可返回首页</li>
                  <li>移除动态页面标题显示，只保留固定Logo和平台名称</li>
                  <li>管理员系统页面标题居中显示，视觉更平衡</li>
                  <li>优化Logo尺寸和样式，在不同页面保持一致</li>
                  <li>响应式设计，移动端自动调整Logo和文字大小</li>
                  <li>统一的悬停效果和过渡动画</li>
                  <li>登录和注册页面也添加了Logo展示</li>
                </ul>
              </div>

              <!-- 底部导航功能完善 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ec4899"><Star /></el-icon>
                  <span>底部导航功能完善</span>
                </div>
                <ul class="change-list">
                  <li>隐私政策和服务条款链接支持直接跳转到对应页面</li>
                  <li>产品功能（AI答疑、学习计划、错题本）点击后弹出注册页面</li>
                  <li>反馈建议点击后提示"请登录后使用反馈功能"</li>
                  <li>更新日志链接保持原有跳转功能不变</li>
                  <li>联系我们点击后弹窗显示邮箱信息，3秒后自动消失</li>
                  <li>优化用户体验，未登录用户也能了解平台功能</li>
                </ul>
              </div>

              <!-- 邮件通知系统 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#8b5cf6"><Tools /></el-icon>
                  <span>邮件通知系统</span>
                </div>
                <ul class="change-list">
                  <li>完善邮件服务配置，使用QQ邮箱发送通知</li>
                  <li>反馈通知邮件采用美观的HTML模板设计</li>
                  <li>邮件包含反馈ID、用户信息、反馈类型、内容等完整信息</li>
                  <li>邮件发送失败不影响反馈提交成功</li>
                  <li>管理员可通过邮件中的反馈ID快速定位和处理</li>
                  <li>邮件模板支持中文显示，格式清晰易读</li>
                </ul>
              </div>

              <!-- 用户体验提升 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#f59e0b"><Star /></el-icon>
                  <span>用户体验提升</span>
                </div>
                <ul class="change-list">
                  <li>反馈页面支持上传截图，管理员可查看用户提供的图片</li>
                  <li>反馈状态用不同颜色标签区分，一目了然</li>
                  <li>管理员回复内容在用户反馈历史中清晰展示</li>
                  <li>优化反馈列表布局，信息层次更清晰</li>
                  <li>所有页面Logo点击都能快速返回首页</li>
                  <li>管理员页面支持响应式设计，移动端也能正常使用</li>
                  <li>统一的视觉设计语言，提升品牌识别度</li>
                </ul>
              </div>

              <!-- 技术架构优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#8b5cf6"><Tools /></el-icon>
                  <span>技术架构优化</span>
                </div>
                <ul class="change-list">
                  <li>重构TopNavBar组件，移除不必要的props传递</li>
                  <li>优化反馈数据模型，支持回复时间和管理员ID</li>
                  <li>新增管理员专用路由和页面组件</li>
                  <li>完善邮件服务模块，支持HTML模板渲染</li>
                  <li>优化前端组件结构，提升代码可维护性</li>
                  <li>统一样式规范，减少重复代码</li>
                  <li>添加详细的功能说明文档</li>
                </ul>
              </div>

              <!-- 安全性增强 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ef4444"><Lock /></el-icon>
                  <span>安全性增强</span>
                </div>
                <ul class="change-list">
                  <li>管理员系统采用独立的登录验证机制</li>
                  <li>管理员路由不在普通用户导航中暴露</li>
                  <li>反馈管理接口仅供内部使用，不公开展示</li>
                  <li>登录状态验证，未登录自动跳转到登录页</li>
                  <li>邮件配置信息安全存储在环境变量中</li>
                </ul>
              </div>
            </div>
          </transition>
        </div>

        <!-- 版本 2.6.0 -->
        <div class="version-item" @click="toggleVersion(3)">
          <div class="version-header">
            <div class="version-info">
              <span class="version-number">v2.6.0</span>
              <span class="version-date">2026-03-10</span>
            </div>
            <el-icon class="expand-icon" :class="{ expanded: expandedVersion === 3 }">
              <ArrowDown v-if="expandedVersion !== 3" />
              <ArrowUp v-else />
            </el-icon>
          </div>
          
          <transition name="changelog-expand">
            <div v-if="expandedVersion === 3" class="changelog-content" @click.stop>
              <!-- 新增功能 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#10b981"><Plus /></el-icon>
                  <span>新增功能</span>
                </div>
                <ul class="change-list">
                  <li>新增隐私政策页面，详细说明平台数据收集和使用规则</li>
                  <li>新增服务条款页面，明确用户权利和平台责任</li>
                  <li>登录和注册表单新增条款勾选功能，符合法规要求</li>
                  <li>底部导航新增"导航"栏目，包含隐私政策和服务条款链接</li>
                  <li>条款页面支持无需登录直接访问，提升用户体验</li>
                </ul>
              </div>

              <!-- UI 优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#3b82f6"><Brush /></el-icon>
                  <span>UI 优化</span>
                </div>
                <ul class="change-list">
                  <li>优化登录页面底部布局，改为左中右三栏均匀分布</li>
                  <li>笔记页面和学习社区页面用户信息卡片采用淡蓝色光晕效果</li>
                  <li>用户信息卡片背景改为从中心向外发散的径向渐变</li>
                  <li>学习社区页面学校和年级信息加粗显示，更加突出</li>
                  <li>条款勾选框采用统一的蓝色主题色，视觉更协调</li>
                </ul>
              </div>

              <!-- 体验优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ec4899"><Star /></el-icon>
                  <span>体验优化</span>
                </div>
                <ul class="change-list">
                  <li>登录和注册前强制勾选条款，确保用户知情同意</li>
                  <li>未勾选条款时显示友好提示，引导用户操作</li>
                  <li>条款页面支持点击链接直接跳转，操作更便捷</li>
                  <li>优化用户信息卡片文字颜色，在新背景下清晰可见</li>
                  <li>调整头像边框和座右铭区域样式，适配新的设计风格</li>
                </ul>
              </div>

              <!-- 合规增强 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ef4444"><Lock /></el-icon>
                  <span>合规增强</span>
                </div>
                <ul class="change-list">
                  <li>完善隐私政策，涵盖信息收集、使用、保护等各个方面</li>
                  <li>明确服务条款，规范用户行为和平台责任</li>
                  <li>强制用户同意条款后才能注册登录，符合法律法规</li>
                  <li>提供详细的用户权利说明，包括数据访问和删除权</li>
                  <li>建立完整的争议解决机制和联系方式</li>
                </ul>
              </div>

              <!-- 技术改进 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#8b5cf6"><Tools /></el-icon>
                  <span>技术改进</span>
                </div>
                <ul class="change-list">
                  <li>新增隐私政策和服务条款路由配置</li>
                  <li>优化CSS渐变效果，使用径向渐变实现光晕效果</li>
                  <li>完善表单验证逻辑，增加条款勾选检查</li>
                  <li>统一页面设计风格，保持视觉一致性</li>
                  <li>优化响应式布局，确保各设备下的良好体验</li>
                </ul>
              </div>
            </div>
          </transition>
        </div>

        <!-- 版本 2.5.0 -->
        <div class="version-item" @click="toggleVersion(4)">
          <div class="version-header">
            <div class="version-info">
              <span class="version-number">v2.5.0</span>
              <span class="version-date">2026-03-09</span>
            </div>
            <el-icon class="expand-icon" :class="{ expanded: expandedVersion === 4 }">
              <ArrowDown v-if="expandedVersion !== 4" />
              <ArrowUp v-else />
            </el-icon>
          </div>
          
          <transition name="changelog-expand">
            <div v-if="expandedVersion === 4" class="changelog-content" @click.stop>
              <!-- UI 全面升级 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#3b82f6"><Brush /></el-icon>
                  <span>UI 全面升级 - 豆包风格</span>
                </div>
                <ul class="change-list">
                  <li>AI 答题页面全新改版，采用豆包风格设计语言</li>
                  <li>侧边栏改为灰色背景（#f5f5f7），视觉更柔和</li>
                  <li>"新对话"按钮移至历史记录列表顶部，永久置顶</li>
                  <li>移除侧边栏收起/展开功能，保持界面简洁</li>
                  <li>选中项添加蓝色描边效果，状态更清晰</li>
                  <li>历史记录移除时间显示，只保留标题</li>
                  <li>输入框宽度限制为 900px，居中显示</li>
                  <li>输入框采用圆角灰色背景，聚焦时变白色</li>
                  <li>发送按钮默认灰色，有内容时自动变蓝色</li>
                  <li>欢迎语改为"你好，我是你的AI学习助手"，字体加大加粗</li>
                  <li>移除聊天图标，界面更简洁</li>
                  <li>添加9个常用学习问题快捷按钮，3列网格布局</li>
                  <li>快捷问题仅作展示，不可点击</li>
                  <li>自定义滚动条样式，更加精致</li>
                </ul>
              </div>

              <!-- 流式输出 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#10b981"><TrendCharts /></el-icon>
                  <span>流式输出</span>
                </div>
                <ul class="change-list">
                  <li>AI 问答改为流式输出，逐字显示回复内容</li>
                  <li>添加闪烁光标动画，提示正在输出</li>
                  <li>移除"AI 思考中"全屏遮罩，体验更流畅</li>
                  <li>使用 SSE (Server-Sent Events) 实现实时推送</li>
                  <li>前端使用 Fetch API 的 ReadableStream 接收数据</li>
                  <li>支持文件上传的流式输出</li>
                  <li>删除所有非流式备用接口，统一使用流式输出</li>
                  <li>AI 成绩分析也改为流式输出</li>
                </ul>
              </div>

              <!-- 新增功能 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#10b981"><Plus /></el-icon>
                  <span>新增功能</span>
                </div>
                <ul class="change-list">
                  <li>支持文件上传功能（最多5个文件，单个最大10MB）</li>
                  <li>支持图片上传功能（单个最大5MB）</li>
                  <li>支持粘贴板直接粘贴图片（Ctrl+V）</li>
                  <li>文件预览功能，图片显示缩略图，文档显示图标</li>
                  <li>上传文件可单独删除</li>
                  <li>后端使用 multer 处理文件上传</li>
                  <li>自动清理上传的临时文件</li>
                </ul>
              </div>

              <!-- 体验优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ec4899"><Star /></el-icon>
                  <span>体验优化</span>
                </div>
                <ul class="change-list">
                  <li>每次进入 AI 答题页面默认选中"新对话"</li>
                  <li>输入框内容和图标垂直居中对齐</li>
                  <li>输入框支持多行输入，自动调整高度（最多4行）</li>
                  <li>按 Enter 快速发送，Shift + Enter 换行</li>
                  <li>发送按钮根据输入状态动态变色</li>
                  <li>消息自动滚动到底部</li>
                  <li>AI 回复支持保存到笔记功能</li>
                  <li>优化错误提示，更加友好</li>
                </ul>
              </div>

              <!-- 技术改进 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#8b5cf6"><Tools /></el-icon>
                  <span>技术改进</span>
                </div>
                <ul class="change-list">
                  <li>新增 /api/ai/text-answer-stream 流式文字答题接口</li>
                  <li>新增 /api/ai/analyze-scores-stream 流式成绩分析接口</li>
                  <li>删除 /api/ai/text-answer 非流式备用接口</li>
                  <li>删除 /api/ai/analyze-scores 非流式备用接口</li>
                  <li>后端配置 multer 文件上传中间件</li>
                  <li>支持图片、PDF、Word、TXT 等多种文件格式</li>
                  <li>文件类型和大小校验</li>
                  <li>所有函数改为箭头函数格式（Vue 3 最佳实践）</li>
                  <li>移除不再使用的 ElLoading 导入</li>
                  <li>优化代码结构，提升可维护性</li>
                </ul>
              </div>

              <!-- Bug 修复 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#f59e0b"><Edit /></el-icon>
                  <span>Bug 修复</span>
                </div>
                <ul class="change-list">
                  <li>修复 handlePaste 等函数在模板中未定义的警告</li>
                  <li>修复快捷问题点击触发错误的问题</li>
                  <li>修复输入框对齐问题</li>
                  <li>修复流式输出时页面滚动问题</li>
                  <li>修复文件上传后未清理的问题</li>
                </ul>
              </div>

              <!-- 代码优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#8b5cf6"><Tools /></el-icon>
                  <span>代码优化</span>
                </div>
                <ul class="change-list">
                  <li>统一使用 const 箭头函数声明，符合 Vue 3 规范</li>
                  <li>优化组件结构，提升代码可读性</li>
                  <li>移除冗余代码和未使用的导入</li>
                  <li>优化样式代码，减少重复</li>
                  <li>添加详细的代码注释</li>
                </ul>
              </div>
            </div>
          </transition>
        </div>

        <!-- 版本 2.4.0 -->
        <div class="version-item" @click="toggleVersion(5)">
          <div class="version-header">
            <div class="version-info">
              <span class="version-number">v2.4.0</span>
              <span class="version-date">2026-03-09</span>
            </div>
            <el-icon class="expand-icon" :class="{ expanded: expandedVersion === 5 }">
              <ArrowDown v-if="expandedVersion !== 5" />
              <ArrowUp v-else />
            </el-icon>
          </div>
          
          <transition name="changelog-expand">
            <div v-if="expandedVersion === 5" class="changelog-content" @click.stop>
              <!-- 新增功能 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#10b981"><Plus /></el-icon>
                  <span>新增功能</span>
                </div>
                <ul class="change-list">
                  <li>AI 成绩分析支持流式输出，实时显示分析内容，提升用户体验</li>
                  <li>新增 AI 成绩分析历史记录功能，支持保存和查看历史分析</li>
                  <li>个人中心新增"AI成绩分析历史"区域，展示最近5条分析记录</li>
                  <li>支持为每次分析添加自定义名称或备注，方便管理</li>
                  <li>历史记录支持点击查看完整分析内容，支持删除操作</li>
                  <li>分析数据持久化存储到 MongoDB，包含考试快照和用户信息</li>
                </ul>
              </div>

              <!-- UI 优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#3b82f6"><Brush /></el-icon>
                  <span>UI 优化</span>
                </div>
                <ul class="change-list">
                  <li>重新设计个人信息卡片布局，头像移至左上角，信息更紧凑</li>
                  <li>年级和学校信息移至头像右侧，两行显示，节省空间</li>
                  <li>编辑资料和用户管理按钮移至卡片标题栏右侧，操作更便捷</li>
                  <li>学习科目显示在第一条分隔线下方，布局更清晰</li>
                  <li>优化 AI 分析弹框高度和滚动，只在弹框内部滚动，外部页面不滚动</li>
                  <li>弹框宽度从 800px 优化为 700px，高度限制为 80vh，更加紧凑</li>
                  <li>添加自定义滚动条样式，视觉更精致</li>
                  <li>历史记录采用简洁的灰色卡片样式，无复杂动画</li>
                  <li>历史记录默认显示3条，超出部分可滚动查看，最多显示10条</li>
                  <li>历史记录滚动条完全隐藏，保持界面简洁美观</li>
                  <li>删除按钮改为简单图标，鼠标悬停时变红</li>
                  <li>成绩显示字体缩小至原来的 0.75 倍，更加紧凑</li>
                </ul>
              </div>

              <!-- 体验优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ec4899"><Star /></el-icon>
                  <span>体验优化</span>
                </div>
                <ul class="change-list">
                  <li>AI 分析过程中显示流式加载指示器，状态反馈更清晰</li>
                  <li>分析完成后"保存分析"按钮自动启用，智能判断是否可保存</li>
                  <li>保存对话框自动生成默认名称（格式：成绩分析-日期）</li>
                  <li>历史记录按创建时间倒序排列，最新记录在最上方</li>
                  <li>点击历史记录卡片查看详情，点击删除图标删除记录</li>
                  <li>优化个人信息卡片间距，布局更加紧凑合理</li>
                  <li>头像尺寸从 100px 优化为 80px，视觉更协调</li>
                </ul>
              </div>

              <!-- 技术改进 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#8b5cf6"><Tools /></el-icon>
                  <span>技术改进</span>
                </div>
                <ul class="change-list">
                  <li>新增 ScoreAnalysis 数据模型，支持分析记录持久化存储</li>
                  <li>新增 /api/ai/analyze-scores-stream 流式分析接口</li>
                  <li>新增 /api/ai/save-score-analysis 保存分析记录接口</li>
                  <li>新增 /api/ai/score-analysis-list 获取历史记录列表接口</li>
                  <li>新增 /api/ai/score-analysis/:id 获取历史记录详情接口</li>
                  <li>新增 /api/ai/score-analysis/:id 删除历史记录接口</li>
                  <li>前端使用 Fetch API 的 ReadableStream 接收流式数据</li>
                  <li>后端使用 SSE (Server-Sent Events) 实现流式输出</li>
                  <li>优化数据快照机制，保存分析时的考试数据和用户信息</li>
                  <li>添加 canSaveAnalysis 计算属性，智能判断保存条件</li>
                </ul>
              </div>

              <!-- Bug 修复 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#f59e0b"><Edit /></el-icon>
                  <span>Bug 修复</span>
                </div>
                <ul class="change-list">
                  <li>修复重复定义 generateAIAnalysis 函数导致的编译错误</li>
                  <li>修复保存分析按钮判断逻辑过于严格的问题</li>
                  <li>修复 AI 分析结果包含 emoji 时无法保存的问题</li>
                  <li>修复弹框打开时外部页面滚动的问题</li>
                  <li>修复历史记录列表横向滚动的问题</li>
                  <li>添加缺失的 saveLoading 和 examLoading 变量声明</li>
                </ul>
              </div>

              <!-- 数据库优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ef4444"><Lock /></el-icon>
                  <span>数据库优化</span>
                </div>
                <ul class="change-list">
                  <li>ScoreAnalysis 模型包含用户ID、分析名称、分析内容等字段</li>
                  <li>支持存储考试数据快照和用户信息快照，便于追溯</li>
                  <li>添加 userId 和 createTime 复合索引，提升查询性能</li>
                  <li>分析名称限制 100 字符，防止过长</li>
                  <li>所有分析记录与用户关联，支持多用户隔离</li>
                </ul>
              </div>
            </div>
          </transition>
        </div>

        <!-- 版本 2.3.0 -->
        <div class="version-item" @click="toggleVersion(6)">
          <div class="version-header">
            <div class="version-info">
              <span class="version-number">v2.3.0</span>
              <span class="version-date">2026-03-09</span>
            </div>
            <el-icon class="expand-icon" :class="{ expanded: expandedVersion === 6 }">
              <ArrowDown v-if="expandedVersion !== 6" />
              <ArrowUp v-else />
            </el-icon>
          </div>
          
          <transition name="changelog-expand">
            <div v-if="expandedVersion === 6" class="changelog-content" @click.stop>
              <!-- 新增功能 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#10b981"><Plus /></el-icon>
                  <span>新增功能</span>
                </div>
                <ul class="change-list">
                  <li>个人中心新增 AI 成绩评价功能，智能分析学习表现</li>
                  <li>AI 评价支持多维度分析：总体表现、优势科目、薄弱科目、成绩趋势</li>
                  <li>基于 DeepSeek AI 生成个性化学习建议</li>
                  <li>支持 Markdown 格式展示分析结果，排版清晰美观</li>
                  <li>AI 分析结果实时生成，提供专业的教育建议</li>
                </ul>
              </div>

              <!-- 体验优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ec4899"><Star /></el-icon>
                  <span>体验优化</span>
                </div>
                <ul class="change-list">
                  <li>个人中心弹框支持点击遮罩层关闭，操作更便捷</li>
                  <li>设置满分、学习建议、添加考试弹框均支持快速关闭</li>
                  <li>AI 分析过程显示加载动画，提供清晰的状态反馈</li>
                  <li>优化 AI 分析超时时间至 120 秒，确保分析完成</li>
                  <li>简化 AI 提示词，减少生成时间，提升响应速度</li>
                </ul>
              </div>

              <!-- 认证系统完善 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ef4444"><Lock /></el-icon>
                  <span>认证系统完善</span>
                </div>
                <ul class="change-list">
                  <li>修复登录接口未返回 token 的问题</li>
                  <li>修复注册接口未返回 token 的问题</li>
                  <li>登录/注册成功后自动保存 JWT token 到本地存储</li>
                  <li>token 有效期设置为 7 天，提升用户体验</li>
                  <li>完善 token 认证机制，确保 API 调用安全</li>
                </ul>
              </div>

              <!-- Bug 修复 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#f59e0b"><Edit /></el-icon>
                  <span>Bug 修复</span>
                </div>
                <ul class="change-list">
                  <li>修复 AI 评价功能因缺少 token 导致的 401 错误</li>
                  <li>修复登录后无法调用需要认证的 API 接口的问题</li>
                  <li>修复 AI 分析请求超时导致的错误提示不明确问题</li>
                  <li>修复前端请求拦截器未正确添加 token 的问题</li>
                  <li>优化错误处理逻辑，提供更友好的错误提示</li>
                </ul>
              </div>

              <!-- 技术改进 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#8b5cf6"><Tools /></el-icon>
                  <span>技术改进</span>
                </div>
                <ul class="change-list">
                  <li>新增 /api/ai/analyze-scores 后端接口，支持成绩分析</li>
                  <li>集成 marked 库，支持 Markdown 渲染</li>
                  <li>优化 axios 请求拦截器，自动添加认证 token</li>
                  <li>完善错误处理机制，区分超时、网络、认证等不同错误</li>
                  <li>优化 AI 提示词结构，提升分析质量和生成速度</li>
                </ul>
              </div>

              <!-- 安全增强 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#3b82f6"><Lock /></el-icon>
                  <span>安全增强</span>
                </div>
                <ul class="change-list">
                  <li>使用 JWT 签名机制，确保 token 安全性</li>
                  <li>token 包含用户 ID 信息，支持用户身份验证</li>
                  <li>后端认证中间件验证 token 有效性和过期时间</li>
                  <li>前端自动处理 token 过期，提示用户重新登录</li>
                  <li>所有需要认证的接口统一使用 authMiddleware 保护</li>
                </ul>
              </div>
            </div>
          </transition>
        </div>

        <!-- 版本 2.2.0 -->
        <div class="version-item" @click="toggleVersion(7)">
          <div class="version-header">
            <div class="version-info">
              <span class="version-number">v2.2.0</span>
              <span class="version-date">2026-03-08</span>
            </div>
            <el-icon class="expand-icon" :class="{ expanded: expandedVersion === 7 }">
              <ArrowDown v-if="expandedVersion !== 7" />
              <ArrowUp v-else />
            </el-icon>
          </div>
          
          <transition name="changelog-expand">
            <div v-if="expandedVersion === 7" class="changelog-content" @click.stop>
              <!-- 核心升级 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ef4444"><TrendCharts /></el-icon>
                  <span>核心升级</span>
                </div>
                <ul class="change-list">
                  <li>AI 答题引擎从百度文心一言切换到 DeepSeek AI</li>
                  <li>使用 deepseek-chat 模型，性能更强，响应更快</li>
                  <li>完全兼容 OpenAI SDK，代码更简洁高效</li>
                  <li>支持流式对话接口，提升用户体验</li>
                </ul>
              </div>

              <!-- 新增功能 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#10b981"><Plus /></el-icon>
                  <span>新增功能</span>
                </div>
                <ul class="change-list">
                  <li>AI 对话支持会话管理，同一对话中多次提问归为一个会话</li>
                  <li>历史记录支持多轮对话展示，点击可查看完整对话内容</li>
                  <li>新增会话 ID 机制，自动追踪和管理对话上下文</li>
                  <li>历史记录按最后更新时间排序，最新对话置顶</li>
                  <li>支持在已有对话中继续提问，无需创建新会话</li>
                </ul>
              </div>

              <!-- 数据模型优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#8b5cf6"><Tools /></el-icon>
                  <span>数据模型优化</span>
                </div>
                <ul class="change-list">
                  <li>重构 AIHistory 数据模型，支持多轮对话存储</li>
                  <li>新增 title 字段存储对话标题（取第一个问题）</li>
                  <li>新增 messages 数组存储多轮问答记录</li>
                  <li>新增 updateTime 字段记录最后更新时间</li>
                  <li>优化数据库索引，提升查询性能</li>
                </ul>
              </div>

              <!-- Bug 修复 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#f59e0b"><Edit /></el-icon>
                  <span>Bug 修复</span>
                </div>
                <ul class="change-list">
                  <li>修复同一对话中多次提问创建多条历史记录的问题</li>
                  <li>修复历史记录列表显示重复的 bug</li>
                  <li>修复旧数据格式兼容性问题，避免读取错误</li>
                  <li>修复 updateTime 字段为空导致的崩溃问题</li>
                  <li>优化错误处理，增加数据兼容性检查</li>
                </ul>
              </div>

              <!-- 体验优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ec4899"><Star /></el-icon>
                  <span>体验优化</span>
                </div>
                <ul class="change-list">
                  <li>优化历史记录加载逻辑，减少不必要的刷新</li>
                  <li>新对话首次提问后自动刷新历史列表</li>
                  <li>继续对话时不再创建新记录，保持列表整洁</li>
                  <li>历史记录详情展示所有轮次的完整对话</li>
                  <li>优化会话切换体验，状态管理更清晰</li>
                </ul>
              </div>

              <!-- 配置优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#3b82f6"><Lock /></el-icon>
                  <span>配置优化</span>
                </div>
                <ul class="change-list">
                  <li>环境变量从 QIANFAN_API_KEY 改为 DEEPSEEK_API_KEY</li>
                  <li>移除 QIANFAN_APP_ID 配置，简化配置流程</li>
                  <li>更新 API 基础地址为 DeepSeek 官方接口</li>
                  <li>优化日志输出，更清晰地显示使用的模型</li>
                  <li>添加 API Key 配置检查和友好提示</li>
                </ul>
              </div>
            </div>
          </transition>
        </div>

        <!-- 版本 2.1.0 -->
        <div class="version-item" @click="toggleVersion(8)">
          <div class="version-header">
            <div class="version-info">
              <span class="version-number">v2.1.0</span>
              <span class="version-date">2026-03-08</span>
            </div>
            <el-icon class="expand-icon" :class="{ expanded: expandedVersion === 8 }">
              <ArrowDown v-if="expandedVersion !== 8" />
              <ArrowUp v-else />
            </el-icon>
          </div>
          
          <transition name="changelog-expand">
            <div v-if="expandedVersion === 8" class="changelog-content" @click.stop>
              <!-- 新增功能 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#10b981"><Plus /></el-icon>
                  <span>新增功能</span>
                </div>
                <ul class="change-list">
                  <li>新增拼图滑动验证码组件，提供更安全的验证方式</li>
                  <li>验证码支持随机背景图片和拼图位置，每次都不同</li>
                  <li>添加验证成功/失败的视觉反馈动画</li>
                  <li>新增验证码刷新功能，支持手动刷新</li>
                  <li>支持鼠标拖拽和触摸操作，兼容移动端</li>
                </ul>
              </div>

              <!-- UI 优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#3b82f6"><Brush /></el-icon>
                  <span>UI 优化</span>
                </div>
                <ul class="change-list">
                  <li>增加所有弹框圆角从 24px 到 32px，视觉更柔和</li>
                  <li>优化输入框圆角为 16px，整体风格更统一</li>
                  <li>优化按钮圆角为 16px，提升视觉一致性</li>
                  <li>注册按钮颜色从绿色改为蓝色，与主题色保持一致</li>
                  <li>拼图验证码采用真实拼图效果，带凹凸形状</li>
                </ul>
              </div>

              <!-- 表单优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#f59e0b"><Edit /></el-icon>
                  <span>表单优化</span>
                </div>
                <ul class="change-list">
                  <li>调整注册表单字段顺序：用户名 → 邮箱 → 密码 → 确认密码 → 验证码</li>
                  <li>验证码输入框移至最下方，更符合用户填写习惯</li>
                  <li>用户名校验：只允许中文、数字、字母，不允许特殊符号</li>
                  <li>邮箱校验：限制为QQ邮箱（纯数字@qq.com格式）</li>
                  <li>发送验证码前增加7层校验，确保信息完整正确</li>
                </ul>
              </div>

              <!-- 安全增强 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ef4444"><Lock /></el-icon>
                  <span>安全增强</span>
                </div>
                <ul class="change-list">
                  <li>发送验证码前必须先完成密码和确认密码的输入</li>
                  <li>密码必须包含大小写字母、数字和特殊字符</li>
                  <li>两次密码必须一致才能发送验证码</li>
                  <li>拼图验证码增加10px容错范围，既安全又人性化</li>
                  <li>验证失败自动刷新，防止暴力破解</li>
                </ul>
              </div>

              <!-- 体验优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ec4899"><Star /></el-icon>
                  <span>体验优化</span>
                </div>
                <ul class="change-list">
                  <li>优化错误提示信息，更加清晰明确</li>
                  <li>验证成功后0.8秒自动关闭弹窗并发送验证码</li>
                  <li>验证失败后1秒自动刷新，无需手动操作</li>
                  <li>拼图验证码添加阴影效果，增强立体感</li>
                  <li>滑动条添加渐变色填充，视觉反馈更直观</li>
                </ul>
              </div>

              <!-- 技术改进 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#8b5cf6"><Tools /></el-icon>
                  <span>技术改进</span>
                </div>
                <ul class="change-list">
                  <li>创建独立的 SlideVerify.vue 拼图验证组件</li>
                  <li>使用 Canvas API 绘制拼图和背景</li>
                  <li>优化拖拽事件处理，支持鼠标和触摸</li>
                  <li>组件卸载时自动清理事件监听器，防止内存泄漏</li>
                  <li>图片加载失败时自动降级为渐变色背景</li>
                </ul>
              </div>
            </div>
          </transition>
        </div>

        <!-- 版本 2.0.0 -->
        <div class="version-item" @click="toggleVersion(9)">
          <div class="version-header">
            <div class="version-info">
              <span class="version-number">v2.0.0</span>
              <span class="version-date">2026-03-08</span>
            </div>
            <el-icon class="expand-icon" :class="{ expanded: expandedVersion === 9 }">
              <ArrowDown v-if="expandedVersion !== 9" />
              <ArrowUp v-else />
            </el-icon>
          </div>
          
          <transition name="changelog-expand">
            <div v-if="expandedVersion === 9" class="changelog-content" @click.stop>
              <!-- UI 优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#3b82f6"><Brush /></el-icon>
                  <span>UI 优化</span>
                </div>
                <ul class="change-list">
                  <li>重新设计了登录页面，采用现代化浅色渐变背景</li>
                  <li>优化了顶部导航栏，改为固定定位并添加毛玻璃效果</li>
                  <li>优化了功能卡片的图标显示，更换为更贴合功能的图标</li>
                  <li>改进了底部页脚配色，从深色改为白色背景</li>
                  <li>增强了页面滚动时的淡入动画效果，提升视觉体验</li>
                </ul>
              </div>

              <!-- 新增功能 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#10b981"><Plus /></el-icon>
                  <span>新增功能</span>
                </div>
                <ul class="change-list">
                  <li>新增更新日志页面，支持按类型分类展示更新内容</li>
                  <li>添加了标题文字渐变和光影扫过动画效果</li>
                  <li>新增了 CTA 区域的局部蓝色光晕渲染效果</li>
                  <li>添加了各个区域的滚动触发淡入动画</li>
                </ul>
              </div>

              <!-- 体验优化 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#ec4899"><Star /></el-icon>
                  <span>体验优化</span>
                </div>
                <ul class="change-list">
                  <li>优化了 Hero 区域背景色，改为非常浅的渐变色</li>
                  <li>优化了 CTA 区域背景，从深蓝色改为浅色渐变</li>
                  <li>改进了光影动画效果，增加停顿时间避免频繁闪烁</li>
                  <li>优化了功能卡片、FAQ、Why 区域的淡入动画时序</li>
                  <li>改进了页面整体配色方案，更加清新淡雅</li>
                </ul>
              </div>

              <!-- Bug 修复 -->
              <div class="change-category">
                <div class="category-title">
                  <el-icon color="#8b5cf6"><Tools /></el-icon>
                  <span>Bug 修复</span>
                </div>
                <ul class="change-list">
                  <li>修复了底部页脚链接点击无响应的问题</li>
                  <li>修复了 goToPage 函数未定义导致的运行时错误</li>
                  <li>修复了更新日志页面路由配置问题</li>
                </ul>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Brush, Plus, TrendCharts, Lock, Tools, Star, ArrowDown, ArrowUp, Edit } from '@element-plus/icons-vue';

const router = useRouter();
const expandedVersion = ref(null);

function goHome() {
  router.push('/login');
}

function goBack() {
  router.back();
}

function toggleVersion(index) {
  expandedVersion.value = expandedVersion.value === index ? null : index;
}
</script>


<style scoped>
/* ========== 全局样式 ========== */
.changelog-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #fef3f2 100%);
}

/* ========== 顶部导航 ========== */
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 60px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.brand {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.nav-right {
  display: flex;
  gap: 12px;
}

/* ========== 主内容区 ========== */
.changelog-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 120px 24px 80px;
}

.changelog-header {
  text-align: center;
  margin-bottom: 60px;
}

.changelog-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
}

/* ========== 版本列表 ========== */
.version-list {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.version-item {
  background: white;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
}

.version-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.version-number {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.version-date {
  font-size: 12px;
  color: #94a3b8;
  padding: 2px 8px;
  background: #f1f5f9;
  border-radius: 4px;
}

.expand-icon {
  font-size: 18px;
  color: #64748b;
  transition: transform 0.3s ease;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

/* ========== 更新内容 ========== */
.changelog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.changelog-expand-enter-active,
.changelog-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.changelog-expand-enter-from,
.changelog-expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
}

.changelog-expand-enter-to,
.changelog-expand-leave-from {
  opacity: 1;
  max-height: 2000px;
}

.change-category {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.change-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.change-list li {
  position: relative;
  padding-left: 16px;
  margin-bottom: 4px;
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
}

.change-list li::before {
  content: '•';
  position: absolute;
  left: 6px;
  color: #3b82f6;
  font-weight: bold;
}

/* ========== 不同类型的边框颜色 ========== */
.change-category:has(.category-title .el-icon[color="#3b82f6"]) {
  border-left-color: #3b82f6;
}

.change-category:has(.category-title .el-icon[color="#10b981"]) {
  border-left-color: #10b981;
}

.change-category:has(.category-title .el-icon[color="#f59e0b"]) {
  border-left-color: #f59e0b;
}

.change-category:has(.category-title .el-icon[color="#ef4444"]) {
  border-left-color: #ef4444;
}

.change-category:has(.category-title .el-icon[color="#8b5cf6"]) {
  border-left-color: #8b5cf6;
}

.change-category:has(.category-title .el-icon[color="#ec4899"]) {
  border-left-color: #ec4899;
}

/* ========== 响应式设计 ========== */
@media (max-width: 768px) {
  .top-nav {
    padding: 0 20px;
    height: 60px;
  }
  
  .brand {
    font-size: 16px;
  }
  
  .logo {
    width: 32px;
    height: 32px;
  }
  
  .changelog-container {
    padding: 100px 16px 60px;
  }
  
  .changelog-header h1 {
    font-size: 36px;
  }
  
  .subtitle {
    font-size: 16px;
  }
  
  .version-item {
    padding: 24px 20px;
  }
  
  .version-number {
    font-size: 24px;
  }
  
  .version-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
