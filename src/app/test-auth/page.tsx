'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { auth } from '@/lib/firebase'
import { signInAnonymously } from 'firebase/auth'

export default function TestAuthPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAuth = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      // 确保用户已登录
      if (!auth.currentUser) {
        console.log('No user logged in, signing in anonymously...')
        await signInAnonymously(auth)
        console.log('Anonymous sign in successful')
      }

      // 获取token
      const token = await auth.currentUser!.getIdToken()
      console.log('Token obtained, length:', token.length)

      // 调用测试API
      const response = await fetch('http://127.0.0.1:5001/n8n-project-460516/asia-east1/api/sprints/test-auth', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      console.log('API response:', data)
      
      setResult({
        status: response.status,
        data
      })
    } catch (error) {
      console.error('Test failed:', error)
      setResult({
        error: error instanceof Error ? error.message : '未知错误'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">认证测试</h1>
      
      <div className="space-y-4">
        <Button onClick={testAuth} disabled={loading}>
          {loading ? '测试中...' : '测试认证'}
        </Button>

        {result && (
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">测试结果:</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p>当前用户: {auth.currentUser?.uid || '未登录'}</p>
          <p>用户邮箱: {auth.currentUser?.email || '匿名用户'}</p>
        </div>
      </div>
    </div>
  )
}
