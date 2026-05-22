const { Server } = require("socket.io");
const logger = require("./logger");

class SocketManager {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socketId 映射
  }

  /**
   * 初始化 Socket.IO 服务器
   * @param {Object} server - HTTP 服务器实例
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: ["http://localhost:8080", "http://localhost:8081", "http://127.0.0.1:8080"],
        credentials: true,
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
    });

    this.io.on("connection", (socket) => {
      logger.info(`Socket.IO 客户端连接: ${socket.id}`);

      // 用户身份验证和注册
      socket.on("register", (userId) => {
        if (userId) {
          this.userSockets.set(userId, socket.id);
          socket.userId = userId;
          logger.info(`用户 ${userId} 注册 Socket 连接: ${socket.id}`);
        }
      });

      // 断开连接
      socket.on("disconnect", () => {
        if (socket.userId) {
          this.userSockets.delete(socket.userId);
          logger.info(`用户 ${socket.userId} 断开 Socket 连接: ${socket.id}`);
        } else {
          logger.info(`Socket.IO 客户端断开连接: ${socket.id}`);
        }
      });
    });

    logger.info("Socket.IO 服务器初始化成功");
  }

  /**
   * 向指定用户发送通知
   * @param {String} userId - 用户ID
   * @param {String} event - 事件名称
   * @param {Object} data - 数据
   */
  emitToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId && this.io) {
      this.io.to(socketId).emit(event, data);
      logger.info(`向用户 ${userId} 发送事件 ${event}`);
      return true;
    }
    logger.warn(`用户 ${userId} 未连接，无法发送事件 ${event}`);
    return false;
  }

  /**
   * 向所有用户广播消息
   * @param {String} event - 事件名称
   * @param {Object} data - 数据
   */
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      logger.info(`广播事件 ${event}`);
    }
  }

  /**
   * 获取在线用户数量
   */
  getOnlineUserCount() {
    return this.userSockets.size;
  }

  /**
   * 检查用户是否在线
   * @param {String} userId - 用户ID
   */
  isUserOnline(userId) {
    return this.userSockets.has(userId);
  }
}

// 导出单例
module.exports = new SocketManager();
