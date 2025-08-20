'use client'

import { useState, useEffect } from 'react'
import { ChevronDownIcon, BoltIcon, ClockIcon, CheckCircleIcon, PauseIcon } from '@heroicons/react/24/outline'
import { SprintInfo } from '@/types/sprint'

interface SprintSelectorProps {
  sprints: SprintInfo[]
  selectedSprint: SprintInfo | null
  onSprintSelect: (sprint: SprintInfo | null) => void
  isLoading?: boolean
}

export function SprintSelector({ 
  sprints, 
  selectedSprint, 
  onSprintSelect, 
  isLoading = false 
}: SprintSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  // 按优先级排序冲刺：active > paused > draft > completed
  const sortedSprints = [...sprints].sort((a, b) => {
    const statusPriority: Record<string, number> = {
      'active': 1,
      'paused': 2,
      'draft': 3,
      'completed': 4,
      'cancelled': 5
    }
    
    const aPriority = statusPriority[a.status] || 5
    const bPriority = statusPriority[b.status] || 5
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }
    
    // 同状态按更新时间排序
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <BoltIcon className="h-4 w-4 text-green-500" />
      case 'paused':
        return <PauseIcon className="h-4 w-4 text-yellow-500" />
      case 'draft':
        return <ClockIcon className="h-4 w-4 text-gray-500" />
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-blue-500" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '进行中'
      case 'paused':
        return '已暂停'
      case 'draft':
        return '草稿'
      case 'completed':
        return '已完成'
      default:
        return '未知'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'paused':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'draft':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'completed':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.sprint-selector')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  if (isLoading) {
    return (
      <div className="w-full max-w-md">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-md sprint-selector">
      {/* 选择器按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-white border border-border rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {selectedSprint ? (
            <>
              {getStatusIcon(selectedSprint.status)}
              <div className="min-w-0 flex-1 text-left">
                <p className="font-medium text-foreground truncate">
                  {selectedSprint.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getStatusText(selectedSprint.status)}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              <span className="text-muted-foreground">选择冲刺</span>
            </div>
          )}
        </div>
        <ChevronDownIcon 
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-md shadow-lg max-h-80 overflow-y-auto">
          {sortedSprints.length === 0 ? (
            <div className="px-4 py-6 text-center text-muted-foreground">
              <BoltIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>暂无冲刺</p>
              <p className="text-xs mt-1">创建第一个冲刺开始使用</p>
            </div>
          ) : (
            <>
              {/* 清除选择选项 */}
              <button
                onClick={() => {
                  onSprintSelect(null)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4" /> {/* 占位符 */}
                  <span className="text-muted-foreground">显示概览</span>
                </div>
              </button>

              {/* 冲刺列表 */}
              {sortedSprints.map((sprint) => (
                <button
                  key={sprint.id}
                  onClick={() => {
                    onSprintSelect(sprint)
                    setIsOpen(false)
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${
                    selectedSprint?.id === sprint.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(sprint.status)}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">
                        {sprint.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(sprint.status)}`}>
                          {getStatusText(sprint.status)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(sprint.updatedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
