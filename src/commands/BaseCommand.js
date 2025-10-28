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
}

module.exports = BaseCommand;