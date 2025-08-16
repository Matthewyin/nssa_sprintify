# Firestore数据库结构设计

## 数据库架构概览

```
/users/{userId}/
├── profile/                    # 用户基本信息
├── settings/                   # 用户设置
│   └── preferences             # 偏好设置
├── sprints/                    # 冲刺计划
│   └── {sprintId}/
│       ├── info                # 冲刺基本信息
│       ├── tasks/              # 任务集合
│       ├── phases/             # 阶段集合
│       └── milestones/         # 里程碑集合
├── aiUsage/                    # AI使用统计
│   └── {date}                  # 按日期存储
├── stats/                      # 用户统计数据
├── aiHistory/                  # AI对话历史
└── knowledgeGraph/             # Obsidian知识图谱
```

## 详细集合结构

### 1. 用户基本信息 (`/users/{userId}`)

```typescript
interface UserDocument {
  id: string                    // 用户ID (Firebase Auth UID)
  email: string                 // 邮箱地址
  displayName: string           // 显示名称
  userType: 'normal' | 'premium' | 'admin'  // 用户等级
  createdAt: Timestamp          // 创建时间
  updatedAt: Timestamp          // 更新时间
  lastLoginAt?: Timestamp       // 最后登录时间
  emailVerified: boolean        // 邮箱验证状态
  avatar?: string               // 头像URL
}
```

### 2. 用户设置 (`/users/{userId}/settings/preferences`)

```typescript
interface UserSettings {
  userId: string
  notifications: {
    email: boolean              // 邮件通知
    push: boolean               // 推送通知
    dailyReminder: boolean      // 每日提醒
    deadlineReminder: boolean   // 截止日期提醒
    milestoneReminder: boolean  // 里程碑提醒
    reminderTime: string        // 提醒时间 (HH:MM)
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'  // 主题
    language: 'zh-CN' | 'en-US'         // 语言
    timezone: string                     // 时区
    dateFormat: string                   // 日期格式
    timeFormat: '12h' | '24h'           // 时间格式
  }
  obsidian?: {
    enabled: boolean            // 是否启用Obsidian集成
    vaultPath?: string          // Vault路径
    syncEnabled: boolean        // 是否启用同步
    autoSync: boolean           // 自动同步
    lastSyncAt?: Timestamp      // 最后同步时间
  }
  updatedAt: Timestamp
}
```

### 3. 冲刺计划 (`/users/{userId}/sprints/{sprintId}`)

```typescript
interface SprintDocument {
  id: string                    // 冲刺ID
  userId: string                // 用户ID
  title: string                 // 冲刺标题
  description: string           // 冲刺描述
  type: 'learning' | 'project'  // 冲刺类型
  template: '7days' | '21days' | '30days' | '60days' | '90days'  // 模板
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'  // 状态
  progress: number              // 进度百分比 (0-100)
  startDate: Timestamp          // 开始日期
  endDate: Timestamp            // 结束日期
  createdAt: Timestamp          // 创建时间
  updatedAt: Timestamp          // 更新时间
  completedAt?: Timestamp       // 完成时间
  
  // 统计信息
  stats: {
    totalTasks: number          // 总任务数
    completedTasks: number      // 已完成任务数
    totalTime: number           // 总时间(分钟)
    actualTime: number          // 实际时间(分钟)
  }
  
  // 标签和分类
  tags: string[]                // 标签
  category?: string             // 分类
  
  // AI生成信息
  aiGenerated: boolean          // 是否AI生成
  aiPrompt?: string             // AI生成时的提示词
}
```

### 4. 任务 (`/users/{userId}/sprints/{sprintId}/tasks/{taskId}`)

