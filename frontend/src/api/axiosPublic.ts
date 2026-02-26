// frontend/src/api/axiosPublic.ts
import axios from 'axios'
import config from './config/index'

const axiosPublic = axios.create({
  // Forzamos que la baseURL termine en /api/
  baseURL: config.api.baseURL.endsWith('/') 
    ? config.api.baseURL 
    : `${config.api.baseURL}/`,
  timeout: config.api.timeout,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

// Interceptor solo para LOGS (para ver la verdad en la consola)
axiosPublic.interceptors.request.use((req) => {
  // Axios une baseURL + url. Si url empieza con "/", ignora la baseURL.
  // Por eso es vital que los endpoints NO empiecen con "/"
  console.log(`📡 Enviando a: ${req.baseURL}${req.url}`);
  return req;
});

export default axiosPublic;