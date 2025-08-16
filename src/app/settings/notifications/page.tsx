'use client'

import { NotificationManager } from '@/components/notification-manager'
import { Button } from '@/components/ui'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function NotificationSettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* 页面头部 */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              返回设置
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">通知设置</h1>
            <p className="text-muted-foreground mt-1">
              管理您的推送通知和提醒设置
            </p>
          </div>
        </div>

        {/* 通知管理器 */}
        <NotificationManager />

        {/* 帮助信息 */}
        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-3">关于推送通知</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>每日提醒</strong>：每天在设定时间提醒您查看冲刺进度</p>
            <p>• <strong>截止日期提醒</strong>：任务即将到期前24小时和1小时提醒</p>
            <p>• <strong>里程碑提醒</strong>：达成重要里程碑时立即通知</p>
            <p>• <strong>邮件通知</strong>：重要事件的邮件备份通知</p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="font-medium mb-2">故障排除</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• 如果收不到通知，请检查浏览器通知权限</p>
              <p>• 确保网站没有被添加到通知屏蔽列表</p>
              <p>• 在移动设备上，请将网站添加到主屏幕以获得更好的通知体验</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
