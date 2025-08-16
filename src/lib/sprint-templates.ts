import { SprintTemplateConfig, SprintTemplate, SprintDifficulty, SprintType } from '@/types/sprint'

/**
 * 预定义的冲刺模板配置
 */
export const SPRINT_TEMPLATES: Record<SprintTemplate, SprintTemplateConfig> = {
  '7days': {
    id: '7days',
    name: '7天快速冲刺',
    description: '适合短期技能学习或小型项目的快速冲刺',
    duration: 7,
    difficulty: 'beginner',
    recommendedTasks: 5,
    recommendedMilestones: 2,
    phases: [
      {
        name: '准备阶段',
        description: '制定计划，准备资源',
        duration: 1,
        tasks: ['资源收集', '计划制定', '环境准备']
      },
      {
        name: '执行阶段',
        description: '专注执行核心任务',
        duration: 5,
        tasks: ['核心学习', '实践练习', '问题解决']
      },
      {
        name: '总结阶段',
        description: '回顾总结，巩固成果',
        duration: 1,
        tasks: ['成果整理', '经验总结', '下一步规划']
      }
    ],
    suitableFor: ['learning', 'project'],
    successFactors: [
      '目标明确具体',
      '时间安排紧凑',
      '专注度高',
      '及时调整计划'
    ],
    tips: [
      '选择相对简单的目标',
      '每天至少投入2-3小时',
      '避免多任务并行',
      '及时记录进展和问题'
    ]
  },

  '21days': {
    id: '21days',
    name: '21天习惯养成',
    description: '基于21天习惯养成理论的中期冲刺计划',
    duration: 21,
    difficulty: 'intermediate',
    recommendedTasks: 8,
    recommendedMilestones: 3,
    phases: [
      {
        name: '适应期',
        description: '建立初步习惯，克服阻力',
        duration: 7,
        tasks: ['基础练习', '习惯建立', '阻力克服']
      },
      {
        name: '稳定期',
        description: '巩固习惯，提升质量',
        duration: 7,
        tasks: ['深度练习', '质量提升', '技能巩固']
      },
      {
        name: '强化期',
        description: '习惯固化，成果展示',
        duration: 7,
        tasks: ['高级应用', '成果输出', '经验分享']
      }
    ],
    suitableFor: ['learning', 'project'],
    successFactors: [
      '坚持每日练习',
      '循序渐进提升',
      '及时反馈调整',
      '社群支持激励'
    ],
    tips: [
      '前7天最关键，要坚持住',
      '建立明确的每日例行公事',
      '寻找学习伙伴互相监督',
      '记录每日进展和感受'
    ]
  },

  '30days': {
    id: '30days',
    name: '30天深度学习',
    description: '适合深度学习某项技能或完成中型项目',
    duration: 30,
    difficulty: 'intermediate',
    recommendedTasks: 12,
    recommendedMilestones: 4,
    phases: [
      {
        name: '基础建设期',
        description: '打好基础，建立框架',
        duration: 10,
        tasks: ['理论学习', '基础练习', '框架搭建']
      },
      {
        name: '能力提升期',
        description: '深入学习，技能进阶',
        duration: 15,
        tasks: ['进阶学习', '项目实践', '问题解决']
      },
      {
        name: '成果输出期',
        description: '整合应用，输出成果',
        duration: 5,
        tasks: ['项目完善', '成果展示', '经验总结']
      }
    ],
    suitableFor: ['learning', 'project'],
    successFactors: [
      '系统性学习规划',
      '理论与实践结合',
      '持续反馈改进',
      '阶段性成果验证'
    ],
    tips: [
      '制定详细的学习路径',
      '每周进行一次回顾总结',
      '寻找实际项目进行练习',
      '建立知识体系和笔记'
    ]
  },

  '60days': {
    id: '60days',
    name: '60天技能精进',
    description: '适合技能深度精进或大型项目开发',
    duration: 60,
    difficulty: 'advanced',
    recommendedTasks: 20,
    recommendedMilestones: 6,
    phases: [
      {
        name: '规划准备期',
        description: '深度规划，资源准备',
        duration: 10,
        tasks: ['需求分析', '技术调研', '资源准备']
      },
      {
        name: '基础建设期',
        description: '核心技能学习，基础搭建',
        duration: 20,
        tasks: ['核心学习', '基础实践', '技能积累']
      },
      {
        name: '深度实践期',
        description: '项目开发，技能应用',
        duration: 20,
        tasks: ['项目开发', '技能应用', '问题攻克']
      },
      {
        name: '优化完善期',
        description: '优化改进，成果完善',
        duration: 10,
        tasks: ['性能优化', '功能完善', '文档整理']
      }
    ],
    suitableFor: ['learning', 'project'],
    successFactors: [
      '长期坚持能力',
      '系统性思维',
      '问题解决能力',
      '自我驱动力'
    ],
    tips: [
      '分解为多个小目标',
      '建立里程碑检查点',
      '保持学习节奏',
      '寻求专业指导'
    ]
  },

  '90days': {
    id: '90days',
    name: '90天专业转型',
    description: '适合职业转型或专业技能体系建设',
    duration: 90,
    difficulty: 'expert',
    recommendedTasks: 30,
    recommendedMilestones: 9,
    phases: [
      {
        name: '基础夯实期',
        description: '系统学习基础知识',
        duration: 30,
        tasks: ['理论体系', '基础技能', '工具掌握']
      },
      {
        name: '实践提升期',
        description: '项目实践，技能进阶',
        duration: 30,
        tasks: ['项目实战', '技能进阶', '经验积累']
      },
      {
        name: '专业精进期',
        description: '专业深度，作品输出',
        duration: 30,
        tasks: ['专业深度', '作品集', '求职准备']
      }
    ],
    suitableFor: ['learning', 'project'],
    successFactors: [
      '强大的自制力',
      '系统性学习能力',
      '持续改进意识',
      '专业网络建设'
    ],
    tips: [
      '制定详细的90天路线图',
      '每月进行深度复盘',
      '建立专业学习社群',
      '准备作品集和简历'
    ]
  },

  'custom': {
    id: 'custom',
    name: '自定义冲刺',
    description: '根据个人需求自定义冲刺计划',
    duration: 0, // 用户自定义
    difficulty: 'intermediate',
    recommendedTasks: 0,
    recommendedMilestones: 0,
    phases: [],
    suitableFor: ['learning', 'project'],
    successFactors: [
      '明确的目标设定',
      '合理的时间规划',
      '可执行的任务分解',
      '有效的进度跟踪'
    ],
    tips: [
      '根据实际情况设定时间',
      '确保目标具体可衡量',
      '合理分配任务难度',
      '设置检查点和里程碑'
    ]
  }
}

