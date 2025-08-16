import { Router } from "express";
import * as admin from "firebase-admin";
import { authenticateUser, AuthenticatedRequest, checkAIUsageLimit, rateLimit } from "../middleware/auth";

const router = Router();

// 应用认证和AI使用限制中间件
router.use(authenticateUser);
router.use(checkAIUsageLimit);
router.use(rateLimit(60000, 20)); // AI路由更严格的速率限制

/**
 * 生成冲刺计划
 */
router.post("/generate-plan", async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    const { prompt, type, template, preferences } = req.body;
    
    if (!prompt || !type || !template) {
      return res.status(400).json({
        success: false,
        error: "缺少必填参数"
      });
    }
    
    // 记录AI使用
    await incrementAIUsage(uid, "plan-generation");
    
    // 这里应该调用Gemini API生成计划
    // 目前返回模拟数据
    const generatedPlan = await generateSprintPlan(prompt, type, template, preferences);
    
    // 保存AI对话历史
    const conversationRef = admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("aiHistory")
      .doc();
    
    await conversationRef.set({
      id: conversationRef.id,
      userId: uid,
      type: "plan-generation",
      title: `${type}冲刺计划生成`,
      messages: [
        {
          id: "user-1",
          role: "user",
          content: prompt,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: JSON.stringify(generatedPlan),
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        }
      ],
      generatedPlan: {
        planData: generatedPlan
      },
      metadata: {
        model: "gemini-pro",
        totalTokens: 1000, // 模拟值
        cost: 0.01
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      success: true,
      data: {
        plan: generatedPlan,
        conversationId: conversationRef.id
      }
    });
  } catch (error) {
    console.error("Generate plan error:", error);
    res.status(500).json({
      success: false,
      error: "生成计划失败"
    });
  }
});

/**
 * AI聊天对话
 */
router.post("/chat", async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    const { message, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: "消息内容不能为空"
      });
    }
    
    // 记录AI使用
    await incrementAIUsage(uid, "chat");
    
    // 获取或创建对话
    let conversationRef;
    if (conversationId) {
      conversationRef = admin.firestore()
        .collection("users")
        .doc(uid)
        .collection("aiHistory")
        .doc(conversationId);
    } else {
      conversationRef = admin.firestore()
        .collection("users")
        .doc(uid)
        .collection("aiHistory")
        .doc();
    }
    
    // 这里应该调用Gemini API进行对话
    const aiResponse = await generateAIResponse(message);
    
    // 更新对话历史
    const conversationDoc = await conversationRef.get();
    const existingMessages = conversationDoc.exists ? conversationDoc.data()?.messages || [] : [];
    
    const newMessages = [
      ...existingMessages,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: aiResponse,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    await conversationRef.set({
      id: conversationRef.id,
      userId: uid,
      type: "chat",
      title: conversationDoc.exists ? conversationDoc.data()?.title : "AI对话",
      messages: newMessages,
      metadata: {
        model: "gemini-pro",
        totalTokens: (conversationDoc.data()?.metadata?.totalTokens || 0) + 500,
        cost: (conversationDoc.data()?.metadata?.cost || 0) + 0.005
      },
      createdAt: conversationDoc.exists ? conversationDoc.data()?.createdAt : admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    res.json({
      success: true,
      data: {
        response: aiResponse,
        conversationId: conversationRef.id
      }
    });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({
      success: false,
      error: "AI对话失败"
    });
  }
});

/**
 * 获取AI使用统计
 */
