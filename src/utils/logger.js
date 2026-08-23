export const logger = {
  info: (...args) => {
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_LOGS) {
      console.log('[INFO]', ...args);
    }
  },
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[DEBUG]', ...args);
    }
  }
};
export default logger;
