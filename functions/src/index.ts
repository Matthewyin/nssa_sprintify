import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import express from "express";

// 在开发环境中连接到模拟器 - 必须在初始化之前设置
if (process.env.FUNCTIONS_EMULATOR === 'true') {
  // 设置环境变量以使用Auth模拟器（使用新的端口配置）
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9098';
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081';
  console.log('Firebase Admin SDK configured for emulator environment');
}

// 初始化Firebase Admin SDK
admin.initializeApp();

// 创建Express应用
const app = express();

// 配置CORS
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://nssa-sprintify.web.app",
    "https://nssa-sprintify.firebaseapp.com",
    "https://nssa-sprintify--n8n-project-460516.us-central1.hosted.app",
    "https://sf.nssa.io",
    "https://sf.netc2c.com"
  ],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// 导入路由模块
import { authRoutes } from "./routes/auth";
import { sprintRoutes } from "./routes/sprints";
import { aiRoutes } from "./routes/ai";
import { statsRoutes } from "./routes/stats";
import { notificationRoutes } from "./routes/notifications";
import { userRoutes } from "./routes/users";
import { upgradeRequestRoutes } from "./routes/upgrade-requests";

// 导入定时任务
import { scheduledTasks } from "./scheduled/tasks";

// 注册路由
app.use("/auth", authRoutes);
app.use("/sprints", sprintRoutes);
app.use("/ai", aiRoutes);
app.use("/stats", statsRoutes);
app.use("/notifications", notificationRoutes);
app.use("/users", userRoutes);
app.use("/upgrade-requests", upgradeRequestRoutes);

// 健康检查端点
app.get("/health", (req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// 导出HTTP函数
export const api = functions.region("asia-east1").https.onRequest(app);

// 导出定时任务
export const dailyTasks = scheduledTasks.dailyTasks;
export const hourlyTasks = scheduledTasks.hourlyTasks;

// 导出触发器函数
// export { userTriggers } from "./triggers/user";
// export { sprintTriggers } from "./triggers/sprint";
// export { taskTriggers } from "./triggers/task";

// 导出实用工具函数
// export { utilityFunctions } from "./utils/functions";