router.get("/usage", async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    const today = new Date().toISOString().split("T")[0];
    
    // 获取今日使用情况
    const todayUsageDoc = await admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("aiUsage")
      .doc(today)
      .get();
    
    // 获取用户类型
    const userDoc = await admin.firestore()
      .collection("users")
      .doc(uid)
      .get();
    
    const userData = userDoc.data();
    const userType = userData?.userType || "normal";
    
    const limits = {
      normal: 5,
      premium: 10,
      admin: -1
    };
    
    const todayUsage = todayUsageDoc.data();
    
    res.json({
      success: true,
      data: {
        today: {
          count: todayUsage?.count || 0,
          limit: limits[userType as keyof typeof limits],
          resetAt: todayUsage?.resetAt
        },
        userType,
        conversations: todayUsage?.conversations || []
      }
    });
  } catch (error) {
    console.error("Get AI usage error:", error);
    res.status(500).json({
      success: false,
      error: "获取AI使用统计失败"
    });
  }
});

/**
 * 获取对话历史
 */
router.get("/conversations", async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    const { limit = 20, offset = 0 } = req.query;
    
    const conversationsSnapshot = await admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("aiHistory")
      .orderBy("updatedAt", "desc")
      .limit(Number(limit))
      .offset(Number(offset))
      .get();
    
    const conversations = conversationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        title: data.title,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        messageCount: data.messages?.length || 0,
        hasGeneratedPlan: !!data.generatedPlan
      };
    });
    
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      error: "获取对话历史失败"
    });
  }
});

// 辅助函数

/**
 * 增加AI使用次数
 */
async function incrementAIUsage(userId: string, type: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const usageRef = admin.firestore()
    .collection("users")
    .doc(userId)
    .collection("aiUsage")
    .doc(today);
  
  await admin.firestore().runTransaction(async (transaction) => {
    const usageDoc = await transaction.get(usageRef);
    
    if (usageDoc.exists) {
      const currentData = usageDoc.data()!;
      transaction.update(usageRef, {
        count: (currentData.count || 0) + 1,
        conversations: admin.firestore.FieldValue.arrayUnion({
          id: `${Date.now()}`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          type,
          tokens: 500 // 模拟值
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      transaction.set(usageRef, {
        userId,
        date: today,
        count: 1,
        limit: 5, // 默认限制
        resetAt: tomorrow,
        conversations: [{
          id: `${Date.now()}`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          type,
          tokens: 500
        }],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
}

/**
 * 生成冲刺计划（模拟）
 */
async function generateSprintPlan(prompt: string, type: string, template: string, preferences: any): Promise<any> {
  // 这里应该调用Gemini API
  // 目前返回模拟数据
  return {
    sprintInfo: {
      title: `AI生成的${type}冲刺计划`,
      duration: parseInt(template.replace("days", "")),
      type,
      description: `基于您的需求"${prompt}"生成的冲刺计划`,
      difficulty: "intermediate"
    },
    phases: [
      {
        title: "准备阶段",
        description: "制定详细计划和准备工作",
        duration: 3,
        tasks: ["制定学习计划", "准备学习资料", "设置学习环境"]
      },
      {
        title: "执行阶段",
        description: "按计划执行学习任务",
        duration: 20,
        tasks: ["每日学习任务", "实践练习", "知识总结"]
      },
      {
        title: "总结阶段",
        description: "总结学习成果和经验",
        duration: 7,
        tasks: ["成果展示", "经验总结", "下一步规划"]
      }
    ],
    milestones: [
      {
        title: "完成基础学习",
        targetDate: 10,
        criteria: ["掌握基础概念", "完成基础练习"]
      },
      {
        title: "完成实践项目",
        targetDate: 25,
        criteria: ["完成项目开发", "通过测试"]
      }
    ],
    tips: [
      "保持每日学习习惯",
      "及时记录学习笔记",
      "定期回顾和调整计划"
    ]
  };
}

/**
 * 生成AI响应（模拟）
 */
async function generateAIResponse(message: string): Promise<string> {
  // 这里应该调用Gemini API
  // 目前返回模拟响应
  return `我理解您的问题："${message}"。作为您的冲刺管理助手，我建议您可以将这个目标分解为更小的可执行任务，并设定明确的时间节点。您希望我帮您制定一个详细的计划吗？`;
}

export { router as aiRoutes };
