# NSSA Sprintify

<div align="center">
  <h1>🚀 让每个目标都有冲刺的力量</h1>
  <p>科学的时间管理，清晰的进度追踪，让你的目标不再是空想</p>

  [![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Firebase](https://img.shields.io/badge/Firebase-10.0-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
</div>

## ✨ 产品特色

NSSA Sprintify 是一个基于科学时间管理理论的冲刺式目标管理平台，帮助用户通过短期冲刺的方式实现长期目标。

### 🎯 核心功能

- **🚀 目标导向规划** - 科学的时间周期设置，将大目标分解为可执行的小任务
- **📊 可视化追踪** - 实时数据分析，直观的进度展示，随时掌握目标完成情况
- **🏆 成就感驱动** - 里程碑达成记录，个人成长轨迹，每个完成的任务都是前进的动力
- **🤖 AI智能助手** - 智能生成冲刺计划，个性化任务分解和时间安排
- **📈 数据分析** - 生产力趋势分析，活动热力图，全面了解个人效率

### 🌟 为什么选择冲刺式管理？

- **21天改变一个习惯** - 基于科学的习惯养成理论
- **90天完成一个项目** - 适合现代人的工作节奏
- **可视化进度追踪** - 让目标达成过程清晰可见
- **成就感驱动** - 每个里程碑都是前进的动力

## 🚀 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm、yarn、pnpm 或 bun 包管理器

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/Matthewyin/nssa_sprintify.git
cd nssa_sprintify
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

3. **配置环境变量**
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置 Firebase 相关环境变量：
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

5. **访问应用**

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📖 使用指南

### 简单三步，开启你的冲刺之旅

#### 1️⃣ 设定目标
- 创建你的冲刺计划
- 设定明确的目标和时间周期
- 选择合适的冲刺模板（7天、21天、30天、60天、90天）

#### 2️⃣ 执行任务
- 将目标分解为具体的任务
- 使用看板管理任务状态（待办、进行中、已完成）
- 记录每个任务的里程碑总结

#### 3️⃣ 追踪进度
- 查看实时的进度统计
- 分析个人生产力趋势
- 通过数据优化执行策略

### 🎯 冲刺模板

- **7天快速冲刺** - 适合短期技能学习或小型项目
- **21天习惯养成** - 基于21天习惯养成理论的中期冲刺
- **30天深度学习** - 适合深度学习某项技能或完成中型项目
- **60天技能精进** - 适合技能深度精进或大型项目开发
- **90天专业转型** - 适合职业转型或专业技能体系建设

## 🛠️ 技术栈

- **前端框架**: Next.js 15.4.6 (App Router)
- **开发语言**: TypeScript
- **样式方案**: Tailwind CSS + shadcn/ui
- **状态管理**: Zustand
- **数据库**: Firebase Firestore
- **认证系统**: Firebase Authentication
- **图标库**: Heroicons
- **部署平台**: Vercel

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   ├── auth/              # 认证页面
│   ├── dashboard/         # 仪表盘
│   ├── sprints/           # 冲刺管理
│   └── analytics/         # 数据分析
├── components/            # 可复用组件
│   ├── ui/               # 基础 UI 组件
│   └── navigation.tsx    # 导航组件
├── lib/                  # 工具库
│   ├── firebase.ts       # Firebase 配置
│   ├── utils.ts          # 工具函数
│   └── sprint-templates.ts # 冲刺模板
├── stores/               # 状态管理
└── hooks/                # 自定义 Hooks
```

## 🤝 联系我们

- **项目地址**: [https://github.com/Matthewyin/nssa_sprintify](https://github.com/Matthewyin/nssa_sprintify)
- **问题反馈**: [GitHub Issues](https://github.com/Matthewyin/nssa_sprintify/issues)
- **功能建议**: [GitHub Discussions](https://github.com/Matthewyin/nssa_sprintify/discussions)

## 🔗 友情链接

- [NSSA.io](https://nssa.io) - NSSA 官方网站
- [TopFac.NSSA.io](https://topfac.nssa.io) - 说出来的网络拓扑
- [Tools.NSSA.io](https://tools.nssa.io) - NSSA 小游戏

## 📄 开源协议

本项目采用 MIT 协议开源，详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

感谢所有为这个项目贡献代码、提出建议和反馈的开发者和用户。

---

<div align="center">
  <p>用冲刺的方式，让目标不再是空想 🚀</p>
  <p>© 2025 NSSA Sprintify. All rights reserved.</p>
</div>
