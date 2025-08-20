import { Router, Response } from 'express'
import * as admin from 'firebase-admin'
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth'

const router = Router()

/**
 * 创建升级申请
 */
router.post("/", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid } = req.user!
    const { reason } = req.body

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "请提供升级理由"
      })
    }

    // 获取用户信息
    const userDoc = await admin.firestore()
      .collection("users")
      .doc(uid)
      .get()

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "用户不存在"
      })
    }

    const userData = userDoc.data()!
    
    // 检查用户当前类型
    if (userData.userType === 'admin') {
      return res.status(400).json({
        success: false,
        error: "管理员无需申请升级"
      })
    }

    if (userData.userType === 'premium') {
      return res.status(400).json({
        success: false,
        error: "您已经是高级用户"
      })
    }

    // 检查是否已有待处理的申请
    const existingRequest = await admin.firestore()
      .collection("upgradeRequests")
      .where("userId", "==", uid)
      .where("status", "==", "pending")
      .get()

    if (!existingRequest.empty) {
      return res.status(400).json({
        success: false,
        error: "您已有待处理的升级申请"
      })
    }

    // 创建升级申请
    const upgradeRequest = {
      userId: uid,
      userEmail: userData.email,
      userName: userData.displayName || userData.email,
      currentUserType: userData.userType || 'normal',
      requestedUserType: 'premium',
      reason: reason.trim(),
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }

    const docRef = await admin.firestore()
      .collection("upgradeRequests")
      .add(upgradeRequest)

    res.json({
      success: true,
      data: {
        id: docRef.id,
        ...upgradeRequest
      }
    })

  } catch (error) {
    console.error("Create upgrade request error:", error)
    res.status(500).json({
      success: false,
      error: "创建升级申请失败"
    })
  }
})

/**
 * 获取升级申请列表（管理员）
 */
router.get("/", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid } = req.user!
    
    // 检查管理员权限
    const userDoc = await admin.firestore()
      .collection("users")
      .doc(uid)
      .get()

    const userData = userDoc.data()
    if (userData?.userType !== "admin") {
      return res.status(403).json({
        success: false,
        error: "权限不足，仅管理员可访问"
      })
    }

    const { status = 'all', limit = 20, offset = 0 } = req.query

    let query: any = admin.firestore().collection("upgradeRequests")

    // 状态筛选
    if (status && status !== 'all') {
      query = query.where("status", "==", status)
    }

    // 排序和分页
    const snapshot = await query
      .orderBy("createdAt", "desc")
      .limit(Number(limit))
      .get()

    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // 获取统计信息
    const statsSnapshot = await admin.firestore()
      .collection("upgradeRequests")
      .get()

    const stats = {
      total: statsSnapshot.size,
      pending: 0,
      approved: 0,
      rejected: 0
    }

    if (!statsSnapshot.empty) {
      statsSnapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.status === 'pending') stats.pending++
        else if (data.status === 'approved') stats.approved++
        else if (data.status === 'rejected') stats.rejected++
      })
    }

    res.json({
      success: true,
      data: {
        requests,
        stats,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: stats.total
        }
      }
    })

  } catch (error) {
    console.error("Get upgrade requests error:", error)
    res.status(500).json({
      success: false,
      error: "获取升级申请列表失败"
    })
  }
})

/**
 * 审批升级申请（管理员）
 */
router.post("/:requestId/review", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid } = req.user!
    const { requestId } = req.params
    const { status, comment } = req.body

    // 检查管理员权限
    const userDoc = await admin.firestore()
      .collection("users")
      .doc(uid)
      .get()

    const userData = userDoc.data()
    if (userData?.userType !== "admin") {
      return res.status(403).json({
        success: false,
        error: "权限不足，仅管理员可操作"
      })
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "无效的审批状态"
      })
    }

    // 获取申请信息
    const requestDoc = await admin.firestore()
      .collection("upgradeRequests")
      .doc(requestId)
      .get()

    if (!requestDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "升级申请不存在"
      })
    }

    const requestData = requestDoc.data()!

    if (requestData.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: "该申请已被处理"
      })
    }

    // 使用事务处理
    await admin.firestore().runTransaction(async (transaction) => {
      // 更新申请状态
      transaction.update(requestDoc.ref, {
        status,
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewedBy: uid,
        reviewerComment: comment || '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })

      // 如果批准，更新用户类型
      if (status === 'approved') {
        const userRef = admin.firestore()
          .collection("users")
          .doc(requestData.userId)

        transaction.update(userRef, {
          userType: 'premium',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })
      }
    })

    res.json({
      success: true,
      message: status === 'approved' ? '申请已批准' : '申请已拒绝'
    })

  } catch (error) {
    console.error("Review upgrade request error:", error)
    res.status(500).json({
      success: false,
      error: "审批升级申请失败"
    })
  }
})

/**
 * 获取用户的升级申请状态
 */
router.get("/my-status", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid } = req.user!

    // 获取用户最新的申请
    const snapshot = await admin.firestore()
      .collection("upgradeRequests")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get()

    const latestRequest = snapshot.empty ? null : {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    }

    res.json({
      success: true,
      data: {
        latestRequest,
        canApply: !latestRequest || (latestRequest as any).status !== 'pending'
      }
    })

  } catch (error) {
    console.error("Get my upgrade status error:", error)
    res.status(500).json({
      success: false,
      error: "获取申请状态失败"
    })
  }
})

export { router as upgradeRequestRoutes }
