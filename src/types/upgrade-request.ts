/**
 * 升级申请相关类型定义
 */

export interface UpgradeRequest {
  id: string
  userId: string
  userEmail: string
  userName: string
  currentUserType: 'normal' | 'premium'
  requestedUserType: 'premium'
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  updatedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  reviewerComment?: string
}

export interface CreateUpgradeRequestData {
  reason: string
}

export interface ReviewUpgradeRequestData {
  status: 'approved' | 'rejected'
  comment?: string
}

export interface UpgradeRequestFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'all'
  userType?: 'normal' | 'premium'
}

export interface UpgradeRequestStats {
  total: number
  pending: number
  approved: number
  rejected: number
}
