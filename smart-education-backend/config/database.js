const { Sequelize } = require('sequelize');
require('dotenv').config();

// 创建Sequelize实例
const sequelize = new Sequelize(
  process.env.DB_NAME || 'smart_education',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // 生产环境设为false，开发环境可设为console.log
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+08:00', // 东八区时区
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true, // 不自动复数化表名
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
);

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ MySQL数据库连接失败:', error.message);
    console.error('请检查以下配置：');
    console.error('- DB_HOST:', process.env.DB_HOST || 'localhost');
    console.error('- DB_PORT:', process.env.DB_PORT || 3306);
    console.error('- DB_NAME:', process.env.DB_NAME || 'smart_education');
    console.error('- DB_USER:', process.env.DB_USER || 'root');
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection
};
