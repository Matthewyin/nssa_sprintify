import { Router } from "express";
import * as admin from "firebase-admin";
import { authenticateUser, AuthenticatedRequest, rateLimit } from "../middleware/auth";

// 获取Firestore实例
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const router = Router();

// 应用认证中间件到所有路由
router.use(authenticateUser);

// 应用速率限制
router.use(rateLimit(60000, 100)); // 每分钟最多100个请求

/**
 * 获取用户的冲刺列表
 */
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    const { status, type, limit = 20, offset = 0 } = req.query;
    
    let query = admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("sprints")
      .orderBy("createdAt", "desc");
    
    // 添加过滤条件
    if (status) {
      query = query.where("status", "==", status);
    }
    
    if (type) {
      query = query.where("type", "==", type);
    }
    
    // 分页
    query = query.limit(Number(limit)).offset(Number(offset));
    
    const snapshot = await query.get();
    const sprints = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: sprints,
      pagination: {
        total: snapshot.size,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    console.error("Get sprints error:", error);
    res.status(500).json({
      success: false,
      error: "获取冲刺列表失败"
    });
  }
});

/**
 * 获取单个冲刺详情
 */
router.get("/:sprintId", async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    const { sprintId } = req.params;
    
    // 获取冲刺基本信息
    const sprintDoc = await admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("sprints")
      .doc(sprintId)
      .get();
    
    if (!sprintDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "冲刺不存在"
      });
    }
    
    // 获取任务列表
    const tasksSnapshot = await admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("sprints")
      .doc(sprintId)
      .collection("tasks")
      .orderBy("createdAt", "asc")
      .get();
    
    // 获取里程碑列表
    const milestonesSnapshot = await admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("sprints")
      .doc(sprintId)
      .collection("milestones")
      .orderBy("targetDate", "asc")
      .get();
    
    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const milestones = milestonesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: {
        ...sprintDoc.data(),
        id: sprintDoc.id,
        tasks,
        milestones
      }
    });
  } catch (error) {
    console.error("Get sprint error:", error);
    res.status(500).json({
      success: false,
      error: "获取冲刺详情失败"
    });
  }
});

/**
 * 创建新冲刺
 */
router.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    const sprintData = req.body;

    console.log('🔍 后端收到的Sprint数据:', sprintData);
    console.log('🔍 用户ID:', uid);

    // 验证必填字段
    const requiredFields = ["title", "description", "type", "template", "startDate", "endDate"];
    for (const field of requiredFields) {
      if (!sprintData[field]) {
        console.log(`❌ 缺少必填字段: ${field}, 值为:`, sprintData[field]);
        return res.status(400).json({
          success: false,
          error: `缺少必填字段: ${field}`,
          receivedData: sprintData
        });
      }
    }

    console.log('✅ 所有必填字段验证通过');
    
    // 创建冲刺文档
    const sprintRef = admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("sprints")
      .doc();
    
    const newSprint = {
      ...sprintData,
      id: sprintRef.id,
      userId: uid,
      status: "draft",
      progress: 0,
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        totalTime: 0,
        actualTime: 0
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    
    await sprintRef.set(newSprint);
    
    res.status(201).json({
      success: true,
      data: {
        id: sprintRef.id,
        ...newSprint
      }
    });
  } catch (error) {
    console.error("Create sprint error:", error);
    res.status(500).json({
      success: false,
      error: "创建冲刺失败"
    });
  }
});

/**
 * 更新冲刺
 */
router.put("/:sprintId", async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    const { sprintId } = req.params;
    const updates = req.body;
    
    // 检查冲刺是否存在
    const sprintRef = admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("sprints")
      .doc(sprintId);
    
    const sprintDoc = await sprintRef.get();
    if (!sprintDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "冲刺不存在"
      });
    }
    
    // 更新冲刺
    await sprintRef.update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    res.json({
      success: true,
      message: "冲刺更新成功"
    });
  } catch (error) {
    console.error("Update sprint error:", error);
    res.status(500).json({
      success: false,
      error: "更新冲刺失败"
    });
  }
});

/**
 * 删除冲刺
 */
router.delete("/:sprintId", async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    const { sprintId } = req.params;
    
    // 使用批量删除
    const batch = admin.firestore().batch();
    
    // 删除冲刺文档
    const sprintRef = admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("sprints")
      .doc(sprintId);
    
    batch.delete(sprintRef);
    
    // 删除相关任务（这里只是示例，实际应该递归删除所有子集合）
    const tasksSnapshot = await admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("sprints")
      .doc(sprintId)
      .collection("tasks")
      .get();
    
    tasksSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    res.json({
      success: true,
      message: "冲刺删除成功"
    });
  } catch (error) {
    console.error("Delete sprint error:", error);
    res.status(500).json({
      success: false,
      error: "删除冲刺失败"
    });
  }
});

/**
 * 启动冲刺
 */
router.post("/:sprintId/start", async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    const { sprintId } = req.params;
    
    const sprintRef = admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("sprints")
      .doc(sprintId);
    
    await sprintRef.update({
      status: "active",
      startDate: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    
    res.json({
      success: true,
      message: "冲刺已启动"
    });
  } catch (error) {
    console.error("Start sprint error:", error);
    res.status(500).json({
      success: false,
      error: "启动冲刺失败"
    });
  }
});

/**
 * 完成冲刺
 */
router.post("/:sprintId/complete", async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    const { sprintId } = req.params;
    
    const sprintRef = admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("sprints")
      .doc(sprintId);
    
    await sprintRef.update({
      status: "completed",
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    
    res.json({
      success: true,
      message: "冲刺已完成"
    });
  } catch (error) {
    console.error("Complete sprint error:", error);
    res.status(500).json({
      success: false,
      error: "完成冲刺失败"
    });
  }
});

export { router as sprintRoutes };
