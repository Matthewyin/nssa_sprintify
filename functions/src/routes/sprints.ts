import { Router, Response } from "express";
import * as admin from "firebase-admin";
import { authenticateUser, AuthenticatedRequest, rateLimit } from "../middleware/auth";

// 获取Firestore实例
const db = admin.firestore();

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
    const requiredFields = ["title", "type", "template", "startDate", "endDate"];
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

    // 单独验证description字段（允许空字符串）
    if (sprintData.description === undefined || sprintData.description === null) {
      console.log(`❌ 缺少必填字段: description, 值为:`, sprintData.description);
      return res.status(400).json({
        success: false,
        error: `缺少必填字段: description`,
        receivedData: sprintData
      });
    }

    console.log('✅ 所有必填字段验证通过');

    // 检查是否存在相同名称的冲刺
    const existingSprintsQuery = await admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("sprints")
      .where("title", "==", sprintData.title)
      .get();

    if (!existingSprintsQuery.empty) {
      console.log(`❌ 冲刺名称已存在: ${sprintData.title}`);
      return res.status(409).json({
        success: false,
        error: "冲刺名称已存在，请使用不同的名称",
        field: "title"
      });
    }

    console.log('✅ 冲刺名称检查通过');

    // 创建冲刺文档
    const sprintRef = admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("sprints")
      .doc();
    
    // 提取AI生成的任务和元数据
    const { aiGeneratedTasks, aiPlanMetadata, ...sprintDataWithoutAI } = sprintData;

    const newSprint = {
      ...sprintDataWithoutAI,
      id: sprintRef.id,
      userId: uid,
      status: "draft",
      progress: 0,
      stats: {
        totalTasks: aiGeneratedTasks ? aiGeneratedTasks.length : 0,
        completedTasks: 0,
        totalTime: aiPlanMetadata ? aiPlanMetadata.totalEstimatedHours * 60 : 0, // 转换为分钟
        actualTime: 0
      },
      // 保存AI计划元数据
      ...(aiPlanMetadata && { aiPlanMetadata }),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 使用事务来确保Sprint和任务都能成功创建
    await admin.firestore().runTransaction(async (transaction) => {
      // 创建Sprint
      transaction.set(sprintRef, newSprint);

      // 如果有AI生成的任务，创建任务
      if (aiGeneratedTasks && aiGeneratedTasks.length > 0) {
        console.log(`📋 创建 ${aiGeneratedTasks.length} 个AI生成的任务`);

        for (let i = 0; i < aiGeneratedTasks.length; i++) {
          const task = aiGeneratedTasks[i];
          const taskRef = admin.firestore()
            .collection("users")
            .doc(uid)
            .collection("sprints")
            .doc(sprintRef.id)
            .collection("tasks")
            .doc();

          const newTask = {
            id: taskRef.id,
            sprintId: sprintRef.id,
            userId: uid,
            title: task.title,
            description: task.description,
            status: "todo",
            priority: task.priority || "medium",
            estimatedTime: task.estimatedHours * 60, // 转换为分钟
            actualTime: 0,
            progress: 0,
            category: task.category || "general",
            dependencies: task.dependencies || [],
            tags: ["ai-generated"],
            order: i + 1,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          transaction.set(taskRef, newTask);
        }
      }
    });
    
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
      updatedAt: new Date()
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
      startDate: new Date(),
      updatedAt: new Date()
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
      completedAt: new Date(),
      updatedAt: new Date()
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

/**
 * 删除单个冲刺
 */
router.delete("/:sprintId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sprintId } = req.params;
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: "用户未认证"
      });
    }

    if (!sprintId) {
      return res.status(400).json({
        success: false,
        error: "缺少冲刺ID"
      });
    }

    console.log(`🗑️ 删除冲刺: ${sprintId}, 用户: ${uid}`);

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

    // 删除冲刺
    await sprintRef.delete();
    console.log(`✅ 冲刺删除成功: ${sprintId}`);

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
 * 批量删除冲刺
 */
router.delete("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sprintIds } = req.body;
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: "用户未认证"
      });
    }

    if (!sprintIds || !Array.isArray(sprintIds) || sprintIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "请提供要删除的冲刺ID列表"
      });
    }

    console.log(`🗑️ 批量删除冲刺: ${sprintIds.join(', ')}, 用户: ${uid}`);

    const batch = admin.firestore().batch();
    const deletedSprints: string[] = [];
    const notFoundSprints: string[] = [];

    // 检查每个冲刺是否存在并添加到批量删除
    for (const sprintId of sprintIds) {
      const sprintRef = admin.firestore()
        .collection("users")
        .doc(uid)
        .collection("sprints")
        .doc(sprintId);

      const sprintDoc = await sprintRef.get();
      if (sprintDoc.exists) {
        batch.delete(sprintRef);
        deletedSprints.push(sprintId);
      } else {
        notFoundSprints.push(sprintId);
      }
    }

    if (deletedSprints.length === 0) {
      return res.status(404).json({
        success: false,
        error: "没有找到要删除的冲刺",
        notFound: notFoundSprints
      });
    }

    // 执行批量删除
    await batch.commit();
    console.log(`✅ 批量删除成功: ${deletedSprints.join(', ')}`);

    res.json({
      success: true,
      message: `成功删除 ${deletedSprints.length} 个冲刺`,
      deleted: deletedSprints,
      notFound: notFoundSprints
    });

  } catch (error) {
    console.error("Batch delete sprints error:", error);
    res.status(500).json({
      success: false,
      error: "批量删除冲刺失败"
    });
  }
});

/**
 * 获取Sprint的任务列表
 */
router.get("/:sprintId/tasks", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sprintId } = req.params;
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: "用户未认证"
      });
    }

    console.log(`📋 获取Sprint任务: ${sprintId}, 用户: ${uid}`);

    // 检查Sprint是否存在
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

    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ 获取到 ${tasks.length} 个任务`);

    res.json({
      success: true,
      data: tasks
    });

  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({
      success: false,
      error: "获取任务列表失败"
    });
  }
});

export { router as sprintRoutes };
