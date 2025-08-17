'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui"

export default function FirebaseSetupPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Firebase 项目设置指南</h1>
          <p className="text-muted-foreground mt-2">
            确保Firebase项目正确配置以支持认证功能
          </p>
        </div>

        {/* 当前配置信息 */}
        <Card>
          <CardHeader>
            <CardTitle>当前Firebase配置</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm font-mono">
              <div>项目ID: n8n-project-460516</div>
              <div>认证域: n8n-project-460516.firebaseapp.com</div>
              <div>存储桶: n8n-project-460516.firebasestorage.app</div>
            </div>
          </CardContent>
        </Card>

        {/* 设置步骤 */}
        <Card>
          <CardHeader>
            <CardTitle>Firebase控制台设置步骤</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold">步骤1: 访问Firebase控制台</h3>
                <p className="text-sm text-muted-foreground">
                  访问 <a href="https://console.firebase.google.com/project/n8n-project-460516" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    Firebase控制台
                  </a>
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold">步骤2: 启用Authentication</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  在左侧菜单中点击 "Authentication" → "Sign-in method"
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 启用 "Email/Password" 认证方式</li>
                  <li>• 可选：启用 "Email link (passwordless sign-in)"</li>
                </ul>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-semibold">步骤3: 配置授权域名</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  在 "Authentication" → "Settings" → "Authorized domains" 中添加：
                </p>
                <ul className="text-sm font-mono space-y-1">
                  <li>• localhost (开发环境)</li>
                  <li>• 您的生产域名</li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold">步骤4: 设置Firestore数据库</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  在左侧菜单中点击 "Firestore Database" → "Create database"
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 选择 "Start in test mode" (开发阶段)</li>
                  <li>• 选择合适的地区 (asia-east1 推荐)</li>
                </ul>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold">步骤5: 配置安全规则</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  在 "Firestore Database" → "Rules" 中设置基本安全规则：
                </p>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用户只能访问自己的数据
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 冲刺数据
    match /sprints/{sprintId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // 任务数据
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 测试连接 */}
        <Card>
          <CardHeader>
            <CardTitle>测试连接</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                完成上述设置后，您可以：
              </p>
              <ul className="text-sm space-y-2">
                <li>
                  <a href="/test-auth" className="text-blue-600 underline">
                    → 访问认证测试页面
                  </a>
                </li>
                <li>
                  <a href="/auth" className="text-blue-600 underline">
                    → 访问正式登录页面
                  </a>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 常见问题 */}
        <Card>
          <CardHeader>
            <CardTitle>常见问题解决</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">❌ "auth/configuration-not-found"</h4>
                <p className="text-sm text-muted-foreground">
                  解决方案：确保在Firebase控制台中启用了Email/Password认证
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">❌ "auth/unauthorized-domain"</h4>
                <p className="text-sm text-muted-foreground">
                  解决方案：在授权域名中添加 localhost 和您的域名
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">❌ "auth/invalid-api-key"</h4>
                <p className="text-sm text-muted-foreground">
                  解决方案：检查 .env.local 中的API密钥是否正确
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">❌ "firestore/permission-denied"</h4>
                <p className="text-sm text-muted-foreground">
                  解决方案：检查Firestore安全规则是否正确配置
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 环境变量检查 */}
        <Card>
          <CardHeader>
            <CardTitle>环境变量检查</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>FIREBASE_API_KEY:</span>
                <span className={process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'text-green-600' : 'text-red-600'}>
                  {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓ 已设置' : '✗ 未设置'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>FIREBASE_AUTH_DOMAIN:</span>
                <span className={process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'text-green-600' : 'text-red-600'}>
                  {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✓ 已设置' : '✗ 未设置'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>FIREBASE_PROJECT_ID:</span>
                <span className={process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'text-green-600' : 'text-red-600'}>
                  {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓ 已设置' : '✗ 未设置'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
