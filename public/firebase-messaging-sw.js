// Firebase Messaging Service Worker
// 处理后台推送通知

// 导入Firebase脚本
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase配置
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// 初始化Firebase
firebase.initializeApp(firebaseConfig);

// 获取messaging实例
const messaging = firebase.messaging();

// 处理后台消息
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 收到后台消息:', payload);

  const { notification, data } = payload;
  
  // 自定义通知选项
  const notificationTitle = notification?.title || '冲刺管理提醒';
  const notificationOptions = {
    body: notification?.body || '您有新的提醒',
    icon: notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    image: notification?.image,
    data: data || {},
    tag: data?.type || 'general',
    requireInteraction: data?.requireInteraction === 'true',
    actions: getNotificationActions(data?.type),
    timestamp: Date.now()
  };

  // 显示通知
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 处理通知点击事件
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] 通知被点击:', event);
  
  const { notification, action } = event;
  const data = notification.data || {};
  
  // 关闭通知
  notification.close();
  
  // 处理不同的操作
  switch (action) {
    case 'view':
      handleViewAction(data);
      break;
    case 'complete':
      handleCompleteAction(data);
      break;
    case 'snooze':
      handleSnoozeAction(data);
      break;
    case 'dismiss':
    default:
      // 默认操作：打开应用
      handleDefaultAction(data);
      break;
  }
});

// 处理查看操作
function handleViewAction(data) {
  const url = getTargetUrl(data);
  
  // 打开或聚焦到应用窗口
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 查找已打开的应用窗口
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (url !== '/') {
            client.navigate(url);
          }
          return;
        }
      }
      
      // 如果没有打开的窗口，创建新窗口
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
}

// 处理完成操作
function handleCompleteAction(data) {
  // 发送消息到客户端处理任务完成
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          client.postMessage({
            type: 'COMPLETE_TASK',
            taskId: data.taskId,
            sprintId: data.sprintId
          });
          break;
        }
      }
    })
  );
}

// 处理延迟操作
function handleSnoozeAction(data) {
  // 延迟15分钟后重新提醒
  const snoozeTime = 15 * 60 * 1000; // 15分钟
  
  setTimeout(() => {
    self.registration.showNotification('延迟提醒', {
      body: data.originalBody || '您之前延迟的提醒',
      icon: '/icons/icon-192x192.png',
      data: data,
      tag: data.type + '_snoozed'
    });
  }, snoozeTime);
}

// 处理默认操作
function handleDefaultAction(data) {
  const url = getTargetUrl(data);
  
  event.waitUntil(
    clients.openWindow(url)
  );
}

// 根据通知类型获取目标URL
function getTargetUrl(data) {
  const baseUrl = self.location.origin;
  
  switch (data.type) {
    case 'daily_reminder':
      return `${baseUrl}/today`;
    case 'deadline_warning':
    case 'task_overdue':
      return `${baseUrl}/sprints/${data.sprintId}`;
    case 'milestone_achieved':
      return `${baseUrl}/sprints/${data.sprintId}#milestones`;
    case 'sprint_completed':
      return `${baseUrl}/sprints/${data.sprintId}/summary`;
    case 'achievement_unlocked':
      return `${baseUrl}/profile/achievements`;
    default:
      return baseUrl;
  }
}

// 根据通知类型获取操作按钮
function getNotificationActions(type) {
  const commonActions = [
    { action: 'view', title: '查看' },
    { action: 'dismiss', title: '忽略' }
  ];
  
  switch (type) {
    case 'daily_reminder':
      return [
        { action: 'view', title: '开始冲刺' },
        { action: 'snooze', title: '稍后提醒' },
        { action: 'dismiss', title: '忽略' }
      ];
    case 'deadline_warning':
    case 'task_overdue':
      return [
        { action: 'view', title: '查看任务' },
        { action: 'complete', title: '标记完成' },
        { action: 'dismiss', title: '忽略' }
      ];
    case 'milestone_achieved':
    case 'sprint_completed':
    case 'achievement_unlocked':
      return [
        { action: 'view', title: '查看详情' },
        { action: 'dismiss', title: '知道了' }
      ];
    default:
      return commonActions;
  }
}

// 处理推送订阅变化
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[firebase-messaging-sw.js] 推送订阅发生变化:', event);
  
  // 重新订阅推送
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'your-vapid-public-key' // 这里应该是实际的VAPID公钥
      )
    }).then((subscription) => {
      console.log('[firebase-messaging-sw.js] 重新订阅成功:', subscription);
      
      // 发送新的订阅信息到服务器
      return fetch('/api/notifications/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription,
          oldSubscription: event.oldSubscription
        })
      });
    })
  );
});

// VAPID密钥转换工具函数
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 处理Service Worker安装
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker 安装');
  self.skipWaiting();
});

// 处理Service Worker激活
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker 激活');
  event.waitUntil(self.clients.claim());
});

// 处理来自客户端的消息
self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw.js] 收到客户端消息:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
