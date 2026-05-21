import axios from "axios";
import { ElMessage, ElMessageBox } from "element-plus";
import router from "@/router";

const service = axios.create({
  baseURL: "http://localhost:3001",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json;charset=utf-8",
  },
});

let isRefreshing = false;

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("edu-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const userId = localStorage.getItem("edu-user-id");
    if (userId) {
      config.headers["x-user-id"] = userId;
    }
    
    return config;
  },
  (error) => {
    console.error("请求错误：", error);
    ElMessage.error("请求配置错误");
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response) => {
    const res = response.data;
    
    if (res.code && res.code !== 200) {
      switch (res.code) {
        case 401:
          handleUnauthorized(res.message);
          break;
        case 403:
          ElMessage.error(res.message || "没有权限访问");
          break;
        case 404:
          ElMessage.error(res.message || "请求的资源不存在");
          break;
        case 500:
          ElMessage.error(res.message || "服务器内部错误");
          break;
        default:
          ElMessage.error(res.message || "请求失败");
      }
      return Promise.reject(new Error(res.message || "请求失败"));
    }
    
    return response;
  },
  (error) => {
    console.error("响应错误：", error);
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          ElMessage.error(data.message || "请求参数错误");
          break;
        case 401:
          handleUnauthorized(data.message);
          break;
        case 403:
          ElMessage.error(data.message || "没有权限访问");
          break;
        case 404:
          ElMessage.error(data.message || "请求的资源不存在");
          break;
        case 413:
          ElMessage.error("上传文件过大，请压缩后重试");
          break;
        case 429:
          ElMessage.warning("请求过于频繁，请稍后再试");
          break;
        case 500:
          ElMessage.error(data.message || "服务器内部错误，请稍后重试");
          break;
        case 502:
          ElMessage.error("网关错误，请检查网络连接");
          break;
        case 503:
          ElMessage.error("服务暂时不可用，请稍后重试");
          break;
        default:
          ElMessage.error(data.message || `请求失败 (${status})`);
      }
    } else if (error.request) {
      if (error.code === 'ECONNABORTED') {
        ElMessage.error("请求超时，请检查网络连接");
      } else {
        ElMessage.error("网络错误，请检查后端服务是否启动");
      }
    } else {
      ElMessage.error(error.message || "请求配置错误");
    }
    
    return Promise.reject(error);
  }
);

function handleUnauthorized(message) {
  if (isRefreshing) {
    return;
  }
  
  isRefreshing = true;
  
  ElMessageBox.confirm(
    message || "登录已过期，请重新登录",
    "提示",
    {
      confirmButtonText: "重新登录",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(() => {
      localStorage.removeItem("edu-token");
      localStorage.removeItem("edu-user-id");
      localStorage.removeItem("edu-nickname");
      localStorage.removeItem("edu-avatar");
      
      router.push("/login");
    })
    .catch(() => {})
    .finally(() => {
      isRefreshing = false;
    });
}

export default service;

export const request = {
  get(url, params, config = {}) {
    return service.get(url, { params, ...config });
  },
  
  post(url, data, config = {}) {
    return service.post(url, data, config);
  },
  
  put(url, data, config = {}) {
    return service.put(url, data, config);
  },
  
  delete(url, config = {}) {
    return service.delete(url, config);
  },
  
  upload(url, formData, onProgress) {
    return service.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: onProgress,
    });
  },
};
