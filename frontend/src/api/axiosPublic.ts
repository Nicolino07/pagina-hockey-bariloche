// frontend/src/api/axiosPublic.ts
import axios from 'axios';
import config from './config/index';

const axiosPublic = axios.create({
  // Importante: baseURL debe ser "https://hockeybariloche.com.ar/api" (sin barra al final)
  baseURL: config.api.baseURL.endsWith('/') 
    ? config.api.baseURL.slice(0, -1) 
    : config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Interceptor solo para monitorear y debuguear
axiosPublic.interceptors.request.use(
  (configRequest) => {
    // Verificamos que el endpoint empiece con /
    if (configRequest.url && !configRequest.url.startsWith('/')) {
      configRequest.url = '/' + configRequest.url;
    }

    // Este log te mostrará la URL exacta que sale hacia el servidor
    console.log(`🚀 Request a: ${configRequest.baseURL}${configRequest.url}`);
    
    return configRequest;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosPublic;