/**
 * Database Models and Helper Functions
 * Provides type-safe database operations
 */

class GuildConfigModel {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.type = 'config';
    }

    /**
     * Get guild configuration
     * @param {string} guildId - Guild ID
     * @returns {Promise<Object>} Guild configuration
     */
    async get(guildId) {
        if (!guildId) return null;
        return await this.dbManager.get(this.type, `guild_${guildId}`);
    }

    /**
     * Set guild configuration
     * @param {string} guildId - Guild ID
     * @param {Object} config - Configuration object
     * @returns {Promise<boolean>} Success status
     */
    async set(guildId, config) {
        if (!guildId || !config) return false;
        return await this.dbManager.set(this.type, `guild_${guildId}`, config);
    }

    /**
     * Delete guild configuration
     * @param {string} guildId - Guild ID
     * @returns {Promise<boolean>} Success status
     */
    async delete(guildId) {
        if (!guildId) return false;
        return await this.dbManager.delete(this.type, `guild_${guildId}`);
    }
}

class StrikesModel {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.type = 'strikes';
    }

    /**
     * Get user strikes
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Promise<number>} Number of strikes
     */
    async get(guildId, userId) {
        if (!guildId || !userId) return 0;
        
        const strikes = await this.dbManager.get(this.type, `${guildId}_${userId}`);
        return typeof strikes === 'number' ? strikes : 0;
    }

    /**
     * Set user strikes
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @param {number} strikes - Number of strikes
     * @returns {Promise<boolean>} Success status
     */
    async set(guildId, userId, strikes) {
        if (!guildId || !userId || typeof strikes !== 'number') return false;
        return await this.dbManager.set(this.type, `${guildId}_${userId}`, strikes);
    }

    /**
     * Add a strike to user
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Promise<number>} New strike count
     */
    async add(guildId, userId) {
        const current = await this.get(guildId, userId);
        const newCount = current + 1;
        await this.set(guildId, userId, newCount);
        return newCount;
    }

    /**
     * Reset user strikes
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async reset(guildId, userId) {
        return await this.set(guildId, userId, 0);
    }
}

class HistoryModel {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.type = 'history';
        this.maxHistorySize = 20;
    }

    /**
     * Get user message history
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Message history
     */
    async get(guildId, userId) {
        if (!guildId || !userId) return [];
        
        const history = await this.dbManager.get(this.type, `${guildId}_${userId}`);
        return Array.isArray(history) ? history : [];
    }

    /**
     * Add message to history
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @param {Object} message - Message data
     * @returns {Promise<boolean>} Success status
     */
    async add(guildId, userId, message) {
        if (!guildId || !userId || !message) return false;
        
        let history = await this.get(guildId, userId);
        
        history.push({
            content: String(message.content || '').substring(0, 100),
            toxicity: typeof message.toxicity === 'number' ? message.toxicity : 0,
            timestamp: Date.now()
        });
        
        // Keep only last 20 messages
        if (history.length > this.maxHistorySize) {
            history = history.slice(-this.maxHistorySize);
        }
        
        return await this.dbManager.set(this.type, `${guildId}_${userId}`, history);
    }

    /**
     * Clear user history
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async clear(guildId, userId) {
        if (!guildId || !userId) return false;
        return await this.dbManager.delete(this.type, `${guildId}_${userId}`);
    }
}

class SpamStrikesModel {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.type = 'spam_strikes';
    }

    /**
     * Get spam strikes
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Promise<number>} Number of spam strikes
     */
    async get(guildId, userId) {
        if (!guildId || !userId) return 0;
        
        const strikes = await this.dbManager.get(this.type, `${guildId}_${userId}`);
        return typeof strikes === 'number' ? strikes : 0;
    }

    /**
     * Set spam strikes
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @param {number} strikes - Number of strikes
     * @returns {Promise<boolean>} Success status
     */
    async set(guildId, userId, strikes) {
        if (!guildId || !userId || typeof strikes !== 'number') return false;
        return await this.dbManager.set(this.type, `${guildId}_${userId}`, strikes);
    }

    /**
     * Add a spam strike
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Promise<number>} New strike count
     */
    async add(guildId, userId) {
        const current = await this.get(guildId, userId);
        const newCount = current + 1;
        await this.set(guildId, userId, newCount);
        return newCount;
    }

    /**
     * Reset spam strikes
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async reset(guildId, userId) {
        return await this.set(guildId, userId, 0);
    }
}

class MentionStrikesModel {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.type = 'mention_strikes';
    }

    /**
     * Get mention spam strikes
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Promise<number>} Number of mention strikes
     */
    async get(guildId, userId) {
        if (!guildId || !userId) return 0;
        
        const strikes = await this.dbManager.get(this.type, `${guildId}_${userId}`);
        return typeof strikes === 'number' ? strikes : 0;
    }

    /**
     * Set mention spam strikes
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @param {number} strikes - Number of strikes
     * @returns {Promise<boolean>} Success status
     */
    async set(guildId, userId, strikes) {
        if (!guildId || !userId || typeof strikes !== 'number') return false;
        return await this.dbManager.set(this.type, `${guildId}_${userId}`, strikes);
    }

    /**
     * Add a mention strike
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Promise<number>} New strike count
     */
    async add(guildId, userId) {
        const current = await this.get(guildId, userId);
        const newCount = current + 1;
        await this.set(guildId, userId, newCount);
        return newCount;
    }

    /**
     * Reset mention strikes
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async reset(guildId, userId) {
        return await this.set(guildId, userId, 0);
    }
}

class StatsModel {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.type = 'stats';
    }

    /**
     * Get a stat value
     * @param {string} statName - Stat name
     * @returns {Promise<number>} Stat value
     */
    async get(statName) {
        if (!statName) return 0;
        
        const value = await this.dbManager.get(this.type, statName);
        return typeof value === 'number' ? value : 0;
    }

    /**
     * Set a stat value
     * @param {string} statName - Stat name
     * @param {number} value - Stat value
     * @returns {Promise<boolean>} Success status
     */
    async set(statName, value) {
        if (!statName || typeof value !== 'number') return false;
        return await this.dbManager.set(this.type, statName, value);
    }

    /**
     * Increment a stat
     * @param {string} statName - Stat name
     * @returns {Promise<number>} New value
     */
    async increment(statName) {
        const current = await this.get(statName);
        const newValue = current + 1;
        await this.set(statName, newValue);
        return newValue;
    }

    /**
     * Get all stats
     * @returns {Promise<Object>} All statistics
     */
    async getAll() {
        return {
            totalMessages: await this.get('totalMessages'),
            toxicDetections: await this.get('toxicDetections'),
            warningsIssued: await this.get('warningsIssued'),
            kicksIssued: await this.get('kicksIssued'),
            bansIssued: await this.get('bansIssued'),
            timeoutsIssued: await this.get('timeoutsIssued'),
            spamBlocked: await this.get('spamBlocked'),
            linksBlocked: await this.get('linksBlocked'),
            startTime: await this.get('startTime') || Date.now()
        };
    }

    /**
     * Initialize start time if not set
     * @returns {Promise<void>}
     */
    async initializeStartTime() {
        const startTime = await this.get('startTime');
        if (!startTime) {
            await this.set('startTime', Date.now());
        }
    }
}

