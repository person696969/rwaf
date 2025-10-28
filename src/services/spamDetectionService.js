const { TIME_WINDOWS } = require('../config/constants');

class SpamDetectionService {
    constructor() {
        this.messageTracker = new Map();
        this.botMessageTracker = new Map();
        this.botMessageLimit = 10;
        this.botMessageWindow = TIME_WINDOWS.BOT_MESSAGE;
    }

    checkUserSpam(guildId, userId, config) {
        if (!guildId || !userId) return false;
        
        try {
            const key = `${guildId}_${userId}`;
            const now = Date.now();
            
            if (!this.messageTracker.has(key)) {
                this.messageTracker.set(key, []);
            }
            
            let messages = this.messageTracker.get(key);
            messages = messages.filter(time => now - time < config.spamTimeWindow);
            
            if (messages.length >= config.spamMaxMessages) {
                return true;
            }
            
            messages.push(now);
            this.messageTracker.set(key, messages);
            return false;
        } catch (error) {
            console.error('Error checking spam:', error);
            return false;
        }
    }

    checkBotMessageSpam(channelId) {
        if (!channelId) return false;
        
        try {
            const now = Date.now();
            const key = `bot_msg_${channelId}`;
            
            let messages = this.botMessageTracker.get(key) || [];
            messages = messages.filter(time => now - time < this.botMessageWindow);
            
            if (messages.length >= this.botMessageLimit) {
                console.error(`🚨 BOT SPAM PREVENTION: Too many messages in channel ${channelId}`);
                return true;
            }
            
            messages.push(now);
            this.botMessageTracker.set(key, messages);
            return false;
        } catch (error) {
            console.error('Error checking bot message spam:', error);
            return true;
        }
    }

    cleanup() {
        const now = Date.now();
        
        for (const [key, messages] of this.messageTracker.entries()) {
            const filtered = messages.filter(time => now - time < 10000);
            if (filtered.length === 0) {
                this.messageTracker.delete(key);
            } else {
                this.messageTracker.set(key, filtered);
            }
        }
        
        for (const [key, messages] of this.botMessageTracker.entries()) {
            const filtered = messages.filter(time => now - time < this.botMessageWindow);
            if (filtered.length === 0) {
                this.botMessageTracker.delete(key);
            } else {
                this.botMessageTracker.set(key, filtered);
            }
        }
    }
}

module.exports = SpamDetectionService;