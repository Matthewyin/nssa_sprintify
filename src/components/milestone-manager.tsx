'use client'

import { useState, useEffect } from 'react'
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge } from "@/components/ui"
import { useSprintStore } from "@/stores/sprint-store"
import { Milestone, MilestoneStatus, CreateMilestoneRequest } from "@/types/sprint"
import { 
  PlusIcon,
  FlagIcon,
  CalendarIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'

interface MilestoneManagerProps {
  sprintId: string
}

export function MilestoneManager({ sprintId }: MilestoneManagerProps) {
  const { 
    currentMilestones, 
    currentTasks,
    isLoading, 
    createMilestone, 
    updateMilestone, 
    deleteMilestone, 
    achieveMilestone,
    loadMilestones 
  } = useSprintStore()
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [formData, setFormData] = useState<CreateMilestoneRequest>({
    title: '',
    description: '',
    targetDate: new Date(),
    criteria: [''],
    relatedTasks: []
  })

  useEffect(() => {
    loadMilestones(sprintId)
  }, [sprintId, loadMilestones])

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetDate: new Date(),
      criteria: [''],
      relatedTasks: []
    })
    setShowCreateForm(false)
    setEditingMilestone(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // 过滤空的标准
      const filteredCriteria = formData.criteria.filter(c => c.trim() !== '')
      
      if (editingMilestone) {
        await updateMilestone(editingMilestone.id, {
          ...formData,
          criteria: filteredCriteria
        })
      } else {
        await createMilestone(sprintId, {
          ...formData,
          criteria: filteredCriteria
        })
      }
      resetForm()
    } catch (error) {
      console.error('Milestone operation failed:', error)
    }
  }

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setFormData({
      title: milestone.title,
      description: milestone.description,
      targetDate: milestone.targetDate,
      criteria: milestone.criteria.length > 0 ? milestone.criteria : [''],
      relatedTasks: milestone.relatedTasks,
      reward: milestone.reward
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (milestoneId: string) => {
    if (confirm('确定要删除这个里程碑吗？')) {
      try {
        await deleteMilestone(milestoneId)
      } catch (error) {
        console.error('Delete milestone failed:', error)
      }
    }
  }

  const handleAchieve = async (milestoneId: string) => {
    try {
      await achieveMilestone(milestoneId)
    } catch (error) {
      console.error('Achieve milestone failed:', error)
    }
  }

  const addCriteria = () => {
    setFormData(prev => ({
      ...prev,
      criteria: [...prev.criteria, '']
    }))
  }

  const updateCriteria = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      criteria: prev.criteria.map((c, i) => i === index ? value : c)
    }))
  }

  const removeCriteria = (index: number) => {
    setFormData(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index)
    }))
  }

  const getStatusColor = (status: MilestoneStatus) => {
    const colors = {
      pending: 'warning',
      achieved: 'success',
      missed: 'error'
    }
    return colors[status] || 'secondary'
  }

  const getStatusText = (status: MilestoneStatus) => {
    const texts = {
      pending: '待达成',
      achieved: '已达成',
      missed: '已错过'
    }
    return texts[status] || status
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (milestone: Milestone) => {
    return milestone.status === 'pending' && new Date(milestone.targetDate) < new Date()
  }

  // 按状态分组里程碑
  const groupedMilestones = {
    pending: currentMilestones.filter(m => m.status === 'pending'),
    achieved: currentMilestones.filter(m => m.status === 'achieved'),
    missed: currentMilestones.filter(m => m.status === 'missed')
  }

  return (
    <div className="space-y-6">
      {/* 头部操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">里程碑管理</h2>
          <p className="text-sm text-muted-foreground">
            共 {currentMilestones.length} 个里程碑，已达成 {groupedMilestones.achieved.length} 个
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          添加里程碑
        </Button>
      </div>

      {/* 创建/编辑表单 */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingMilestone ? '编辑里程碑' : '创建里程碑'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    里程碑标题 *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="输入里程碑标题"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    目标日期 *
                  </label>
                  <Input
                    type="date"
                    value={formData.targetDate.toISOString().split('T')[0]}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetDate: new Date(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  里程碑描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="详细描述里程碑内容..."
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  完成标准
                </label>
                <div className="space-y-2">
                  {formData.criteria.map((criteria, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={criteria}
                        onChange={(e) => updateCriteria(index, e.target.value)}
                        placeholder="输入完成标准"
                      />
                      {formData.criteria.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCriteria(index)}
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCriteria}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    添加标准
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  奖励（可选）
                </label>
                <Input
                  value={formData.reward || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, reward: e.target.value }))}
                  placeholder="达成里程碑后的奖励"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingMilestone ? '更新里程碑' : '创建里程碑'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 里程碑列表 */}
      {currentMilestones.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FlagIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">还没有里程碑</h3>
            <p className="text-muted-foreground mb-4">
              设置里程碑来跟踪重要的进展节点
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              创建第一个里程碑
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentMilestones.map((milestone) => (
            <Card key={milestone.id} className={isOverdue(milestone) ? 'border-error' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FlagIcon className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{milestone.title}</h3>
                      <Badge variant={getStatusColor(milestone.status) as any}>
                        {getStatusText(milestone.status)}
                      </Badge>
                      {isOverdue(milestone) && (
                        <Badge variant="error">已逾期</Badge>
                      )}
                    </div>
                    
                    {milestone.description && (
                      <p className="text-muted-foreground mb-3">{milestone.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        目标日期: {formatDate(milestone.targetDate)}
                      </span>
                      {milestone.achievedDate && (
                        <span className="flex items-center gap-1">
                          <TrophyIcon className="h-4 w-4" />
                          达成日期: {formatDate(milestone.achievedDate)}
                        </span>
                      )}
                    </div>

                    {milestone.criteria.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium mb-2">完成标准:</h4>
                        <ul className="space-y-1">
                          {milestone.criteria.map((criteria, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                              {criteria}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {milestone.reward && (
                      <div className="mb-3">
                        <span className="text-sm font-medium">奖励: </span>
                        <span className="text-sm text-muted-foreground">{milestone.reward}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {milestone.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleAchieve(milestone.id)}
                      >
                        <CheckIcon className="h-4 w-4 mr-2" />
                        标记达成
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(milestone)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(milestone.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      )}
    </div>
  )
}