/**
 * 根据冲刺类型获取推荐模板
 */
export function getRecommendedTemplates(sprintType: SprintType): SprintTemplate[] {
  return Object.keys(SPRINT_TEMPLATES).filter(templateId => {
    const template = SPRINT_TEMPLATES[templateId as SprintTemplate]
    return template.suitableFor.includes(sprintType)
  }) as SprintTemplate[]
}

/**
 * 根据难度级别获取推荐模板
 */
export function getTemplatesByDifficulty(difficulty: SprintDifficulty): SprintTemplate[] {
  return Object.keys(SPRINT_TEMPLATES).filter(templateId => {
    const template = SPRINT_TEMPLATES[templateId as SprintTemplate]
    return template.difficulty === difficulty
  }) as SprintTemplate[]
}

/**
 * 获取模板的详细信息
 */
export function getTemplateInfo(templateId: SprintTemplate): SprintTemplateConfig {
  return SPRINT_TEMPLATES[templateId]
}

/**
 * 计算模板的推荐配置
 */
export function calculateTemplateRecommendations(
  templateId: SprintTemplate,
  customDuration?: number
): {
  duration: number
  recommendedTasks: number
  recommendedMilestones: number
  dailyTimeCommitment: number
} {
  const template = SPRINT_TEMPLATES[templateId]
  const duration = customDuration || template.duration
  
  // 根据持续时间调整推荐任务数
  const tasksPerWeek = template.recommendedTasks / (template.duration / 7)
  const recommendedTasks = Math.ceil(tasksPerWeek * (duration / 7))
  
  // 根据持续时间调整里程碑数
  const milestonesPerWeek = template.recommendedMilestones / (template.duration / 7)
  const recommendedMilestones = Math.max(1, Math.ceil(milestonesPerWeek * (duration / 7)))
  
  // 计算每日时间投入建议（分钟）
  const dailyTimeCommitment = template.difficulty === 'beginner' ? 60 :
                             template.difficulty === 'intermediate' ? 90 :
                             template.difficulty === 'advanced' ? 120 : 150
  
  return {
    duration,
    recommendedTasks,
    recommendedMilestones,
    dailyTimeCommitment
  }
}

/**
 * 验证模板配置
 */
export function validateTemplateConfig(config: Partial<SprintTemplateConfig>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!config.name || config.name.trim().length === 0) {
    errors.push('模板名称不能为空')
  }
  
  if (!config.duration || config.duration <= 0) {
    errors.push('持续时间必须大于0')
  }
  
  if (config.duration && config.duration > 365) {
    errors.push('持续时间不能超过365天')
  }
  
  if (!config.phases || config.phases.length === 0) {
    errors.push('至少需要一个阶段')
  }
  
  if (config.phases) {
    const totalPhaseDuration = config.phases.reduce((sum, phase) => sum + phase.duration, 0)
    if (totalPhaseDuration !== config.duration) {
      errors.push('阶段总时长必须等于冲刺总时长')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
