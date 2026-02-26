// frontend/src/api/axiosPublic.ts
import axios from 'axios'
import config from './config/index'

const axiosPublic = axios.create({
  // Aseguramos que baseURL sea el origen de los datos
  baseURL: config.api.baseURL, 
  timeout: config.api.timeout,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

axiosPublic.interceptors.request.use(
  (configRequest) => {
    // 1. Aseguramos que la baseURL termine en /api/ (con barra)
    let bUrl = configRequest.baseURL || '';
    if (!bUrl.endsWith('/')) {
      bUrl += '/';
    }
    configRequest.baseURL = bUrl;

    // 2. Aseguramos que la URL del endpoint NO empiece con / 
    // (porque ya la pusimos en la baseURL)
    if (configRequest.url && configRequest.url.startsWith('/')) {
      configRequest.url = configRequest.url.substring(1);
    }

    // 3. Log para confirmar que la unión es perfecta
    console.log(`🚀 Petición final a: ${configRequest.baseURL}${configRequest.url}`);
    
    return configRequest;
  },
  (error) => Promise.reject(error)
);

export default axiosPublic;