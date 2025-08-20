'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Progress, Badge } from "@/components/ui"
import { Navigation } from "@/components/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { useAuthInitialized } from "@/hooks/useAuth"
import {
  RocketLaunchIcon,
  ChartBarIcon,
  TrophyIcon,
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline'

// GitHub图标组件
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
)

export default function Home() {
  const { user, isAuthenticated } = useAuthStore()
  const authInitialized = useAuthInitialized()
  const [stats, setStats] = useState({
    totalUsers: 0,
    completedSprints: 0,
    successRate: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true)
        const response = await fetch('/api/stats')
        const result = await response.json()

        if (result.success && result.data) {
          setStats({
            totalUsers: result.data.totalUsers,
            completedSprints: result.data.completedSprints,
            successRate: result.data.successRate
          })
        } else {
          // API返回失败，使用默认值
          setStats({
            totalUsers: 1200,
            completedSprints: 8500,
            successRate: 85
          })
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
        // 网络错误或其他异常，使用默认值
        setStats({
          totalUsers: 1200,
          completedSprints: 8500,
          successRate: 85
        })
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* 英雄区域 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* 左侧内容 */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  让每个目标都有
                  <span className="text-primary"> 冲刺的力量</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  科学的时间管理，清晰的进度追踪，让你的目标不再是空想。
                  用冲刺的方式，21天改变一个习惯，90天完成一个项目。
                </p>
              </div>

              {/* CTA按钮 */}
              <div className="flex flex-col sm:flex-row gap-4">
                {authInitialized && isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="w-full sm:w-auto">
                      <RocketLaunchIcon className="h-5 w-5 mr-2" />
                      查看我的冲刺
                    </Button>
                  </Link>
                ) : (
                  <Link href="/test-auth">
                    <Button size="lg" className="w-full sm:w-auto">
                      <PlayIcon className="h-5 w-5 mr-2" />
                      免费开始冲刺
                    </Button>
                  </Link>
                )}

              </div>

              {/* 统计数据 */}
              <div className="flex flex-wrap gap-8 pt-8 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {statsLoading ? '...' : `${stats.totalUsers.toLocaleString()}+`}
                  </div>
                  <div className="text-sm text-muted-foreground">活跃用户</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {statsLoading ? '...' : `${stats.completedSprints.toLocaleString()}+`}
                  </div>
                  <div className="text-sm text-muted-foreground">完成冲刺</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {statsLoading ? '...' : `${stats.successRate}%`}
                  </div>
                  <div className="text-sm text-muted-foreground">成功率</div>
                </div>
              </div>
            </div>

            {/* 右侧视觉元素 */}
            <div className="relative">
              <div className="relative z-10 bg-card border border-border rounded-2xl shadow-2xl p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">我的学习冲刺</h3>
                    <Badge variant="success">进行中</Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-success" />
                      <span className="text-sm">完成React基础学习</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-success" />
                      <span className="text-sm">搭建第一个项目</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ClockIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">部署上线项目</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>进度</span>
                      <span>67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    剩余 7 天 · 目标：成为React开发者
                  </div>
                </div>
              </div>

              {/* 装饰性元素 */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 功能特性展示 */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              为什么选择冲刺式目标管理？
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              基于科学的时间管理理论，结合现代人的工作节奏，让目标达成变得简单高效
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* 特性1：目标导向 */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RocketLaunchIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">目标导向规划</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  科学的时间周期设置，将大目标分解为可执行的小任务，让每一步都有明确方向
                </p>
              </CardContent>
            </Card>

            {/* 特性2：可视化追踪 */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChartBarIcon className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-3">可视化追踪</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  实时数据分析，直观的进度展示，让你随时掌握目标完成情况和个人效率
                </p>
              </CardContent>
            </Card>

            {/* 特性3：成就驱动 */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrophyIcon className="h-8 w-8 text-warning" />
                </div>
                <h3 className="text-xl font-semibold mb-3">成就感驱动</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  里程碑达成记录，个人成长轨迹，每一个完成的任务都是前进的动力
                </p>
              </CardContent>
            </Card>

            {/* 特性4：智能提醒 */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BoltIcon className="h-8 w-8 text-info" />
                </div>
                <h3 className="text-xl font-semibold mb-3">智能提醒</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  任务截止提醒，进度异常预警，让你永远不会错过重要的时间节点
                </p>
                <Badge variant="secondary" className="mt-2 text-xs">即将推出</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 使用流程说明 */}
      <section id="usage-guide" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              简单三步，开启你的冲刺之旅
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              无需复杂的学习过程，几分钟就能上手，让目标管理变得轻松愉快
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* 步骤1 */}
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                {/* 连接线 */}
                <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-border -translate-y-0.5"></div>
              </div>
              <h3 className="text-xl font-semibold">设定目标</h3>
              <p className="text-muted-foreground">
                创建你的冲刺计划，设定明确的目标和时间周期，让目标变得具体可行
              </p>
            </div>

            {/* 步骤2 */}
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                {/* 连接线 */}
                <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-border -translate-y-0.5"></div>
              </div>
              <h3 className="text-xl font-semibold">执行任务</h3>
              <p className="text-muted-foreground">
                按照计划执行每日任务，记录进度，在可视化的界面中看到自己的成长
              </p>
            </div>

            {/* 步骤3 */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-warning rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold">达成里程碑</h3>
              <p className="text-muted-foreground">
                完成任务，记录成长收获，积累成功经验，为下一个目标做好准备
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* 社会证明 */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              用户的成功故事
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              看看其他用户是如何通过冲刺式管理实现目标的
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 用户评价1 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "用了3个月，成功完成了5个学习冲刺。从零基础到能独立开发项目，这个工具真的改变了我的学习方式。"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">张同学</div>
                    <div className="text-sm text-muted-foreground">前端开发学习者</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 用户评价2 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "作为产品经理，我用它来管理项目里程碑。清晰的进度追踪让团队协作更高效，项目按时交付率提升了40%。"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <div className="font-medium">李经理</div>
                    <div className="text-sm text-muted-foreground">产品经理</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 用户评价3 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "健身、阅读、技能学习，我用冲刺管理法完成了很多以前半途而废的目标。现在养成习惯变得简单多了。"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <div className="font-medium">王女士</div>
                    <div className="text-sm text-muted-foreground">自由职业者</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 最终CTA */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              准备好开始你的第一个冲刺了吗？
            </h2>
            <p className="text-lg text-muted-foreground">
              加入数千名用户的行列，用科学的方法实现你的目标
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {authInitialized && isAuthenticated ? (
                <Link href="/sprints/create">
                  <Button size="lg" className="w-full sm:w-auto">
                    <RocketLaunchIcon className="h-5 w-5 mr-2" />
                    创建我的第一个冲刺
                  </Button>
                </Link>
              ) : (
                <Link href="/test-auth">
                  <Button size="lg" className="w-full sm:w-auto">
                    <PlayIcon className="h-5 w-5 mr-2" />
                    免费注册开始
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                了解更多功能
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-muted/50 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* 产品功能 */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">产品功能</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/analytics" className="hover:text-foreground transition-colors">数据分析</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">个人仪表板</Link></li>
                <li><span className="opacity-50">智能提醒 (即将推出)</span></li>
                <li><span className="opacity-50">团队协作 (即将推出)</span></li>
              </ul>
            </div>

            {/* 友情链接 */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">友情链接</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://nssa.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">NSSA.io</a></li>
                <li><a href="https://topfac.nssa.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">TopFac.NSSA.io</a></li>
                <li><a href="https://tools.nssa.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Tools.NSSA.io</a></li>
              </ul>
            </div>


            {/* 帮助支持 */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">帮助支持</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#usage-guide" className="hover:text-foreground transition-colors">使用指南</a></li>
                <li>
                  <a
                    href="https://github.com/Matthewyin/nssa_sprintify"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    <GitHubIcon className="h-4 w-4" />
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            {/* 品牌信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">NSSA Sprintify</h3>
              <p className="text-sm text-muted-foreground">
                让每个目标都有冲刺的力量，用科学的时间管理方法实现人生突破。
              </p>
              <div className="flex gap-4">
                <div className="text-sm text-muted-foreground">
                  © 2025 NSSA Sprintify. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
