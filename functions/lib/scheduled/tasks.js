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
exports.scheduledTasks = exports.hourlyTasks = exports.dailyTasks = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * 每日定时任务
 * 每天凌晨1点执行
 */
exports.dailyTasks = functions
    .region("asia-east1")
    .pubsub
    .schedule("0 1 * * *")
    .timeZone("Asia/Shanghai")
    .onRun(async (context) => {
    console.log("开始执行每日定时任务");
    try {
        // 重置AI使用次数
        await resetDailyAIUsage();
        // 更新用户连续天数
        await updateUserStreaks();
        // 检查过期的冲刺
        await checkExpiredSprints();
        // 发送每日提醒
        await sendDailyReminders();
        // 清理过期数据
        await cleanupExpiredData();
        console.log("每日定时任务执行完成");
    }
    catch (error) {
        console.error("每日定时任务执行失败:", error);
    }
});
/**
 * 每小时定时任务
 * 每小时执行一次
 */
exports.hourlyTasks = functions
    .region("asia-east1")
    .pubsub
    .schedule("0 * * * *")
    .timeZone("Asia/Shanghai")
    .onRun(async (context) => {
    console.log("开始执行每小时定时任务");
    try {
        // 检查即将到期的任务
        await checkUpcomingDeadlines();
        // 更新冲刺进度
        await updateSprintProgress();
        // 发送截止日期提醒
        await sendDeadlineReminders();
        console.log("每小时定时任务执行完成");
    }
    catch (error) {
        console.error("每小时定时任务执行失败:", error);
    }
});
/**
 * 重置每日AI使用次数
 */
async function resetDailyAIUsage() {
    console.log("开始重置AI使用次数");
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        // 获取所有用户
        const usersSnapshot = await admin.firestore()
            .collection("users")
            .get();
        const batch = admin.firestore().batch();
        let batchCount = 0;
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const userType = userData.userType || "normal";
            // 获取用户等级对应的限制
            const limits = {
                normal: 5,
                premium: 10,
                admin: -1
            };
            const limit = limits[userType];
            // 创建今日使用记录
            const today = new Date().toISOString().split("T")[0];
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const todayUsageRef = admin.firestore()
                .collection("users")
                .doc(userId)
                .collection("aiUsage")
                .doc(today);
            batch.set(todayUsageRef, {
                userId,
                date: today,
                count: 0,
                limit,
                resetAt: tomorrow,
                conversations: [],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            batchCount++;
            // 每500个操作提交一次批处理
            if (batchCount >= 500) {
                await batch.commit();
                batchCount = 0;
            }
        }
        // 提交剩余的操作
        if (batchCount > 0) {
            await batch.commit();
        }
        console.log("AI使用次数重置完成");
    }
    catch (error) {
        console.error("重置AI使用次数失败:", error);
        throw error;
    }
}
/**
 * 更新用户连续天数
 */
