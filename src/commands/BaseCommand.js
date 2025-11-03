class BaseCommand {
    constructor(bot) {
        this.bot = bot;
        this.name = '';
        this.description = '';
        this.usage = '';
        this.aliases = [];
        this.ownerOnly = false;
        this.adminOnly = false;
        this.requiredPermission = null;
    }

    async execute(message, args) {
        throw new Error('Execute method must be implemented');
    }

    async getConfig(guildId) {
        return await this.bot.dbManager.get('config', `guild_${guildId}`) || 
               require('../config/defaultConfig');
    }

    async saveConfig(guildId, config) {
        await this.bot.dbManager.set('config', `guild_${guildId}`, config);
    }

    async incrementStat(statName) {
        try {
            const current = await this.bot.dbManager.get('stats', statName) || 0;
            await this.bot.dbManager.set('stats', statName, current + 1);
        } catch (error) {
            console.error('Error incrementing stat:', error);
        }
    }

    async getStats() {
        try {
            return {
                totalMessages: await this.bot.dbManager.get('stats', 'totalMessages') || 0,
                toxicDetections: await this.bot.dbManager.get('stats', 'toxicDetections') || 0,
                warningsIssued: await this.bot.dbManager.get('stats', 'warningsIssued') || 0,
                kicksIssued: await this.bot.dbManager.get('stats', 'kicksIssued') || 0,
                bansIssued: await this.bot.dbManager.get('stats', 'bansIssued') || 0,
                timeoutsIssued: await this.bot.dbManager.get('stats', 'timeoutsIssued') || 0,
                spamBlocked: await this.bot.dbManager.get('stats', 'spamBlocked') || 0,
                linksBlocked: await this.bot.dbManager.get('stats', 'linksBlocked') || 0,
                startTime: await this.bot.dbManager.get('stats', 'startTime') || Date.now()
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return null;
        }
    }
}

module.exports = BaseCommand;
