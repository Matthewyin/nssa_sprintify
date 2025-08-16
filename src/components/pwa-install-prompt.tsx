'use client'

import { useState, useEffect } from 'react'
import { Button, Card, CardContent } from '@/components/ui'
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // 检查是否已经安装
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        return
      }
      
      // 检查是否在iOS Safari中添加到主屏幕
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true)
        return
      }
    }

    checkIfInstalled()

    // 监听beforeinstallprompt事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // 延迟显示安装提示，给用户一些时间体验应用
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallPrompt(true)
        }
      }, 30000) // 30秒后显示
    }

    // 监听应用安装事件
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
      console.log('PWA已安装')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('用户接受了安装提示')
      } else {
        console.log('用户拒绝了安装提示')
      }
      
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error('安装过程中出错:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // 24小时后再次显示
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // 检查是否在24小时内被拒绝过
  useEffect(() => {
    const dismissedTime = localStorage.getItem('pwa-install-dismissed')
    if (dismissedTime) {
      const timeDiff = Date.now() - parseInt(dismissedTime)
      const twentyFourHours = 24 * 60 * 60 * 1000
      
      if (timeDiff < twentyFourHours) {
        setShowInstallPrompt(false)
      }
    }
  }, [])

  // 如果已安装或不显示提示，则不渲染
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="shadow-lg border-primary/20 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <ArrowDownTrayIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground mb-1">
                安装应用到桌面
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                将冲刺管理应用添加到主屏幕，获得更好的使用体验
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleInstallClick}
                  className="flex-1"
                >
                  安装
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleDismiss}
                  className="px-2"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// iOS安装指引组件
export function IOSInstallGuide() {
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    // 检测是否为iOS Safari且未安装
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = (window.navigator as any).standalone === true
    const isInWebAppiOS = window.matchMedia('(display-mode: standalone)').matches
    
    if (isIOS && !isInStandaloneMode && !isInWebAppiOS) {
      // 延迟显示iOS安装指引
      setTimeout(() => {
        setShowGuide(true)
      }, 45000) // 45秒后显示
    }
  }, [])

  if (!showGuide) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="shadow-lg border-primary/20 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <ArrowDownTrayIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground mb-1">
                添加到主屏幕
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                点击分享按钮 <span className="inline-block w-4 h-4 bg-primary/20 rounded text-center text-xs">⬆</span>，然后选择"添加到主屏幕"
              </p>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowGuide(false)}
                className="w-full"
              >
                知道了
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
