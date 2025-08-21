/** @type {import('next').NextConfig} */
const nextConfig = {
  // 图片配置
  images: {
    unoptimized: true,
  },
  
  // 路径配置
  trailingSlash: true,
  
  // 环境变量
  env: {
    CUSTOM_KEY: 'my-value',
  },
  
  // 重写规则（开发环境）
  async rewrites() {
    // 只在开发环境且不使用模拟器时应用重写
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== 'true') {
      return [
        {
          source: '/api/:path*',
          destination: 'https://asia-east1-n8n-project-460516.cloudfunctions.net/api/:path*',
        },
      ]
    }
    return []
  },
}

module.exports = nextConfig
