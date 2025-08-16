import { Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";

// 扩展Request接口以包含用户信息
export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

/**
 * 认证中间件
 */
export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
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
  } catch (error) {
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
export function requireUserType(requiredType: "normal" | "premium" | "admin") {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
      const userType = userData?.userType || "normal";
      
      // 检查用户等级
      const typeHierarchy = {
        normal: 1,
        premium: 2,
        admin: 3
      };
      
      if (typeHierarchy[userType as keyof typeof typeHierarchy] < typeHierarchy[requiredType]) {
        res.status(403).json({
          success: false,
          error: "权限不足"
        });
        return;
      }
      
      next();
    } catch (error) {
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
export async function checkAIUsageLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
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
    const userType = userData?.userType || "normal";
    
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
    
    const limit = limits[userType as keyof typeof limits];
    const aiUsageData = aiUsageDoc.data();
    const currentCount = aiUsageData?.count || 0;
    
    if (currentCount >= limit) {
      res.status(429).json({
        success: false,
        error: "AI使用次数已达上限",
        data: {
          currentCount,
          limit,
          resetAt: aiUsageData?.resetAt
        }
      });
      return;
    }
    
    next();
  } catch (error) {
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
export function rateLimit(windowMs: number, maxRequests: number) {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const clientId = req.user?.uid || req.ip;
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
