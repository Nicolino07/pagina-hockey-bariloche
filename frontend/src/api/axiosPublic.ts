// axiosPublic.ts
import axios from 'axios'
import config from './config/index'

const axiosPublic = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

if (config.app.isDev) {
  console.log(`🔧 AxiosPublic: ${config.api.baseURL}`)
}

export default axiosPublic