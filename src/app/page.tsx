import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Progress, Badge, Input } from "@/components/ui"
import { Navigation } from "@/components/navigation"
import { PermissionGuard, FeatureGuard } from "@/components/permission-guard"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            短期冲刺管理App
          </h1>
          <p className="text-lg text-muted-foreground">
            专注于短期目标的快速达成，支持学习冲刺和简单项目管理
          </p>
        </div>

        {/* UI组件展示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 按钮组件展示 */}
          <Card>
            <CardHeader>
              <CardTitle>按钮组件</CardTitle>
              <CardDescription>不同样式的按钮展示</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button>默认按钮</Button>
                <Button variant="secondary">次要按钮</Button>
                <Button variant="outline">边框按钮</Button>
                <Button variant="ghost">幽灵按钮</Button>
                <Button variant="destructive">危险按钮</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm">小按钮</Button>
                <Button size="default">默认大小</Button>
                <Button size="lg">大按钮</Button>
              </div>
            </CardContent>
          </Card>

          {/* 进度条展示 */}
          <Card>
            <CardHeader>
              <CardTitle>进度展示</CardTitle>
              <CardDescription>不同状态的进度条</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>默认进度</span>
                  <span>65%</span>
                </div>
                <Progress value={65} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>成功状态</span>
                  <span>100%</span>
                </div>
                <Progress value={100} variant="success" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>警告状态</span>
                  <span>30%</span>
                </div>
                <Progress value={30} variant="warning" />
              </div>
            </CardContent>
          </Card>

          {/* 标签展示 */}
          <Card>
            <CardHeader>
              <CardTitle>状态标签</CardTitle>
              <CardDescription>不同状态的标签展示</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>默认</Badge>
                <Badge variant="secondary">次要</Badge>
                <Badge variant="success">成功</Badge>
                <Badge variant="warning">警告</Badge>
                <Badge variant="error">错误</Badge>
                <Badge variant="outline">边框</Badge>
              </div>
            </CardContent>
          </Card>

          {/* 输入框展示 */}
          <Card>
            <CardHeader>
              <CardTitle>输入组件</CardTitle>
              <CardDescription>表单输入组件展示</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="请输入内容..." />
              <Input type="email" placeholder="邮箱地址" />
              <Input type="password" placeholder="密码" />
            </CardContent>
          </Card>
        </div>

        {/* 冲刺计划预览卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>冲刺计划预览</CardTitle>
            <CardDescription>展示即将实现的冲刺计划功能</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">7天短期冲刺</h3>
                <p className="text-sm text-muted-foreground">快速技能提升</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">21天习惯养成</h3>
                <p className="text-sm text-muted-foreground">建立良好习惯</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">30天项目冲刺</h3>
                <p className="text-sm text-muted-foreground">完成小型项目</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
