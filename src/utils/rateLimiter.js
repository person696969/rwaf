const env = require('../config/environment');

class AdvancedRateLimiter {
    constructor() {
        this.globalLimit = env.globalRateLimit;
        this.perGuildLimit = env.perGuildRateLimit;
        this.perUserLimit = env.perUserRateLimit;
        this.window = 60000;
        
        this.globalTracker = [];
        this.guildTrackers = new Map();
        this.userTrackers = new Map();
    }

    checkGlobal() {
        const now = Date.now();
        this.globalTracker = this.globalTracker.filter(time => now - time < this.window);
        
        if (this.globalTracker.length >= this.globalLimit) {
            return {
                limited: true,
                timeUntilReset: Math.ceil((this.window - (now - this.globalTracker[0])) / 1000),
                type: 'global'
            };
        }
        
        this.globalTracker.push(now);
        return { limited: false };
    }

    checkGuild(guildId, customLimit = null) {
        const now = Date.now();
        const limit = customLimit || this.perGuildLimit;
        
        if (!this.guildTrackers.has(guildId)) {
            this.guildTrackers.set(guildId, []);
        }
        
        let tracker = this.guildTrackers.get(guildId);
        tracker = tracker.filter(time => now - time < this.window);
        this.guildTrackers.set(guildId, tracker);
        
        if (tracker.length >= limit) {
            return {
                limited: true,
                timeUntilReset: Math.ceil((this.window - (now - tracker[0])) / 1000),
                type: 'guild'
            };
        }
        
        tracker.push(now);
        return { limited: false };
    }

    checkUser(userId) {
        const now = Date.now();
        
        if (!this.userTrackers.has(userId)) {
            this.userTrackers.set(userId, []);
        }
        
        let tracker = this.userTrackers.get(userId);
        tracker = tracker.filter(time => now - time < this.window);
        this.userTrackers.set(userId, tracker);
        
        if (tracker.length >= this.perUserLimit) {
            return {
                limited: true,
                timeUntilReset: Math.ceil((this.window - (now - tracker[0])) / 1000),
                type: 'user'
            };
        }
        
        tracker.push(now);
        return { limited: false };
    }

    cleanup() {
        const now = Date.now();
        this.globalTracker = this.globalTracker.filter(time => now - time < this.window);
        
        for (const [guildId, tracker] of this.guildTrackers.entries()) {
            const filtered = tracker.filter(time => now - time < this.window);
            if (filtered.length === 0) this.guildTrackers.delete(guildId);
            else this.guildTrackers.set(guildId, filtered);
        }
        
        for (const [userId, tracker] of this.userTrackers.entries()) {
            const filtered = tracker.filter(time => now - time < this.window);
            if (filtered.length === 0) this.userTrackers.delete(userId);
            else this.userTrackers.set(userId, filtered);
        }
    }
}

module.exports = AdvancedRateLimiter;