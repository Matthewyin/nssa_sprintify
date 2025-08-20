"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.authRoutes = router;
/**
 * 验证用户token
 */
router.post("/verify", auth_1.authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
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
                email: userData === null || userData === void 0 ? void 0 : userData.email,
                displayName: userData === null || userData === void 0 ? void 0 : userData.displayName,
                userType: (userData === null || userData === void 0 ? void 0 : userData.userType) || "normal",
                emailVerified: req.user.email_verified
            }
        });
    }
    catch (error) {
        console.error("Token verification error:", error);
        res.status(500).json({
            success: false,
            error: "Token验证失败"
        });
    }
});
/**
 * 管理员升级用户等级（仅限管理员操作其他用户）
 */
router.post("/upgrade-user", auth_1.authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
        const { targetUserId, targetType } = req.body;
        // 验证目标用户类型
        if (!["normal", "premium"].includes(targetType)) {
            return res.status(400).json({
                success: false,
                error: "无效的用户类型"
            });
        }
        // 检查当前用户是否为管理员
        const currentUserDoc = await admin.firestore()
            .collection("users")
            .doc(uid)
            .get();
        const currentUserData = currentUserDoc.data();
        if ((currentUserData === null || currentUserData === void 0 ? void 0 : currentUserData.userType) !== "admin") {
            return res.status(403).json({
                success: false,
                error: "权限不足，仅管理员可操作"
            });
        }
        // 检查目标用户是否存在
        const targetUserDoc = await admin.firestore()
            .collection("users")
            .doc(targetUserId)
            .get();
        if (!targetUserDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "目标用户不存在"
            });
        }
        const targetUserData = targetUserDoc.data();
        // 防止修改管理员权限
        if ((targetUserData === null || targetUserData === void 0 ? void 0 : targetUserData.userType) === "admin") {
            return res.status(400).json({
                success: false,
                error: "不能修改管理员权限"
            });
        }
        // 更新目标用户类型
        await admin.firestore()
            .collection("users")
            .doc(targetUserId)
            .update({
            userType: targetType,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            message: "用户类型更新成功"
        });
    }
    catch (error) {
        console.error("Upgrade user error:", error);
        res.status(500).json({
            success: false,
            error: "用户升级失败"
        });
    }
});
/**
 * 获取用户统计信息
 */
router.get("/profile", auth_1.authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
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
                    email: userData === null || userData === void 0 ? void 0 : userData.email,
                    displayName: userData === null || userData === void 0 ? void 0 : userData.displayName,
                    userType: (userData === null || userData === void 0 ? void 0 : userData.userType) || "normal",
                    createdAt: userData === null || userData === void 0 ? void 0 : userData.createdAt,
                    lastLoginAt: userData === null || userData === void 0 ? void 0 : userData.lastLoginAt
                },
                stats: {
                    totalSprints: (statsData === null || statsData === void 0 ? void 0 : statsData.totalSprints) || 0,
                    completedSprints: (statsData === null || statsData === void 0 ? void 0 : statsData.completedSprints) || 0,
                    totalTasks: (statsData === null || statsData === void 0 ? void 0 : statsData.totalTasks) || 0,
                    completedTasks: (statsData === null || statsData === void 0 ? void 0 : statsData.completedTasks) || 0,
                    streakDays: (statsData === null || statsData === void 0 ? void 0 : statsData.streakDays) || 0,
                    achievements: (statsData === null || statsData === void 0 ? void 0 : statsData.achievements) || []
                },
                aiUsage: {
                    todayCount: (aiUsageData === null || aiUsageData === void 0 ? void 0 : aiUsageData.count) || 0,
                    limit: (aiUsageData === null || aiUsageData === void 0 ? void 0 : aiUsageData.limit) || 5,
                    resetAt: aiUsageData === null || aiUsageData === void 0 ? void 0 : aiUsageData.resetAt
                }
            }
        });
    }
    catch (error) {
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
router.delete("/account", auth_1.authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
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
    }
    catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({
            success: false,
            error: "账户删除失败"
        });
    }
});
/**
 * 设置第一个管理员（仅在系统没有管理员时可用）
 */
router.post("/setup-first-admin", auth_1.authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
        // 检查系统是否已有管理员
        const adminQuery = await admin.firestore()
            .collection("users")
            .where("userType", "==", "admin")
            .limit(1)
            .get();
        if (!adminQuery.empty) {
            return res.status(400).json({
                success: false,
                error: "系统已有管理员，无法重复设置"
            });
        }
        // 检查当前用户是否存在
        const currentUserDoc = await admin.firestore()
            .collection("users")
            .doc(uid)
            .get();
        if (!currentUserDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "用户不存在"
            });
        }
        // 将当前用户设置为管理员
        await admin.firestore()
            .collection("users")
            .doc(uid)
            .update({
            userType: "admin",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            message: "恭喜！您已成为系统的第一个管理员"
        });
    }
    catch (error) {
        console.error("Setup first admin error:", error);
        res.status(500).json({
            success: false,
            error: "设置管理员失败"
        });
    }
});
//# sourceMappingURL=auth.js.map