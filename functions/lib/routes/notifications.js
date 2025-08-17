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
exports.notificationRoutes = void 0;
exports.sendNotificationToUser = sendNotificationToUser;
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.notificationRoutes = router;
// 应用认证中间件
router.use(auth_1.authenticateUser);
router.use((0, auth_1.rateLimit)(60000, 30)); // 每分钟最多30个请求
/**
 * 发送测试通知
 */
router.post("/test", async (req, res) => {
    try {
        const { uid } = req.user;
        const { title, body, data } = req.body;
        // 获取用户的FCM tokens
        const userDoc = await admin.firestore()
            .collection("users")
            .doc(uid)
            .get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "用户不存在"
            });
        }
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];
        if (fcmTokens.length === 0) {
            return res.status(400).json({
                success: false,
                error: "用户没有注册推送token"
            });
        }
        // 构建通知消息
        const message = {
            notification: {
                title: title || "测试通知",
                body: body || "这是一条测试推送通知"
            },
            data: Object.assign({ type: "test", userId: uid, timestamp: Date.now().toString() }, data),
            tokens: fcmTokens.map((tokenInfo) => tokenInfo.token)
        };
        // 发送通知
        const response = await admin.messaging().sendEachForMulticast(message);
        // 处理失败的token
        await handleFailedTokens(uid, fcmTokens, response);
        res.json({
            success: true,
            data: {
                successCount: response.successCount,
                failureCount: response.failureCount,
                responses: response.responses
            }
        });
    }
    catch (error) {
        console.error("Send test notification error:", error);
        res.status(500).json({
            success: false,
            error: "发送测试通知失败"
        });
    }
});
/**
 * 订阅通知主题
 */
router.post("/subscribe", async (req, res) => {
    try {
        const { uid } = req.user;
        const { topic } = req.body;
        if (!topic) {
            return res.status(400).json({
                success: false,
                error: "缺少主题参数"
            });
        }
        // 获取用户的FCM tokens
        const userDoc = await admin.firestore()
            .collection("users")
            .doc(uid)
            .get();
        const userData = userDoc.data();
        const fcmTokens = (userData === null || userData === void 0 ? void 0 : userData.fcmTokens) || [];
        if (fcmTokens.length === 0) {
            return res.status(400).json({
                success: false,
                error: "用户没有注册推送token"
            });
        }
        // 订阅主题
        const tokens = fcmTokens.map((tokenInfo) => tokenInfo.token);
        const response = await admin.messaging().subscribeToTopic(tokens, topic);
        // 更新用户的订阅主题列表
        await admin.firestore()
            .collection("users")
            .doc(uid)
            .update({
            subscribedTopics: admin.firestore.FieldValue.arrayUnion(topic),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            data: {
                topic,
                successCount: response.successCount,
                failureCount: response.failureCount
            }
        });
    }
    catch (error) {
        console.error("Subscribe to topic error:", error);
        res.status(500).json({
            success: false,
            error: "订阅主题失败"
        });
    }
});
/**
 * 取消订阅通知主题
 */
router.post("/unsubscribe", async (req, res) => {
    try {
        const { uid } = req.user;
        const { topic } = req.body;
        if (!topic) {
            return res.status(400).json({
                success: false,
                error: "缺少主题参数"
            });
        }
        // 获取用户的FCM tokens
        const userDoc = await admin.firestore()
            .collection("users")
            .doc(uid)
            .get();
        const userData = userDoc.data();
        const fcmTokens = (userData === null || userData === void 0 ? void 0 : userData.fcmTokens) || [];
        if (fcmTokens.length === 0) {
            return res.status(400).json({
                success: false,
                error: "用户没有注册推送token"
            });
        }
        // 取消订阅主题
        const tokens = fcmTokens.map((tokenInfo) => tokenInfo.token);
        const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
        // 更新用户的订阅主题列表
        await admin.firestore()
            .collection("users")
            .doc(uid)
            .update({
            subscribedTopics: admin.firestore.FieldValue.arrayRemove(topic),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            data: {
                topic,
                successCount: response.successCount,
                failureCount: response.failureCount
            }
        });
    }
    catch (error) {
        console.error("Unsubscribe from topic error:", error);
        res.status(500).json({
            success: false,
            error: "取消订阅主题失败"
        });
    }
});
/**
 * 更新通知设置
 */
