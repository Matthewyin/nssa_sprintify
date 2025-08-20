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
exports.userRoutes = void 0;
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.userRoutes = router;
/**
 * 获取所有用户列表（仅管理员）
 */
router.get("/", auth_1.authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
        // 检查当前用户是否为管理员
        const currentUserDoc = await admin.firestore()
            .collection("users")
            .doc(uid)
            .get();
        const currentUserData = currentUserDoc.data();
        if ((currentUserData === null || currentUserData === void 0 ? void 0 : currentUserData.userType) !== "admin") {
            return res.status(403).json({
                success: false,
                error: "权限不足，仅管理员可访问"
            });
        }
        // 获取查询参数
        const { page = 1, limit = 20, search = "", userType = "", sortBy = "createdAt", sortOrder = "desc" } = req.query;
        let query = admin.firestore().collection("users");
        // 用户类型筛选
        if (userType && userType !== "all") {
            query = query.where("userType", "==", userType);
        }
        // 排序
        const order = sortOrder === "asc" ? "asc" : "desc";
        query = query.orderBy(sortBy, order);
        // 分页
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        if (offset > 0) {
            const offsetSnapshot = await query.limit(offset).get();
            if (!offsetSnapshot.empty) {
                const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
                query = query.startAfter(lastDoc);
            }
        }
        const snapshot = await query.limit(limitNum).get();
        let users = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                email: data.email,
                displayName: data.displayName,
                userType: data.userType,
                disabled: data.disabled,
                createdAt: data.createdAt,
                lastLoginAt: data.lastLoginAt,
                updatedAt: data.updatedAt
            };
        });
        // 搜索过滤（在内存中进行，因为Firestore的文本搜索有限）
        if (search) {
            const searchLower = search.toString().toLowerCase();
            users = users.filter(user => {
                var _a, _b;
                return ((_a = user.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchLower)) ||
                    ((_b = user.displayName) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(searchLower));
            });
        }
        // 获取总数（简化版本，实际应该用单独的计数查询）
        const totalSnapshot = await admin.firestore().collection("users").get();
        const total = totalSnapshot.size;
        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    }
    catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({
            success: false,
            error: "获取用户列表失败"
        });
    }
});
/**
 * 获取单个用户详情（仅管理员）
 */
router.get("/:userId", auth_1.authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
        const { userId } = req.params;
        // 检查权限
        const currentUserDoc = await admin.firestore()
            .collection("users")
            .doc(uid)
            .get();
        const currentUserData = currentUserDoc.data();
        if ((currentUserData === null || currentUserData === void 0 ? void 0 : currentUserData.userType) !== "admin") {
            return res.status(403).json({
                success: false,
                error: "权限不足"
            });
        }
        // 获取用户信息
        const userDoc = await admin.firestore()
            .collection("users")
            .doc(userId)
            .get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "用户不存在"
            });
        }
        // 获取用户统计信息
        const statsDoc = await admin.firestore()
            .collection("users")
            .doc(userId)
            .collection("stats")
            .doc("overview")
            .get();
        // 获取用户的Sprint数量
        const sprintsSnapshot = await admin.firestore()
            .collection("users")
            .doc(userId)
            .collection("sprints")
            .get();
        const userData = userDoc.data();
        const statsData = statsDoc.data();
        res.json({
            success: true,
            data: {
                id: userDoc.id,
                email: userData === null || userData === void 0 ? void 0 : userData.email,
                displayName: userData === null || userData === void 0 ? void 0 : userData.displayName,
                userType: (userData === null || userData === void 0 ? void 0 : userData.userType) || "normal",
                createdAt: userData === null || userData === void 0 ? void 0 : userData.createdAt,
                lastLoginAt: userData === null || userData === void 0 ? void 0 : userData.lastLoginAt,
                updatedAt: userData === null || userData === void 0 ? void 0 : userData.updatedAt,
                stats: {
                    totalSprints: sprintsSnapshot.size,
                    completedSprints: (statsData === null || statsData === void 0 ? void 0 : statsData.completedSprints) || 0,
                    totalTasks: (statsData === null || statsData === void 0 ? void 0 : statsData.totalTasks) || 0,
                    completedTasks: (statsData === null || statsData === void 0 ? void 0 : statsData.completedTasks) || 0,
                    streakDays: (statsData === null || statsData === void 0 ? void 0 : statsData.streakDays) || 0
                }
            }
        });
    }
    catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({
            success: false,
            error: "获取用户信息失败"
        });
    }
});
/**
 * 更新用户信息（仅管理员）
 */
router.put("/:userId", auth_1.authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
        const { userId } = req.params;
        const { userType, displayName, disabled } = req.body;
        // 检查权限
        const currentUserDoc = await admin.firestore()
            .collection("users")
            .doc(uid)
            .get();
        const currentUserData = currentUserDoc.data();
        if ((currentUserData === null || currentUserData === void 0 ? void 0 : currentUserData.userType) !== "admin") {
            return res.status(403).json({
                success: false,
                error: "权限不足"
            });
        }
        // 验证用户类型
        if (userType && !["normal", "premium", "admin"].includes(userType)) {
            return res.status(400).json({
                success: false,
                error: "无效的用户类型"
            });
        }
        // 防止管理员降级自己
        if (userId === uid && userType && userType !== "admin") {
            return res.status(400).json({
                success: false,
                error: "不能降级自己的管理员权限"
            });
        }
        // 构建更新数据
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (userType)
            updateData.userType = userType;
        if (displayName !== undefined)
            updateData.displayName = displayName;
        if (disabled !== undefined)
            updateData.disabled = disabled;
        // 更新Firestore用户数据
        await admin.firestore()
            .collection("users")
            .doc(userId)
            .update(updateData);
        // 如果禁用/启用用户，也要更新Firebase Auth
        if (disabled !== undefined) {
            await admin.auth().updateUser(userId, {
                disabled: disabled
            });
        }
        res.json({
            success: true,
            message: "用户信息更新成功"
        });
    }
    catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({
            success: false,
            error: "更新用户信息失败"
        });
    }
});
/**
 * 删除用户（仅管理员）
 */
router.delete("/:userId", auth_1.authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
        const { userId } = req.params;
        // 检查权限
        const currentUserDoc = await admin.firestore()
            .collection("users")
            .doc(uid)
            .get();
        const currentUserData = currentUserDoc.data();
        if ((currentUserData === null || currentUserData === void 0 ? void 0 : currentUserData.userType) !== "admin") {
            return res.status(403).json({
                success: false,
                error: "权限不足"
            });
        }
        // 防止删除自己
        if (userId === uid) {
            return res.status(400).json({
                success: false,
                error: "不能删除自己的账户"
            });
        }
        // 删除用户数据
        await admin.firestore()
            .collection("users")
            .doc(userId)
            .delete();
        // 删除Firebase Auth用户
        await admin.auth().deleteUser(userId);
        res.json({
            success: true,
            message: "用户删除成功"
        });
    }
    catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({
            success: false,
            error: "删除用户失败"
        });
    }
});
//# sourceMappingURL=users.js.map