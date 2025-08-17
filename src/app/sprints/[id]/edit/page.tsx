'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge } from "@/components/ui"
import { Navigation } from "@/components/navigation"
import { PermissionGuard } from "@/components/permission-guard"
import { useSprintStore } from "@/stores/sprint-store"
import { SprintTemplate, SprintDifficulty, SprintType, UpdateSprintRequest } from "@/types/sprint"
import { getSprintTemplates } from "@/lib/sprint-templates"
import {
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  StarIcon,
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

export default function EditSprintPage() {
  const router = useRouter()
  const params = useParams()
  const sprintId = params.id as string
  
  const { 
    currentSprint, 
    sprints,
    isUpdating, 
    error, 
    updateSprint,
    clearError 
  } = useSprintStore()

  const [formData, setFormData] = useState<UpdateSprintRequest>({
    title: '',
    description: '',
    difficulty: 'intermediate',
    tags: []
  })

  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})
  const [selectedTemplate, setSelectedTemplate] = useState<SprintTemplate>('30days')

  // 获取当前冲刺数据
  const sprint = currentSprint?.id === sprintId ? currentSprint : sprints.find(s => s.id === sprintId)

  useEffect(() => {
    if (sprint) {
      setFormData({
        title: sprint.title,
        description: sprint.description,
        difficulty: sprint.difficulty,
        tags: sprint.tags || []
      })
      setSelectedTemplate(sprint.template)
    }
  }, [sprint])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  const templates = getSprintTemplates()
  const recommendations = templates.find(t => t.id === selectedTemplate)

  const validateForm = (): boolean => {
    const errors: Record<string, string[]> = {}

    if (!formData.title?.trim()) {
      errors.title = ['请输入冲刺标题']
    }

    if (!formData.description?.trim()) {
      errors.description = ['请输入冲刺描述']
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await updateSprint(sprintId, formData)
      router.push(`/sprints/${sprintId}`)
    } catch (error) {
      console.error('更新冲刺失败:', error)
    }
  }

  const handleInputChange = (field: keyof UpdateSprintRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 清除对应字段的错误信息
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: []
      }))
    }
  }

  const getTypeIcon = (type: SprintType) => {
    return type === 'learning' ? AcademicCapIcon : BriefcaseIcon
  }

  const getTypeText = (type: SprintType) => {
    return type === 'learning' ? '学习冲刺' : '项目冲刺'
  }

  const getDifficultyText = (difficulty: SprintDifficulty) => {
    const map = {
      beginner: '初级',
      intermediate: '中级', 
      advanced: '高级'
    }
    return map[difficulty]
  }

  if (!sprint) {
    return (
      <PermissionGuard>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="container mx-auto px-4 py-8">
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-semibold mb-2">冲刺不存在</h3>
                <p className="text-muted-foreground mb-4">
                  您要编辑的冲刺不存在或已被删除
                </p>
                <Link href="/sprints">
                  <Button>
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    返回冲刺列表
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </PermissionGuard>
    )
  }

  return (
    <PermissionGuard>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* 页面头部 */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <Link href={`/sprints/${sprintId}`}>
                  <Button variant="ghost" className="mb-4">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    返回冲刺详情
                  </Button>
                </Link>
                <h1 className="text-3xl font-bold">编辑冲刺</h1>
                <p className="text-muted-foreground mt-2">
                  修改您的冲刺计划信息
                </p>
              </div>
            </div>

            {/* 错误信息 */}
            {error && (
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <p className="text-red-600">{error}</p>
                </CardContent>
              </Card>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 基本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle>基本信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      冲刺标题 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="为您的冲刺起一个激励人心的名字"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={formErrors.title ? 'border-red-500' : ''}
                    />
                    {formErrors.title && (
                      <p className="text-sm text-red-500">{formErrors.title[0]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      冲刺描述 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className={`w-full p-3 border rounded-md resize-none ${
                        formErrors.description ? 'border-red-500' : 'border-input'
                      }`}
                      rows={4}
                      placeholder="详细描述您的冲刺目标和期望成果"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                    {formErrors.description && (
                      <p className="text-sm text-red-500">{formErrors.description[0]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">难度级别</label>
                    <div className="flex space-x-3">
                      {(['beginner', 'intermediate', 'advanced'] as SprintDifficulty[]).map((difficulty) => (
                        <Button
                          key={difficulty}
                          type="button"
                          variant={formData.difficulty === difficulty ? 'default' : 'outline'}
                          onClick={() => handleInputChange('difficulty', difficulty)}
                          className="flex-1"
                        >
                          <StarIcon className="h-4 w-4 mr-2" />
                          {getDifficultyText(difficulty)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">标签</label>
                    <Input
                      placeholder="添加标签，用逗号分隔"
                      value={formData.tags?.join(', ') || ''}
                      onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 当前模板信息（只读） */}
              <Card>
                <CardHeader>
                  <CardTitle>当前模板</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <ClockIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{recommendations?.name}</h4>
                        <p className="text-sm text-muted-foreground">{recommendations?.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {recommendations?.duration}天
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    注意：模板和时间设置在创建后无法修改
                  </p>
                </CardContent>
              </Card>

              {/* 提交按钮 */}
              <div className="flex space-x-4">
                <Button 
                  type="submit" 
                  disabled={isUpdating}
                  className="flex-1"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      更新中...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      保存修改
                    </>
                  )}
                </Button>
                <Link href={`/sprints/${sprintId}`}>
                  <Button variant="outline" type="button">
                    取消
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PermissionGuard>
  )
}