router.put("/settings", async (req, res) => {
    try {
        const { uid } = req.user;
        const { settings } = req.body;
        // 更新用户的通知设置
        await admin.firestore()
            .collection("users")
            .doc(uid)
            .collection("settings")
            .doc("preferences")
            .update({
            "notifications": Object.assign({}, settings),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            message: "通知设置更新成功"
        });
    }
    catch (error) {
        console.error("Update notification settings error:", error);
        res.status(500).json({
            success: false,
            error: "更新通知设置失败"
        });
    }
});
/**
 * 发送自定义通知
 */
router.post("/send", async (req, res) => {
    try {
        const { uid } = req.user;
        const { targetUserId, title, body, data, type } = req.body;
        // 检查权限（只有管理员可以发送给其他用户）
        const currentUserDoc = await admin.firestore()
            .collection("users")
            .doc(uid)
            .get();
        const currentUserData = currentUserDoc.data();
        if (targetUserId !== uid && (currentUserData === null || currentUserData === void 0 ? void 0 : currentUserData.userType) !== "admin") {
            return res.status(403).json({
                success: false,
                error: "权限不足"
            });
        }
        // 发送通知
        const result = await sendNotificationToUser(targetUserId, {
            title,
            body,
            data: Object.assign({ type: type || "custom" }, data)
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error("Send custom notification error:", error);
        res.status(500).json({
            success: false,
            error: "发送通知失败"
        });
    }
});
/**
 * 获取通知历史
 */
router.get("/history", async (req, res) => {
    try {
        const { uid } = req.user;
        const { limit = 20, offset = 0 } = req.query;
        // 获取用户的通知历史
        const notificationsSnapshot = await admin.firestore()
            .collection("users")
            .doc(uid)
            .collection("notifications")
            .orderBy("createdAt", "desc")
            .limit(Number(limit))
            .offset(Number(offset))
            .get();
        const notifications = notificationsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json({
            success: true,
            data: notifications
        });
    }
    catch (error) {
        console.error("Get notification history error:", error);
        res.status(500).json({
            success: false,
            error: "获取通知历史失败"
        });
    }
});
// 辅助函数
/**
 * 发送通知给指定用户
 */
async function sendNotificationToUser(userId, notification) {
    try {
        // 获取用户的FCM tokens
        const userDoc = await admin.firestore()
            .collection("users")
            .doc(userId)
            .get();
        if (!userDoc.exists) {
            throw new Error("用户不存在");
        }
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];
        if (fcmTokens.length === 0) {
            console.warn(`用户 ${userId} 没有注册推送token`);
            return { successCount: 0, failureCount: 0 };
        }
        // 构建消息
        const message = {
            notification: {
                title: notification.title,
                body: notification.body
            },
            data: Object.assign({ userId, timestamp: Date.now().toString() }, notification.data),
            tokens: fcmTokens.map((tokenInfo) => tokenInfo.token)
        };
        // 发送通知
        const response = await admin.messaging().sendEachForMulticast(message);
        // 处理失败的token
        await handleFailedTokens(userId, fcmTokens, response);
        // 保存通知历史
        await saveNotificationHistory(userId, notification);
        return {
            successCount: response.successCount,
            failureCount: response.failureCount
        };
    }
    catch (error) {
        console.error("Send notification to user error:", error);
        throw error;
    }
}
/**
 * 处理失败的FCM tokens
 */
async function handleFailedTokens(userId, fcmTokens, response) {
    const failedTokens = [];
    response.responses.forEach((resp, idx) => {
        if (!resp.success) {
            const error = resp.error;
            if ((error === null || error === void 0 ? void 0 : error.code) === "messaging/invalid-registration-token" ||
                (error === null || error === void 0 ? void 0 : error.code) === "messaging/registration-token-not-registered") {
                failedTokens.push(fcmTokens[idx].token);
            }
        }
    });
    // 移除失效的tokens
    if (failedTokens.length > 0) {
        const validTokens = fcmTokens.filter(tokenInfo => !failedTokens.includes(tokenInfo.token));
        await admin.firestore()
            .collection("users")
            .doc(userId)
            .update({
            fcmTokens: validTokens,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`移除了 ${failedTokens.length} 个失效的FCM token`);
    }
}
/**
 * 保存通知历史
 */
async function saveNotificationHistory(userId, notification) {
    try {
        await admin.firestore()
            .collection("users")
            .doc(userId)
            .collection("notifications")
            .add({
            title: notification.title,
            body: notification.body,
            data: notification.data || {},
            status: "sent",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    catch (error) {
        console.error("Save notification history error:", error);
    }
}
//# sourceMappingURL=notifications.js.map