```typescript
interface TaskDocument {
  id: string                    // 任务ID
  sprintId: string              // 所属冲刺ID
  title: string                 // 任务标题
  description?: string          // 任务描述
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled'  // 状态
  priority: 'low' | 'medium' | 'high'  // 优先级
  
  // 时间相关
  estimatedTime?: number        // 预估时间(分钟)
  actualTime?: number           // 实际时间(分钟)
  dueDate?: Timestamp           // 截止日期
  completedAt?: Timestamp       // 完成时间
  
  // 分类和标签
  tags: string[]                // 标签
  phaseId?: string              // 所属阶段ID
  
  // 资源和附件
  resources: Array<{
    id: string
    type: 'link' | 'file' | 'note' | 'video' | 'book'
    title: string
    url?: string
    content?: string
    tags: string[]
  }>
  
  // 依赖关系
  dependencies: string[]        // 依赖的任务ID
  blockedBy: string[]           // 被哪些任务阻塞
  
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### 5. 阶段 (`/users/{userId}/sprints/{sprintId}/phases/{phaseId}`)

```typescript
interface PhaseDocument {
  id: string                    // 阶段ID
  sprintId: string              // 所属冲刺ID
  title: string                 // 阶段标题
  description?: string          // 阶段描述
  order: number                 // 排序
  status: 'pending' | 'active' | 'completed'  // 状态
  startDate: Timestamp          // 开始日期
  endDate: Timestamp            // 结束日期
  taskIds: string[]             // 包含的任务ID
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### 6. 里程碑 (`/users/{userId}/sprints/{sprintId}/milestones/{milestoneId}`)

```typescript
interface MilestoneDocument {
  id: string                    // 里程碑ID
  sprintId: string              // 所属冲刺ID
  title: string                 // 里程碑标题
  description?: string          // 里程碑描述
  targetDate: Timestamp         // 目标日期
  completedAt?: Timestamp       // 完成时间
  status: 'pending' | 'completed'  // 状态
  criteria: string[]            // 完成标准
  progress: number              // 进度百分比
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### 7. AI使用统计 (`/users/{userId}/aiUsage/{date}`)

```typescript
interface AIUsageDocument {
  userId: string                // 用户ID
  date: string                  // 日期 (YYYY-MM-DD)
  count: number                 // 使用次数
  limit: number                 // 限制次数
  resetAt: Timestamp            // 重置时间
  conversations: Array<{
    id: string                  // 对话ID
    timestamp: Timestamp        // 时间戳
    type: 'plan-generation' | 'chat'  // 类型
    tokens: number              // 使用的token数
  }>
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### 8. 用户统计 (`/users/{userId}/stats/overview`)

```typescript
interface UserStatsDocument {
  userId: string
  totalSprints: number          // 总冲刺数
  completedSprints: number      // 已完成冲刺数
  totalTasks: number            // 总任务数
  completedTasks: number        // 已完成任务数
  totalTime: number             // 总时间(分钟)
  streakDays: number            // 连续天数
  longestStreak: number         // 最长连续天数
  lastActiveDate: Timestamp     // 最后活跃日期
  
  achievements: Array<{
    id: string
    type: 'first-sprint' | 'streak-7' | 'streak-30' | 'complete-10' | 'complete-50'
    title: string
    description: string
    unlockedAt: Timestamp
  }>
  
  // 按月统计
  monthlyStats: Record<string, {  // key: YYYY-MM
    sprints: number
    tasks: number
    timeSpent: number
  }>
  
  updatedAt: Timestamp
}
```

### 9. AI对话历史 (`/users/{userId}/aiHistory/{conversationId}`)

```typescript
interface AIConversationDocument {
  id: string                    // 对话ID
  userId: string                // 用户ID
  type: 'plan-generation' | 'chat'  // 对话类型
  title?: string                // 对话标题
  
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Timestamp
    tokens?: number             // 消耗的token数
  }>
  
  generatedPlan?: {
    sprintId?: string           // 生成的冲刺ID
    planData: any               // 生成的计划数据
  }
  
  metadata: {
    model: string               // 使用的AI模型
    totalTokens: number         // 总token消耗
    cost?: number               // 成本(如果有)
  }
  
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### 10. Obsidian知识图谱 (`/users/{userId}/knowledgeGraph/{nodeId}`)

```typescript
interface KnowledgeNodeDocument {
  id: string                    // 节点ID
  userId: string                // 用户ID
  type: 'sprint' | 'task' | 'note' | 'resource'  // 节点类型
  title: string                 // 节点标题
  content?: string              // 节点内容
  
  // 关联信息
  sprintId?: string             // 关联的冲刺ID
  taskId?: string               // 关联的任务ID
  
  // 图谱关系
  connections: Array<{
    targetId: string            // 目标节点ID
    type: 'related' | 'depends' | 'blocks' | 'contains'  // 关系类型
    strength: number            // 关系强度 (0-1)
  }>
  
  // 标签和分类
  tags: string[]
  category?: string
  
  // Obsidian特定
  obsidianPath?: string         // Obsidian文件路径
  lastSyncAt?: Timestamp        // 最后同步时间
  
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

## 索引策略

### 复合索引

1. **用户冲刺查询**
   - Collection: `users/{userId}/sprints`
   - Fields: `status ASC, createdAt DESC`
   - Fields: `type ASC, status ASC, createdAt DESC`

2. **任务查询**
   - Collection: `users/{userId}/sprints/{sprintId}/tasks`
   - Fields: `status ASC, priority DESC, createdAt ASC`
   - Fields: `dueDate ASC, status ASC`

3. **AI使用统计**
   - Collection: `users/{userId}/aiUsage`
   - Fields: `date DESC`

### 单字段索引

- 所有集合的 `createdAt` 和 `updatedAt` 字段
- 状态字段 (`status`)
- 类型字段 (`type`)
- 日期字段 (`date`, `dueDate`, `targetDate`)

## 数据一致性策略

1. **事务操作**
   - 创建/删除冲刺时同时操作相关任务
   - 更新任务状态时同时更新冲刺进度
   - AI使用次数的原子性增加

2. **批量写入**
   - 大量任务的状态更新
   - 统计数据的批量计算

3. **触发器 (Cloud Functions)**
   - 任务状态变化 → 更新冲刺进度
   - 冲刺完成 → 更新用户统计
   - AI使用 → 更新使用统计

## 安全规则要点

1. **用户数据隔离**：每个用户只能访问自己的数据
2. **数据验证**：严格的字段类型和长度验证
3. **权限控制**：管理员可以访问所有数据
4. **防刷机制**：AI使用次数的严格控制
