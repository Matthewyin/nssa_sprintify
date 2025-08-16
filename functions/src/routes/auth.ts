import { Router } from "express";
import * as admin from "firebase-admin";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

/**
 * 验证用户token
 */
router.post("/verify", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    
    // 获取用户数据
    const userDoc = await admin.firestore()
      .collection("users")
      .doc(uid)
      .get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "用户数据不存在"
      });
    }
    
    const userData = userDoc.data();
    
    res.json({
      success: true,
      data: {
        uid,
        email: userData?.email,
        displayName: userData?.displayName,
        userType: userData?.userType || "normal",
        emailVerified: req.user!.email_verified
      }
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({
      success: false,
      error: "Token验证失败"
    });
  }
});

/**
 * 更新用户等级
 */
router.post("/upgrade", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    const { targetType } = req.body;
    
    // 验证目标用户类型
    if (!["normal", "premium", "admin"].includes(targetType)) {
      return res.status(400).json({
        success: false,
        error: "无效的用户类型"
      });
    }
    
    // 检查权限（只有管理员可以升级其他用户）
    const currentUserDoc = await admin.firestore()
      .collection("users")
      .doc(uid)
      .get();
    
    const currentUserData = currentUserDoc.data();
    if (currentUserData?.userType !== "admin" && targetType === "admin") {
      return res.status(403).json({
        success: false,
        error: "权限不足"
      });
    }
    
    // 更新用户类型
    await admin.firestore()
      .collection("users")
      .doc(uid)
      .update({
        userType: targetType,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    res.json({
      success: true,
      message: "用户等级更新成功"
    });
  } catch (error) {
    console.error("User upgrade error:", error);
    res.status(500).json({
      success: false,
      error: "用户等级更新失败"
    });
  }
});

/**
 * 获取用户统计信息
 */
router.get("/profile", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    
    // 获取用户基本信息
    const userDoc = await admin.firestore()
      .collection("users")
      .doc(uid)
      .get();
    
    // 获取用户统计信息
    const statsDoc = await admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("stats")
      .doc("overview")
      .get();
    
    // 获取今日AI使用情况
    const today = new Date().toISOString().split("T")[0];
    const aiUsageDoc = await admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("aiUsage")
      .doc(today)
      .get();
    
    const userData = userDoc.data();
    const statsData = statsDoc.data();
    const aiUsageData = aiUsageDoc.data();
    
    res.json({
      success: true,
      data: {
        profile: {
          uid,
          email: userData?.email,
          displayName: userData?.displayName,
          userType: userData?.userType || "normal",
          createdAt: userData?.createdAt,
          lastLoginAt: userData?.lastLoginAt
        },
        stats: {
          totalSprints: statsData?.totalSprints || 0,
          completedSprints: statsData?.completedSprints || 0,
          totalTasks: statsData?.totalTasks || 0,
          completedTasks: statsData?.completedTasks || 0,
          streakDays: statsData?.streakDays || 0,
          achievements: statsData?.achievements || []
        },
        aiUsage: {
          todayCount: aiUsageData?.count || 0,
          limit: aiUsageData?.limit || 5,
          resetAt: aiUsageData?.resetAt
        }
      }
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "获取用户信息失败"
    });
  }
});

/**
 * 删除用户账户
 */
router.delete("/account", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    
    // 删除用户的所有数据（使用批量删除）
    const batch = admin.firestore().batch();
    
    // 删除用户文档
    const userRef = admin.firestore().collection("users").doc(uid);
    batch.delete(userRef);
    
    // 注意：实际生产环境中需要递归删除所有子集合
    // 这里只是示例，完整的删除逻辑应该在后台任务中处理
    
    await batch.commit();
    
    // 删除Firebase Auth用户
    await admin.auth().deleteUser(uid);
    
    res.json({
      success: true,
      message: "账户删除成功"
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      error: "账户删除失败"
    });
  }
});

export { router as authRoutes };
