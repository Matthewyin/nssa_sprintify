'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Badge } from '@/components/ui'
import { useAuthStore } from '@/stores'
import { usePermission, UserTypeDisplay } from '@/components/permission-guard'
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  CogIcon,
  ChartBarIcon,
  UsersIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

export function Navigation() {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const { isAdmin, isPremium } = usePermission()

  const handleLogout = async () => {
    await logout()
    router.push('/')
    setIsMobileMenuOpen(false)
  }

  const navigationItems = [
    {
      name: '首页',
      href: '/',
      icon: HomeIcon,
      show: true
    },
    {
      name: '创建冲刺',
      href: '/sprints/create',
      icon: PlusIcon,
      show: isAuthenticated
    },
    {
      name: '我的冲刺',
      href: '/sprints',
      icon: ChartBarIcon,
      show: isAuthenticated
    },
    {
      name: '数据统计',
      href: '/stats',
      icon: ChartBarIcon,
      show: isAuthenticated && isPremium
    },
    {
      name: '用户管理',
      href: '/admin/users',
      icon: UsersIcon,
      show: isAdmin,
      badge: '管理员'
    }
  ]

  const userMenuItems = [
    {
      name: '个人资料',
      href: '/profile',
      icon: UserIcon
    },
    {
      name: '应用设置',
      href: '/settings',
      icon: CogIcon
    },
    {
      name: '通知设置',
      href: '/settings/notifications',
      icon: BellIcon
    }
  ]

  return (
    <nav className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 左侧：Logo和主导航 */}
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="ml-2 text-xl font-bold text-foreground">
                  冲刺管理
                </span>
              </div>
            </Link>

            {/* 桌面端导航 */}
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              {navigationItems.filter(item => item.show).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                  {item.badge && (
                    <Badge variant="error" size="sm" className="ml-2">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* 右侧：用户菜单 */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* 用户等级显示 */}
                <UserTypeDisplay />
                
                {/* 用户菜单 */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="hidden md:block">{user.displayName}</span>
                  </button>
                  
                  {/* 下拉菜单 */}
                  <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          <item.icon className="h-4 w-4 mr-3" />
                          {item.name}
                        </Link>
                      ))}
                      <hr className="my-1 border-border" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                        退出登录
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth">
                  <Button variant="outline" size="sm">
                    登录
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="sm">
                    注册
                  </Button>
                </Link>
              </div>
            )}

            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.filter(item => item.show).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                  {item.badge && (
                    <Badge variant="error" size="sm" className="ml-2">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
              
              {isAuthenticated && user && (
                <>
                  <hr className="my-2 border-border" />
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                    退出登录
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
