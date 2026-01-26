// frontend/src/config/index.ts
export const config = {
  // ============ API ============
  api: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
    prefix: import.meta.env.VITE_API_PREFIX || '',
  },
  
  // ============ APP ============
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Hockey Bariloche',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    env: import.meta.env.VITE_APP_ENV || 'development',
    isDev: import.meta.env.VITE_APP_ENV === 'development',
    isProd: import.meta.env.VITE_APP_ENV === 'production',
  },
  
  // ============ FEATURES ============
  features: {
    debug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
    logging: import.meta.env.VITE_ENABLE_LOGGING === 'true',
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
    enableTour: import.meta.env.VITE_ENABLE_TOUR === 'true',
  },
  
  // ============ AUTH ============
  auth: {
    tokenRefreshThreshold: parseInt(import.meta.env.VITE_TOKEN_REFRESH_THRESHOLD || '5'), // minutos
    tokenCheckInterval: parseInt(import.meta.env.VITE_TOKEN_CHECK_INTERVAL || '60'), // segundos
  },
  
  // ============ UI/UX ============
  ui: {
    defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE || 'es',
    theme: import.meta.env.VITE_THEME || 'light',
    enableAnimations: import.meta.env.VITE_ENABLE_ANIMATIONS !== 'false',
  },
  
  // ============ ANALYTICS ============
  analytics: {
    googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID || '',
    sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
  },
}

// Log de configuración en desarrollo
if (config.app.isDev) {
  console.log('⚙️ Configuración cargada:', {
    api: config.api.baseURL,
    env: config.app.env,
    features: config.features.debug,
  })
}

export default config