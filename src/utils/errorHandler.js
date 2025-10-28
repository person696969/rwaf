const env = require('../config/environment');

class ErrorHandler {
    constructor() {
        this.errorCount = 0;
        this.lastReset = Date.now();
        this.maxErrors = env.maxErrors;
        this.resetWindow = 60000;
    }

    track() {
        const now = Date.now();
        
        if (now - this.lastReset > this.resetWindow) {
            this.errorCount = 0;
            this.lastReset = now;
        }
        
        this.errorCount++;
        
        if (this.errorCount > this.maxErrors) {
            console.error('🚨 CRITICAL: Too many errors! Shutting down...');
            return true; // Signal shutdown
        }
        
        return false;
    }

    async logError(dbManager, error, context, message = null) {
        console.error(`❌ Error in ${context}:`, error);
        
        if (this.track()) {
            process.exit(1);
        }
        
        try {
            const errorLog = await dbManager.get('errors', 'error_log') || [];
            errorLog.push({
                context,
                error: error.message || 'Unknown error',
                stack: error.stack ? error.stack.substring(0, 500) : null,
                timestamp: Date.now(),
                guild: message?.guild?.id || null,
                user: message?.author?.id || null
            });
            
            if (errorLog.length > 50) {
                errorLog.shift();
            }
            
            await dbManager.set('errors', 'error_log', errorLog);
        } catch (handlerError) {
            console.error('Error in error handler:', handlerError);
        }
    }
}

module.exports = ErrorHandler;