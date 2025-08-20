import { event } from '@/components/analytics/google-analytics'

// 用户行为跟踪
export const trackUserAction = {
  // 用户注册
  signup: (method: string) => {
    event({
      action: 'sign_up',
      category: 'engagement',
      label: method,
    })
  },

  // 用户登录
  login: (method: string) => {
    event({
      action: 'login',
      category: 'engagement',
      label: method,
    })
  },

  // 创建冲刺
  createSprint: (type: string) => {
    event({
      action: 'create_sprint',
      category: 'sprint',
      label: type,
    })
  },

  // 完成冲刺
  completeSprint: (duration: number) => {
    event({
      action: 'complete_sprint',
      category: 'sprint',
      value: duration,
    })
  },

  // 加入冲刺
  joinSprint: (sprintId: string) => {
    event({
      action: 'join_sprint',
      category: 'sprint',
      label: sprintId,
    })
  },

  // 分享冲刺
  shareSprint: (method: string) => {
    event({
      action: 'share',
      category: 'sprint',
      label: method,
    })
  },

  // 查看排行榜
  viewLeaderboard: () => {
    event({
      action: 'view_leaderboard',
      category: 'engagement',
    })
  },

  // 点击CTA按钮
  clickCTA: (buttonName: string, location: string) => {
    event({
      action: 'click_cta',
      category: 'engagement',
      label: `${buttonName}_${location}`,
    })
  },

  // 查看功能
  viewFeature: (featureName: string) => {
    event({
      action: 'view_feature',
      category: 'engagement',
      label: featureName,
    })
  },

  // 错误跟踪
  error: (errorType: string, errorMessage: string) => {
    event({
      action: 'error',
      category: 'error',
      label: `${errorType}: ${errorMessage}`,
    })
  },
}

// 性能跟踪
export const trackPerformance = {
  // 页面加载时间
  pageLoad: (pageName: string, loadTime: number) => {
    event({
      action: 'page_load_time',
      category: 'performance',
      label: pageName,
      value: Math.round(loadTime),
    })
  },

  // API响应时间
  apiResponse: (endpoint: string, responseTime: number) => {
    event({
      action: 'api_response_time',
      category: 'performance',
      label: endpoint,
      value: Math.round(responseTime),
    })
  },
}
