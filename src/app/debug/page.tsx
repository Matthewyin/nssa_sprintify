'use client'

import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `${timestamp}: ${message}`])
    console.log(message)
  }



  const testLogout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      addLog('✅ 登出成功')
    } catch (error) {
      addLog(`❌ 登出失败: ${error}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">🔧 Firebase模拟器调试工具</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 控制面板 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">控制面板</h2>
          
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-medium mb-2">当前状态</h3>
            <p><strong>用户:</strong> {user ? user.uid : '未登录'}</p>
            <p><strong>匿名用户:</strong> {user?.isAnonymous ? '是' : '否'}</p>
            <p><strong>环境:</strong> {process.env.NODE_ENV}</p>
            <p><strong>使用模拟器:</strong> {process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR}</p>
          </div>
          
          <div className="space-y-2">

            
            <button 
              onClick={testLogout}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              disabled={!user}
            >
              🚪 登出
            </button>
            
            <button 
              onClick={clearLogs}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              🧹 清除日志
            </button>
          </div>
        </div>

        {/* 日志面板 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">调试日志</h2>
          <div className="p-4 bg-black text-green-400 rounded h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">点击按钮开始测试...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 说明 */}
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-medium mb-2">🔍 如何判断模拟器连接状态：</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>模拟器Token:</strong> 长度通常 &lt; 500字符</li>
          <li>• <strong>生产Token:</strong> 长度通常 &gt; 900字符</li>
          <li>• <strong>API调用:</strong> 应该返回200状态码</li>
          <li>• <strong>刷新测试:</strong> 登录后刷新页面应保持登录状态</li>
        </ul>
      </div>
    </div>
  )
}
