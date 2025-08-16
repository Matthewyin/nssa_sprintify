'use client'

import { useEffect } from 'react'
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui"
import { useAuthStore, useSprintStore, useSettingsStore } from "@/stores"

export default function TestStorePage() {
  const { user, isAuthenticated, login, logout } = useAuthStore()
  const { sprints, currentSprint, createSprint, createTask } = useSprintStore()
  const { theme, language, setTheme, setLanguage } = useSettingsStore()

  useEffect(() => {
    // 初始化stores
    useSettingsStore.getState().loadSettings()
  }, [])

  const handleLogin = async () => {
    await login({ email: 'test@example.com', password: 'password123' })
  }

  const handleCreateSprint = async () => {
    await createSprint({
      title: '测试冲刺计划',
      description: '这是一个测试的30天项目冲刺',
      type: 'project',
      template: '30days',
      startDate: new Date()
    })
  }

  const handleAddTask = async () => {
    if (currentSprint) {
      await createTask(currentSprint.id, {
        title: '测试任务',
        description: '这是一个测试任务',
        priority: 'medium',
        estimatedTime: 60,
        tags: ['测试', '开发']
      })
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Zustand Store 测试页面
          </h1>
          <p className="text-lg text-muted-foreground">
            测试状态管理功能
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 认证状态测试 */}
          <Card>
            <CardHeader>
              <CardTitle>认证状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p>登录状态: <Badge variant={isAuthenticated ? "success" : "secondary"}>
                  {isAuthenticated ? "已登录" : "未登录"}
                </Badge></p>
                {user && (
                  <div className="text-sm space-y-1">
                    <p>用户ID: {user.id}</p>
                    <p>邮箱: {user.email}</p>
                    <p>用户类型: <Badge variant="outline">{user.userType}</Badge></p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {!isAuthenticated ? (
                  <Button onClick={handleLogin}>模拟登录</Button>
                ) : (
                  <Button variant="outline" onClick={logout}>登出</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 冲刺管理测试 */}
          <Card>
            <CardHeader>
              <CardTitle>冲刺管理</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p>冲刺数量: <Badge>{sprints.length}</Badge></p>
                <p>当前冲刺: <Badge variant={currentSprint ? "success" : "secondary"}>
                  {currentSprint ? currentSprint.title : "无"}
                </Badge></p>
                {currentSprint && (
                  <div className="text-sm space-y-1">
                    <p>类型: {currentSprint.type}</p>
                    <p>模板: {currentSprint.template}</p>
                    <p>任务数: {currentSprint.stats.totalTasks}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateSprint}>创建冲刺</Button>
                {currentSprint && (
                  <Button variant="outline" onClick={handleAddTask}>添加任务</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 设置管理测试 */}
          <Card>
            <CardHeader>
              <CardTitle>设置管理</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p>当前主题: <Badge variant="outline">{theme}</Badge></p>
                <p>当前语言: <Badge variant="outline">{language}</Badge></p>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                  >
                    浅色
                  </Button>
                  <Button 
                    size="sm" 
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                  >
                    深色
                  </Button>
                  <Button 
                    size="sm" 
                    variant={theme === 'system' ? 'default' : 'outline'}
                    onClick={() => setTheme('system')}
                  >
                    系统
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant={language === 'zh-CN' ? 'default' : 'outline'}
                    onClick={() => setLanguage('zh-CN')}
                  >
                    中文
                  </Button>
                  <Button 
                    size="sm" 
                    variant={language === 'en-US' ? 'default' : 'outline'}
                    onClick={() => setLanguage('en-US')}
                  >
                    English
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 冲刺列表 */}
          <Card>
            <CardHeader>
              <CardTitle>冲刺列表</CardTitle>
            </CardHeader>
            <CardContent>
              {sprints.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  暂无冲刺计划
                </p>
              ) : (
                <div className="space-y-2">
                  {sprints.map((sprint) => (
                    <div key={sprint.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{sprint.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {sprint.description}
                          </p>
                        </div>
                        <Badge variant="outline">{sprint.status}</Badge>
                      </div>
                      <div className="mt-2 flex gap-2 text-xs">
                        <Badge size="sm">{sprint.type}</Badge>
                        <Badge size="sm" variant="secondary">{sprint.template}</Badge>
                        <Badge size="sm" variant="outline">
                          {sprint.stats.totalTasks} 任务
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
