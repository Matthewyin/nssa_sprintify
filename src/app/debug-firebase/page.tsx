'use client'

import { useState } from 'react'

import { resetFirebaseWithEmulator, checkAuthEmulatorConnection } from '@/lib/firebase-reset'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugFirebasePage() {
  const [status, setStatus] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [resetAuth, setResetAuth] = useState<any>(null)

  const handleReset = async () => {
    setIsLoading(true)
    setStatus('正在重置Firebase连接...')

    try {
      const { auth: newAuth } = await resetFirebaseWithEmulator()
      setResetAuth(newAuth)
      setStatus('✅ Firebase重置成功！')
    } catch (error) {
      setStatus(`❌ 重置失败: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyToMainApp = () => {
    setIsLoading(true)
    setStatus('正在应用修复到主应用...')

    try {
      // 设置标记，让主应用知道需要使用修复后的连接
      localStorage.setItem('firebase-emulator-fixed', 'true')
      localStorage.setItem('firebase-auth-port', '9098')

      setStatus('✅ 修复已应用到主应用！请刷新主页面或重新访问登录页面。')

      // 3秒后自动跳转到主页面
      setTimeout(() => {
        window.location.href = '/'
      }, 3000)
    } catch (error) {
      setStatus(`❌ 应用失败: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }



  const handleTestDirectConnection = async () => {
    setIsLoading(true)
    setStatus('正在直接测试模拟器连接...')

    try {
      // 直接测试9098端口
      const response9098 = await fetch('http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/projects/n8n-project-460516/accounts:signUp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnSecureToken: true })
      })

      if (response9098.ok || response9098.status === 400) {
        setStatus('✅ 9098端口连接成功！模拟器运行正常。')
      } else {
        setStatus(`⚠️ 9098端口响应异常: ${response9098.status}`)
      }
    } catch (error9098) {
      try {
        // 测试9099端口
        const response9099 = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/n8n-project-460516/accounts:signUp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ returnSecureToken: true })
        })

        if (response9099.ok || response9099.status === 400) {
          setStatus('⚠️ Firebase SDK仍然连接到9099端口！需要重置。')
        }
      } catch (error9099) {
        setStatus(`❌ 两个端口都无法连接:\n9098: ${error9098}\n9099: ${error9099}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckConnection = () => {
    const authToUse = resetAuth || auth
    const isConnected = checkAuthEmulatorConnection(authToUse)
    setStatus(`🔍 Auth模拟器连接状态: ${isConnected ? '已连接到正确端口' : '未连接或端口错误'}`)
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Firebase调试工具</CardTitle>
          <CardDescription>
            用于解决Firebase模拟器端口缓存问题
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              onClick={handleCheckConnection}
              variant="outline"
              className="w-full"
            >
              检查当前连接状态
            </Button>
            
            <Button 
              onClick={handleReset}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? '重置中...' : '强制重置Firebase连接'}
            </Button>
            
            <Button
              onClick={handleTestDirectConnection}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? '测试中...' : '直接测试模拟器连接'}
            </Button>



            <Button
              onClick={handleApplyToMainApp}
              disabled={isLoading}
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? '应用中...' : '应用修复到主应用'}
            </Button>
          </div>
          
          {status && (
            <div className="p-4 bg-gray-100 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">{status}</pre>
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            <h3 className="font-semibold mb-2">使用说明：</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>首先点击"检查当前连接状态"查看问题</li>
              <li>如果端口错误，点击"强制重置Firebase连接"</li>
              <li>重置成功后，返回主页面继续使用</li>

            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
