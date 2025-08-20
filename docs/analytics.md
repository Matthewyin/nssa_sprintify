# Google Analytics 集成文档

## 📊 概述

NSSA Sprintify 已集成 Google Analytics 4 (GA4) 用于网站分析和用户行为跟踪。

## 🔧 配置

### 环境变量
```bash
# .env.local
NEXT_PUBLIC_GA_TRACKING_ID=G-JW4YYYW6TV
```

### 跟踪ID
- **生产环境**: `G-JW4YYYW6TV`
- **开发环境**: 不加载GA脚本

## 📈 跟踪事件

### 自动跟踪
- ✅ **页面浏览** - 所有页面自动跟踪
- ✅ **路由变化** - SPA路由变化跟踪

### 用户行为跟踪
- ✅ **用户注册** (`sign_up`)
- ✅ **用户登录** (`login`)
- ✅ **CTA按钮点击** (`click_cta`)
- ✅ **错误事件** (`error`)

### 冲刺相关跟踪
- 🔄 **创建冲刺** (`create_sprint`)
- 🔄 **完成冲刺** (`complete_sprint`)
- 🔄 **加入冲刺** (`join_sprint`)
- 🔄 **分享冲刺** (`share`)

### 功能使用跟踪
- 🔄 **查看排行榜** (`view_leaderboard`)
- 🔄 **查看功能** (`view_feature`)

## 🛠️ 使用方法

### 页面跟踪
```tsx
import { useAnalytics } from '@/hooks/use-analytics'

export default function MyPage() {
  // 自动跟踪页面浏览
  useAnalytics()
  
  return <div>My Page Content</div>
}
```

### 事件跟踪
```tsx
import { trackUserAction } from '@/utils/analytics'

// 跟踪按钮点击
const handleClick = () => {
  trackUserAction.clickCTA('按钮名称', '位置')
}

// 跟踪用户操作
const handleCreateSprint = () => {
  trackUserAction.createSprint('学习冲刺')
}

// 跟踪错误
const handleError = (error: Error) => {
  trackUserAction.error('api_error', error.message)
}
```

## 📋 已集成页面

### ✅ 已完成
- **主页** (`/`) - 页面浏览 + CTA点击
- **认证页** (`/auth`) - 页面浏览 + 登录/注册事件

### 🔄 待集成
- **冲刺创建页** - 创建冲刺事件
- **冲刺详情页** - 加入冲刺事件
- **排行榜页** - 查看排行榜事件
- **用户仪表板** - 功能使用跟踪

## 🎯 关键指标

### 转化漏斗
1. **页面访问** → **注册按钮点击** → **完成注册**
2. **登录** → **创建冲刺** → **完成冲刺**

### 用户参与度
- 页面停留时间
- 跳出率
- 会话时长
- 回访率

### 功能使用
- 冲刺创建率
- 冲刺完成率
- 功能使用频率

## 🔒 隐私合规

- ✅ 仅在生产环境加载
- ✅ 不收集个人身份信息
- ✅ 遵循GDPR要求
- ✅ 用户可选择退出

## 🚀 部署注意事项

### 生产环境
- GA脚本自动加载
- 所有事件正常跟踪

### 开发环境
- GA脚本不加载
- 事件函数安全调用（不会报错）

## 📊 数据查看

访问 [Google Analytics](https://analytics.google.com/analytics/web/#/p460516) 查看数据：

### 实时数据
- 当前活跃用户
- 实时页面浏览
- 实时事件

### 报告
- 用户获取报告
- 参与度报告
- 转化报告
- 自定义事件报告

## 🔧 故障排除

### 常见问题
1. **开发环境看不到数据** - 正常，GA只在生产环境加载
2. **事件不显示** - 检查网络连接和GA配置
3. **页面浏览不准确** - 检查路由跟踪配置

### 调试方法
```javascript
// 浏览器控制台检查
console.log('GA Loaded:', typeof window.gtag !== 'undefined')
console.log('GA ID:', process.env.NEXT_PUBLIC_GA_TRACKING_ID)
```

## 📝 更新日志

### v1.0.0 (2025-01-20)
- ✅ 基础GA4集成
- ✅ 页面浏览跟踪
- ✅ 用户行为事件
- ✅ CTA按钮跟踪
- ✅ 错误事件跟踪