class ErrorLogModel {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.type = 'errors';
        this.maxLogSize = 50;
    }

    /**
     * Get error log
     * @returns {Promise<Array>} Error log entries
     */
    async get() {
        const log = await this.dbManager.get(this.type, 'error_log');
        return Array.isArray(log) ? log : [];
    }

    /**
     * Add error to log
     * @param {Object} errorData - Error data
     * @returns {Promise<boolean>} Success status
     */
    async add(errorData) {
        if (!errorData) return false;
        
        let errorLog = await this.get();
        
        errorLog.push({
            context: errorData.context || 'Unknown',
            error: errorData.error || 'Unknown error',
            stack: errorData.stack ? String(errorData.stack).substring(0, 500) : null,
            timestamp: Date.now(),
            guild: errorData.guild || null,
            user: errorData.user || null
        });
        
        // Keep only last 50 errors
        if (errorLog.length > this.maxLogSize) {
            errorLog = errorLog.slice(-this.maxLogSize);
        }
        
        return await this.dbManager.set(this.type, 'error_log', errorLog);
    }

    /**
     * Clear error log
     * @returns {Promise<boolean>} Success status
     */
    async clear() {
        return await this.dbManager.set(this.type, 'error_log', []);
    }
}

class PhishingStrikesModel {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.type = 'phishing_strikes';
    }

    /**
     * Get phishing strikes
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Promise<number>} Number of phishing strikes
     */
    async get(guildId, userId) {
        if (!guildId || !userId) return 0;
        
        const strikes = await this.dbManager.get(this.type, `${guildId}_${userId}`);
        return typeof strikes === 'number' ? strikes : 0;
    }

    /**
     * Set phishing strikes
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @param {number} strikes - Number of strikes
     * @returns {Promise<boolean>} Success status
     */
    async set(guildId, userId, strikes) {
        if (!guildId || !userId || typeof strikes !== 'number') return false;
        return await this.dbManager.set(this.type, `${guildId}_${userId}`, strikes);
    }

    /**
     * Add a phishing strike
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Promise<number>} New strike count
     */
    async add(guildId, userId) {
        const current = await this.get(guildId, userId);
        const newCount = current + 1;
        await this.set(guildId, userId, newCount);
        return newCount;
    }

    /**
     * Reset phishing strikes
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async reset(guildId, userId) {
        return await this.set(guildId, userId, 0);
    }
}

/**
 * Database Models Factory
 * Creates model instances with a database manager
 */
class Models {
    constructor(dbManager) {
        this.guildConfig = new GuildConfigModel(dbManager);
        this.strikes = new StrikesModel(dbManager);
        this.history = new HistoryModel(dbManager);
        this.spamStrikes = new SpamStrikesModel(dbManager);
        this.mentionStrikes = new MentionStrikesModel(dbManager);
        this.phishingStrikes = new PhishingStrikesModel(dbManager);
        this.stats = new StatsModel(dbManager);
        this.errorLog = new ErrorLogModel(dbManager);
    }
}

module.exports = {
    GuildConfigModel,
    StrikesModel,
    HistoryModel,
    SpamStrikesModel,
    MentionStrikesModel,
    PhishingStrikesModel,
    StatsModel,
    ErrorLogModel,
    Models
}