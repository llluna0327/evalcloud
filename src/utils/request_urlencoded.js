import axios from "axios";
import qs from "qs"; // 用于将对象序列化为 x-www-form-urlencoded 格式

// 创建 Axios 实例
const service = axios.create({
  baseURL: "https://frp-boy.com:63564", // 后端的接口地址  ip:port
  // baseURL:"http://127.0.0.1:4523/m1/7151321-6875261-default",
  timeout: 30000, // 请求超时时间
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem("token");
    // if (token) {
    //   config.headers = config.headers || {};
    //   config.headers.Authorization = token;
    // }
    // 设置 x-www-form-urlencoded 的 Content-Type
    // config.headers['Content-Type'] = 'application/x-www-form-urlencoded';

    // 如果请求数据存在，并且是以 JSON 格式传递，则将其转换为 x-www-form-urlencoded
    // if (config.method === 'post' || config.method === 'put') {
    //   config.data = qs.stringify(config.data);
    // }

    return config;
  },
  (error) => {
    // 请求错误时，返回错误
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 返回响应数据
    return response.data;
  },
  (error) => {
    // 处理响应错误
    return Promise.reject(error);
  }
);

export default service;
