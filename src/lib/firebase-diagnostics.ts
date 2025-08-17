// Firebase配置诊断工具

export interface FirebaseDiagnostics {
  isConfigValid: boolean
  missingVars: string[]
  configValues: Record<string, string | undefined>
  recommendations: string[]
}

export function diagnoseFirebaseConfig(): FirebaseDiagnostics {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ]

  const configValues: Record<string, string | undefined> = {}
  const missingVars: string[] = []
  const recommendations: string[] = []

  // 检查每个环境变量
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    configValues[varName] = value
    
    if (!value) {
      missingVars.push(varName)
    }
  })

  // 生成建议
  if (missingVars.length > 0) {
    recommendations.push('在.env.local文件中设置缺失的环境变量')
    recommendations.push('确保环境变量名以NEXT_PUBLIC_开头')
    recommendations.push('重启开发服务器以加载新的环境变量')
  }

  // 检查API密钥格式
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (apiKey && !apiKey.startsWith('AIza')) {
    recommendations.push('API密钥格式可能不正确，应该以"AIza"开头')
  }

  // 检查项目ID格式
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (projectId && projectId === 'demo-project') {
    recommendations.push('项目ID仍然是演示值，请使用真实的Firebase项目ID')
  }

  // 检查认证域名格式
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  if (authDomain && !authDomain.includes('firebaseapp.com')) {
    recommendations.push('认证域名格式可能不正确，应该以".firebaseapp.com"结尾')
  }

  const isConfigValid = missingVars.length === 0

  return {
    isConfigValid,
    missingVars,
    configValues,
    recommendations
  }
}

export function logFirebaseConfig(): void {
  const diagnostics = diagnoseFirebaseConfig()
  
  console.group('🔥 Firebase配置诊断')
  console.log('配置状态:', diagnostics.isConfigValid ? '✅ 有效' : '❌ 无效')
  
  if (diagnostics.missingVars.length > 0) {
    console.warn('缺失的环境变量:', diagnostics.missingVars)
  }
  
  console.log('配置值:')
  Object.entries(diagnostics.configValues).forEach(([key, value]) => {
    if (key.includes('API_KEY') || key.includes('APP_ID')) {
      console.log(`  ${key}: ${value ? `${value.substring(0, 10)}...` : '未设置'}`)
    } else {
      console.log(`  ${key}: ${value || '未设置'}`)
    }
  })
  
  if (diagnostics.recommendations.length > 0) {
    console.log('建议:')
    diagnostics.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`)
    })
  }
  
  console.groupEnd()
}

// 在开发环境中自动运行诊断
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // 延迟执行，确保环境变量已加载
  setTimeout(() => {
    logFirebaseConfig()
  }, 1000)
}
