// Utilitaire de logging sécurisé pour l'application

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  // Logs de debug - uniquement en développement
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  // Logs d'information - uniquement en développement
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },

  // Logs d'avertissement - toujours visibles mais sans données sensibles
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  // Logs d'erreur - toujours visibles mais sans données sensibles
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },

  // Log d'API - uniquement en développement
  api: (endpoint: string, action: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[API] ${endpoint}: ${action}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },

  // Log de sécurité - toujours visible mais anonymisé
  security: (message: string, metadata?: any) => {
    console.warn('[SECURITY]', message, metadata ? { ...metadata, details: '[REDACTED]' } : '');
  }
};

// Fonction utilitaire pour anonymiser les données sensibles
export function sanitizeForLogs(data: any): any {
  if (!data) return data;
  
  const sensitiveFields = ['email', 'password', 'token', 'secret', 'key'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

export default logger;