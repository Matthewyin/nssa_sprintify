import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";
import * as express from "express";

// 初始化Firebase Admin SDK
admin.initializeApp();

// 创建Express应用
const app = express();

// 配置CORS
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://nssa-sprintify.web.app",
    "https://nssa-sprintify.firebaseapp.com"
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

// 导入定时任务
import { scheduledTasks } from "./scheduled/tasks";

// 注册路由
app.use("/auth", authRoutes);
app.use("/sprints", sprintRoutes);
app.use("/ai", aiRoutes);
app.use("/stats", statsRoutes);
app.use("/notifications", notificationRoutes);

// 健康检查端点
app.get("/health", (req, res) => {
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
export { userTriggers } from "./triggers/user";
export { sprintTriggers } from "./triggers/sprint";
export { taskTriggers } from "./triggers/task";

// 导出实用工具函数
export { utilityFunctions } from "./utils/functions";
