import { io } from 'socket.io-client';

/**
 * Socket.IO 客户端管理器
 * 用于实时通知推送
 */
class SocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.userId = null;
    this.listeners = new Map();
  }

  /**
   * 清理当前 socket 实例，避免 disconnect 后旧连接事件仍触发
   */
  _teardownSocket() {
    if (!this.socket) return;
    const socket = this.socket;
    this.socket = null;
    this.connected = false;
    socket.removeAllListeners();
    socket.disconnect();
  }

  /**
   * 连接到 Socket.IO 服务器
   * @param {String} userId - 用户ID
   */
  connect(userId) {
    if (!userId) return;

    this.userId = userId;

    if (this.socket?.connected) {
      this.socket.emit('register', userId);
      return;
    }

    this._teardownSocket();

    const serverUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3001';
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket = socket;

    socket.on('connect', () => {
      if (this.socket !== socket) return;

      this.connected = true;
      const socketId = socket.id;
      if (socketId) {
        console.log('✅ Socket.IO 连接成功:', socketId);
      }

      if (this.userId) {
        socket.emit('register', this.userId);
        console.log('📝 注册用户ID:', this.userId);
      }
    });

    socket.on('disconnect', (reason) => {
      if (this.socket !== socket) return;
      console.log('❌ Socket.IO 断开连接:', reason);
      this.connected = false;
    });

    socket.on('connect_error', (error) => {
      if (this.socket !== socket) return;
      console.error('Socket.IO 连接错误:', error);
    });

    socket.on('reconnect', (attemptNumber) => {
      if (this.socket !== socket) return;
      console.log('🔄 Socket.IO 重新连接成功，尝试次数:', attemptNumber);
      if (this.userId) {
        socket.emit('register', this.userId);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.userId = null;
    this._teardownSocket();
    this.listeners.clear();
    console.log('Socket.IO 已断开');
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
    if (!this.socket?.connected) {
      console.warn('Socket.IO 未连接，无法发送事件');
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * 检查连接状态
   */
  isConnected() {
    return Boolean(this.socket?.connected && this.connected);
  }
}

export default new SocketClient();
