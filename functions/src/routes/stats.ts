import { Router } from "express";
import * as admin from "firebase-admin";
import { authenticateUser, AuthenticatedRequest, rateLimit } from "../middleware/auth";

const router = Router();

// 应用认证中间件
router.use(authenticateUser);
router.use(rateLimit(60000, 50)); // 每分钟最多50个请求

/**
 * 获取用户总体统计
 */
router.get("/overview", async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    
    // 获取用户统计数据
    const statsDoc = await admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("stats")
      .doc("overview")
      .get();
    
    if (!statsDoc.exists) {
      // 如果统计数据不存在，创建默认数据
      const defaultStats = {
        userId: uid,
        totalSprints: 0,
        completedSprints: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalTime: 0,
        streakDays: 0,
        longestStreak: 0,
        lastActiveDate: admin.firestore.FieldValue.serverTimestamp(),
        achievements: [],
        monthlyStats: {},
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await statsDoc.ref.set(defaultStats);
      
      return res.json({
        success: true,
        data: defaultStats
      });
    }
    
    res.json({
      success: true,
      data: statsDoc.data()
    });
  } catch (error) {
    console.error("Get overview stats error:", error);
    res.status(500).json({
      success: false,
      error: "获取统计数据失败"
    });
  }
});

/**
 * 获取冲刺统计
 */
router.get("/sprints", async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    const { period = "month" } = req.query; // month, quarter, year
    
    // 计算时间范围
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    // 获取时间范围内的冲刺数据
    const sprintsSnapshot = await admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("sprints")
      .where("createdAt", ">=", startDate)
      .get();
    
    const sprints = sprintsSnapshot.docs.map(doc => doc.data());
    
    // 统计分析
    const stats = {
      total: sprints.length,
      byStatus: {
        draft: sprints.filter(s => s.status === "draft").length,
        active: sprints.filter(s => s.status === "active").length,
        completed: sprints.filter(s => s.status === "completed").length,
        cancelled: sprints.filter(s => s.status === "cancelled").length
      },
      byType: {
        learning: sprints.filter(s => s.type === "learning").length,
        project: sprints.filter(s => s.type === "project").length
      },
      byTemplate: {
        "7days": sprints.filter(s => s.template === "7days").length,
        "21days": sprints.filter(s => s.template === "21days").length,
        "30days": sprints.filter(s => s.template === "30days").length,
        "60days": sprints.filter(s => s.template === "60days").length,
        "90days": sprints.filter(s => s.template === "90days").length
      },
      completionRate: sprints.length > 0 ? 
        (sprints.filter(s => s.status === "completed").length / sprints.length * 100).toFixed(1) : 0,
      averageProgress: sprints.length > 0 ?
        (sprints.reduce((sum, s) => sum + (s.progress || 0), 0) / sprints.length).toFixed(1) : 0
    };
    
    res.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: startDate,
          end: now
        },
        stats
      }
    });
  } catch (error) {
    console.error("Get sprint stats error:", error);
    res.status(500).json({
      success: false,
      error: "获取冲刺统计失败"
    });
  }
});

/**
 * 获取任务统计
 */
