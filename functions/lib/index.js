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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hourlyTasks = exports.dailyTasks = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
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
const app = (0, express_1.default)();
// 配置CORS
const corsOptions = {
    origin: [
        "http://localhost:3000",
        "https://nssa-sprintify.web.app",
        "https://nssa-sprintify.firebaseapp.com",
        "https://nssa-sprintify--n8n-project-460516.us-central1.hosted.app",
        "https://sf.nssa.io"
    ],
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// 导入路由模块
const auth_1 = require("./routes/auth");
const sprints_1 = require("./routes/sprints");
const ai_1 = require("./routes/ai");
const stats_1 = require("./routes/stats");
const notifications_1 = require("./routes/notifications");
const users_1 = require("./routes/users");
const upgrade_requests_1 = require("./routes/upgrade-requests");
// 导入定时任务
const tasks_1 = require("./scheduled/tasks");
// 注册路由
app.use("/auth", auth_1.authRoutes);
app.use("/sprints", sprints_1.sprintRoutes);
app.use("/ai", ai_1.aiRoutes);
app.use("/stats", stats_1.statsRoutes);
app.use("/notifications", notifications_1.notificationRoutes);
app.use("/users", users_1.userRoutes);
app.use("/upgrade-requests", upgrade_requests_1.upgradeRequestRoutes);
// 健康检查端点
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
});
// 导出HTTP函数
exports.api = functions.region("asia-east1").https.onRequest(app);
// 导出定时任务
exports.dailyTasks = tasks_1.scheduledTasks.dailyTasks;
exports.hourlyTasks = tasks_1.scheduledTasks.hourlyTasks;
// 导出触发器函数
// export { userTriggers } from "./triggers/user";
// export { sprintTriggers } from "./triggers/sprint";
// export { taskTriggers } from "./triggers/task";
// 导出实用工具函数
// export { utilityFunctions } from "./utils/functions";
//# sourceMappingURL=index.js.map