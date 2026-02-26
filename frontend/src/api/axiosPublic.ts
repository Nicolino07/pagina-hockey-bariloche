// frontend/src/api/axiosPublic.ts
import axios from 'axios'
import config from './config/index' // Verifica que la ruta sea correcta (../ o ./)

const axiosPublic = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

// ============================================
// INTERCEPTOR PARA ARREGLAR RUTAS Y HTTPS
// ============================================
axiosPublic.interceptors.request.use(
  (configRequest) => {
    // Si la URL empieza con "/", se la quitamos para que Axios 
    // use la baseURL completa con el "/api" incluido.
    if (configRequest.url && configRequest.url.startsWith('/')) {
      configRequest.url = configRequest.url.substring(1);
    }
    
    // Log para depuración en producción (luego puedes quitarlo)
    if (import.meta.env.DEV) {
      console.log(`📡 AxiosPublic enviando a: ${configRequest.baseURL}/${configRequest.url}`);
    }
    
    return configRequest;
  },
  (error) => {
    return Promise.reject(error);
  }
);

if (config.app.isDev) {
  console.log(`🔧 AxiosPublic configurado: ${config.api.baseURL}`)
}

export default axiosPublic