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
exports.authenticateUser = authenticateUser;
exports.requireUserType = requireUserType;
exports.checkAIUsageLimit = checkAIUsageLimit;
exports.rateLimit = rateLimit;
const admin = __importStar(require("firebase-admin"));
/**
 * 认证中间件
 */
async function authenticateUser(req, res, next) {
    try {
        // 从请求头获取Authorization token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                error: "缺少认证token"
            });
            return;
        }
        const token = authHeader.split("Bearer ")[1];
        // 验证token
        const decodedToken = await admin.auth().verifyIdToken(token);
        // 将用户信息添加到请求对象
        req.user = decodedToken;
        next();
    }
    catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({
            success: false,
            error: "认证失败"
        });
    }
}
/**
 * 权限检查中间件
 */
function requireUserType(requiredType) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: "用户未认证"
                });
                return;
            }
            // 获取用户数据
            const userDoc = await admin.firestore()
                .collection("users")
                .doc(req.user.uid)
                .get();
            if (!userDoc.exists) {
                res.status(404).json({
                    success: false,
                    error: "用户数据不存在"
                });
                return;
            }
            const userData = userDoc.data();
            const userType = (userData === null || userData === void 0 ? void 0 : userData.userType) || "normal";
            // 检查用户等级
            const typeHierarchy = {
                normal: 1,
                premium: 2,
                admin: 3
            };
            if (typeHierarchy[userType] < typeHierarchy[requiredType]) {
                res.status(403).json({
                    success: false,
                    error: "权限不足"
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error("Permission check error:", error);
            res.status(500).json({
                success: false,
                error: "权限检查失败"
            });
        }
    };
}
/**
 * AI使用限制中间件
 */
async function checkAIUsageLimit(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: "用户未认证"
            });
            return;
        }
        const { uid } = req.user;
        const today = new Date().toISOString().split("T")[0];
        // 获取用户类型和今日使用情况
        const [userDoc, aiUsageDoc] = await Promise.all([
            admin.firestore().collection("users").doc(uid).get(),
            admin.firestore()
                .collection("users")
                .doc(uid)
                .collection("aiUsage")
                .doc(today)
                .get()
        ]);
        const userData = userDoc.data();
        const userType = (userData === null || userData === void 0 ? void 0 : userData.userType) || "normal";
        // 管理员无限制
        if (userType === "admin") {
            next();
            return;
        }
        // 获取使用限制
        const limits = {
            normal: 5,
            premium: 10,
            admin: -1
        };
        const limit = limits[userType];
        const aiUsageData = aiUsageDoc.data();
        const currentCount = (aiUsageData === null || aiUsageData === void 0 ? void 0 : aiUsageData.count) || 0;
        if (currentCount >= limit) {
            res.status(429).json({
                success: false,
                error: "AI使用次数已达上限",
                data: {
                    currentCount,
                    limit,
                    resetAt: aiUsageData === null || aiUsageData === void 0 ? void 0 : aiUsageData.resetAt
                }
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error("AI usage check error:", error);
        res.status(500).json({
            success: false,
            error: "AI使用限制检查失败"
        });
    }
}
/**
 * 速率限制中间件
 */
function rateLimit(windowMs, maxRequests) {
    const requests = new Map();
    return (req, res, next) => {
        var _a;
        const clientId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.uid) || req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;
        // 清理过期的记录
        for (const [key, value] of requests.entries()) {
            if (value.resetTime < windowStart) {
                requests.delete(key);
            }
        }
        // 检查当前客户端的请求次数
        const clientRequests = requests.get(clientId);
        if (!clientRequests) {
            requests.set(clientId, { count: 1, resetTime: now });
            next();
            return;
        }
        if (clientRequests.count >= maxRequests) {
            res.status(429).json({
                success: false,
                error: "请求过于频繁，请稍后重试"
            });
            return;
        }
        clientRequests.count++;
        next();
    };
}
//# sourceMappingURL=auth.js.map