router.get("/tasks", async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    const { sprintId, period = "month" } = req.query;
    
    let tasksQuery;
    
    if (sprintId) {
      // 获取特定冲刺的任务统计
      tasksQuery = admin.firestore()
        .collection("users")
        .doc(uid)
        .collection("sprints")
        .doc(sprintId as string)
        .collection("tasks");
    } else {
      // 获取所有任务统计（需要使用Collection Group查询）
      // 注意：这需要在Firebase Console中创建相应的索引
      tasksQuery = admin.firestore()
        .collectionGroup("tasks")
        .where("userId", "==", uid); // 假设任务文档中有userId字段
    }
    
    const tasksSnapshot = await tasksQuery.get();
    const tasks = tasksSnapshot.docs.map(doc => doc.data());
    
    // 统计分析
    const stats = {
      total: tasks.length,
      byStatus: {
        todo: tasks.filter(t => t.status === "todo").length,
        "in-progress": tasks.filter(t => t.status === "in-progress").length,
        completed: tasks.filter(t => t.status === "completed").length,
        cancelled: tasks.filter(t => t.status === "cancelled").length
      },
      byPriority: {
        low: tasks.filter(t => t.priority === "low").length,
        medium: tasks.filter(t => t.priority === "medium").length,
        high: tasks.filter(t => t.priority === "high").length
      },
      completionRate: tasks.length > 0 ?
        (tasks.filter(t => t.status === "completed").length / tasks.length * 100).toFixed(1) : 0,
      totalEstimatedTime: tasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0),
      totalActualTime: tasks.reduce((sum, t) => sum + (t.actualTime || 0), 0),
      averageTaskTime: tasks.length > 0 ?
        (tasks.reduce((sum, t) => sum + (t.actualTime || 0), 0) / tasks.length).toFixed(1) : 0
    };
    
    res.json({
      success: true,
      data: {
        sprintId: sprintId || "all",
        stats
      }
    });
  } catch (error) {
    console.error("Get task stats error:", error);
    res.status(500).json({
      success: false,
      error: "获取任务统计失败"
    });
  }
});

/**
 * 获取时间统计
 */
router.get("/time", async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    const { period = "week" } = req.query;
    
    // 计算时间范围
    const now = new Date();
    let startDate: Date;
    let groupBy: string;
    
    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = "day";
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = "day";
        break;
      case "quarter":
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        groupBy = "week";
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        groupBy = "month";
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = "day";
    }
    
    // 这里应该从任务数据中聚合时间统计
    // 由于Firestore的限制，可能需要在客户端或通过定时任务预计算
    
    // 模拟时间统计数据
    const timeStats = generateMockTimeStats(startDate, now, groupBy);
    
    res.json({
      success: true,
      data: {
        period,
        groupBy,
        dateRange: {
          start: startDate,
          end: now
        },
        stats: timeStats
      }
    });
  } catch (error) {
    console.error("Get time stats error:", error);
    res.status(500).json({
      success: false,
      error: "获取时间统计失败"
    });
  }
});

/**
 * 获取成就列表
 */
router.get("/achievements", async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    
    const statsDoc = await admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("stats")
      .doc("overview")
      .get();
    
    const achievements = statsDoc.exists ? statsDoc.data()?.achievements || [] : [];
    
    // 检查是否有新成就可以解锁
    const newAchievements = await checkForNewAchievements(uid);
    
    res.json({
      success: true,
      data: {
        achievements,
        newAchievements
      }
    });
  } catch (error) {
    console.error("Get achievements error:", error);
    res.status(500).json({
      success: false,
      error: "获取成就列表失败"
    });
  }
});

// 辅助函数

/**
 * 生成模拟时间统计数据
 */
function generateMockTimeStats(startDate: Date, endDate: Date, groupBy: string): any[] {
  const stats = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    let label: string;
    let increment: number;
    
    switch (groupBy) {
      case "day":
        label = current.toISOString().split("T")[0];
        increment = 24 * 60 * 60 * 1000; // 1 day
        break;
      case "week":
        label = `${current.getFullYear()}-W${Math.ceil(current.getDate() / 7)}`;
        increment = 7 * 24 * 60 * 60 * 1000; // 1 week
        break;
      case "month":
        label = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, "0")}`;
        increment = 30 * 24 * 60 * 60 * 1000; // ~1 month
        break;
      default:
        label = current.toISOString().split("T")[0];
        increment = 24 * 60 * 60 * 1000;
    }
    
    stats.push({
      label,
      date: new Date(current),
      totalTime: Math.floor(Math.random() * 480), // 0-8小时
      focusTime: Math.floor(Math.random() * 240), // 0-4小时
      breakTime: Math.floor(Math.random() * 60), // 0-1小时
      sessions: Math.floor(Math.random() * 10) + 1 // 1-10个会话
    });
    
    current.setTime(current.getTime() + increment);
  }
  
  return stats;
}

/**
 * 检查新成就
 */
async function checkForNewAchievements(userId: string): Promise<any[]> {
  // 这里应该实现成就检查逻辑
  // 基于用户的统计数据判断是否解锁新成就
  return [];
}

export { router as statsRoutes };
