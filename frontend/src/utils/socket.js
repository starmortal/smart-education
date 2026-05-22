import { io } from 'socket.io-client';

/**
 * Socket.IO 客户端管理器
 * 用于实时通知推送
 */
class SocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  /**
   * 连接到 Socket.IO 服务器
   * @param {String} userId - 用户ID
   */
  connect(userId) {
    if (this.socket && this.connected) {
      console.log('Socket.IO 已连接，跳过重复连接');
      return;
    }

    const serverUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3001';
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO 连接成功:', this.socket.id);
      this.connected = true;
      
      // 注册用户ID
      if (userId) {
        this.socket.emit('register', userId);
        console.log('📝 注册用户ID:', userId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO 断开连接:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO 连接错误:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket.IO 重新连接成功，尝试次数:', attemptNumber);
      if (userId) {
        this.socket.emit('register', userId);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
      console.log('Socket.IO 已断开');
    }
  }

  /**
   * 监听事件
   * @param {String} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket.IO 未连接，无法监听事件');
      return;
    }

    this.socket.on(event, callback);
    
    // 保存监听器引用
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * 移除事件监听
   * @param {String} event - 事件名称
   * @param {Function} callback - 回调函数（可选）
   */
  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      
      // 从监听器列表中移除
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  /**
   * 发送事件
   * @param {String} event - 事件名称
   * @param {*} data - 数据
   */
  emit(event, data) {
    if (!this.socket || !this.connected) {
      console.warn('Socket.IO 未连接，无法发送事件');
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * 检查连接状态
   */
  isConnected() {
    return this.connected;
  }
}

// 导出单例
export default new SocketClient();