async function updateUserStreaks() {
    console.log("开始更新用户连续天数");
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // 获取所有用户的统计数据
        const statsSnapshot = await admin.firestore()
            .collectionGroup("stats")
            .where("userId", "!=", "")
            .get();
        const batch = admin.firestore().batch();
        let batchCount = 0;
        for (const statsDoc of statsSnapshot.docs) {
            const statsData = statsDoc.data();
            const userId = statsData.userId;
            if (!userId)
                continue;
            // 检查用户昨天是否有活动
            const hasYesterdayActivity = await checkUserActivity(userId, yesterday);
            let newStreakDays = statsData.streakDays || 0;
            let newLongestStreak = statsData.longestStreak || 0;
            if (hasYesterdayActivity) {
                // 有活动，增加连续天数
                newStreakDays++;
                if (newStreakDays > newLongestStreak) {
                    newLongestStreak = newStreakDays;
                }
            }
            else {
                // 没有活动，重置连续天数
                newStreakDays = 0;
            }
            batch.update(statsDoc.ref, {
                streakDays: newStreakDays,
                longestStreak: newLongestStreak,
                lastActiveDate: hasYesterdayActivity ? yesterday : statsData.lastActiveDate,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            batchCount++;
            if (batchCount >= 500) {
                await batch.commit();
                batchCount = 0;
            }
        }
        if (batchCount > 0) {
            await batch.commit();
        }
        console.log("用户连续天数更新完成");
    }
    catch (error) {
        console.error("更新用户连续天数失败:", error);
        throw error;
    }
}
/**
 * 检查用户活动
 */
async function checkUserActivity(userId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    // 检查是否有任务完成
    const completedTasksSnapshot = await admin.firestore()
        .collectionGroup("tasks")
        .where("userId", "==", userId)
        .where("completedAt", ">=", startOfDay)
        .where("completedAt", "<=", endOfDay)
        .limit(1)
        .get();
    if (!completedTasksSnapshot.empty) {
        return true;
    }
    // 检查是否有冲刺活动
    const sprintActivitySnapshot = await admin.firestore()
        .collection("users")
        .doc(userId)
        .collection("sprints")
        .where("updatedAt", ">=", startOfDay)
        .where("updatedAt", "<=", endOfDay)
        .limit(1)
        .get();
    return !sprintActivitySnapshot.empty;
}
/**
 * 检查过期的冲刺
 */
async function checkExpiredSprints() {
    console.log("开始检查过期的冲刺");
    try {
        const now = new Date();
        // 获取所有活跃的冲刺
        const activeSprintsSnapshot = await admin.firestore()
            .collectionGroup("sprints")
            .where("status", "==", "active")
            .where("endDate", "<", now)
            .get();
        const batch = admin.firestore().batch();
        let batchCount = 0;
        for (const sprintDoc of activeSprintsSnapshot.docs) {
            // 将过期的冲刺标记为已完成或已取消
            batch.update(sprintDoc.ref, {
                status: "completed", // 或者根据完成度决定是completed还是cancelled
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            batchCount++;
            if (batchCount >= 500) {
                await batch.commit();
                batchCount = 0;
            }
        }
        if (batchCount > 0) {
            await batch.commit();
        }
        console.log(`检查完成，处理了${activeSprintsSnapshot.size}个过期冲刺`);
    }
    catch (error) {
        console.error("检查过期冲刺失败:", error);
        throw error;
    }
}
/**
 * 发送每日提醒
 */
async function sendDailyReminders() {
    console.log("开始发送每日提醒");
    try {
        // 获取启用了每日提醒的用户
        const settingsSnapshot = await admin.firestore()
            .collectionGroup("settings")
            .where("notifications.dailyReminder", "==", true)
            .get();
        for (const settingsDoc of settingsSnapshot.docs) {
            const settingsData = settingsDoc.data();
            const userId = settingsData.userId;
            if (!userId)
                continue;
            // 这里应该发送推送通知
            // 由于需要FCM token，暂时只记录日志
            console.log(`应该向用户 ${userId} 发送每日提醒`);
        }
        console.log("每日提醒发送完成");
    }
    catch (error) {
        console.error("发送每日提醒失败:", error);
        throw error;
    }
}
/**
 * 清理过期数据
 */
async function cleanupExpiredData() {
    console.log("开始清理过期数据");
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // 清理30天前的AI使用记录
        const oldAIUsageSnapshot = await admin.firestore()
            .collectionGroup("aiUsage")
            .where("createdAt", "<", thirtyDaysAgo)
            .limit(500)
            .get();
        const batch = admin.firestore().batch();
        oldAIUsageSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        if (!oldAIUsageSnapshot.empty) {
            await batch.commit();
            console.log(`清理了${oldAIUsageSnapshot.size}条过期AI使用记录`);
        }
        console.log("过期数据清理完成");
    }
    catch (error) {
        console.error("清理过期数据失败:", error);
        throw error;
    }
}
/**
 * 检查即将到期的任务
 */
async function checkUpcomingDeadlines() {
    console.log("开始检查即将到期的任务");
    try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        // 获取明天到期的任务
        const upcomingTasksSnapshot = await admin.firestore()
            .collectionGroup("tasks")
            .where("status", "in", ["todo", "in-progress"])
            .where("dueDate", ">=", now)
            .where("dueDate", "<=", tomorrow)
            .get();
        console.log(`发现${upcomingTasksSnapshot.size}个即将到期的任务`);
        // 这里可以发送提醒通知
        for (const taskDoc of upcomingTasksSnapshot.docs) {
            const taskData = taskDoc.data();
            console.log(`任务 "${taskData.title}" 将在明天到期`);
        }
    }
    catch (error) {
        console.error("检查即将到期任务失败:", error);
        throw error;
    }
}
/**
 * 更新冲刺进度
 */
async function updateSprintProgress() {
    console.log("开始更新冲刺进度");
    try {
        // 获取所有活跃的冲刺
        const activeSprintsSnapshot = await admin.firestore()
            .collectionGroup("sprints")
            .where("status", "==", "active")
            .get();
        const batch = admin.firestore().batch();
        let batchCount = 0;
        for (const sprintDoc of activeSprintsSnapshot.docs) {
            const sprintData = sprintDoc.data();
            const sprintId = sprintDoc.id;
            const userId = sprintData.userId;
            if (!userId)
                continue;
            // 获取冲刺的任务
            const tasksSnapshot = await admin.firestore()
                .collection("users")
                .doc(userId)
                .collection("sprints")
                .doc(sprintId)
                .collection("tasks")
                .get();
            const tasks = tasksSnapshot.docs.map(doc => doc.data());
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(task => task.status === "completed").length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            // 更新冲刺进度
            batch.update(sprintDoc.ref, {
                progress,
                stats: {
                    totalTasks,
                    completedTasks,
                    totalTime: tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0),
                    actualTime: tasks.reduce((sum, task) => sum + (task.actualTime || 0), 0)
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            batchCount++;
            if (batchCount >= 500) {
                await batch.commit();
                batchCount = 0;
            }
        }
        if (batchCount > 0) {
            await batch.commit();
        }
        console.log(`更新了${activeSprintsSnapshot.size}个冲刺的进度`);
    }
    catch (error) {
        console.error("更新冲刺进度失败:", error);
        throw error;
    }
}
/**
 * 发送截止日期提醒
 */
async function sendDeadlineReminders() {
    console.log("开始发送截止日期提醒");
    try {
        // 这里应该实现截止日期提醒逻辑
        // 获取即将到期的任务和里程碑，发送推送通知
        console.log("截止日期提醒发送完成");
    }
    catch (error) {
        console.error("发送截止日期提醒失败:", error);
        throw error;
    }
}
exports.scheduledTasks = {
    dailyTasks: exports.dailyTasks,
    hourlyTasks: exports.hourlyTasks
};
//# sourceMappingURL=tasks.js.map