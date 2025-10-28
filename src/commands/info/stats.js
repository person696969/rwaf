const BaseCommand = require('../BaseCommand');
const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

class StatsCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'stats';
        this.description = 'View bot statistics';
        this.usage = 'n!stats';
    }

    async execute(message, args) {
        const stats = await this.getStats();
        
        if (!stats) {
            const EmbedHelper = require('../../utils/embedBuilder');
            return message.reply({ embeds: [EmbedHelper.error('❌ Error', 'Could not retrieve statistics.')] }).catch(() => {});
        }
        
        const uptime = Date.now() - stats.startTime;
        const uptimeHours = Math.floor(uptime / 3600000);
        const uptimeMinutes = Math.floor((uptime % 3600000) / 60000);
        const uptimeDays = Math.floor(uptimeHours / 24);
        
        const detectionRate = stats.totalMessages > 0 
            ? ((stats.toxicDetections / stats.totalMessages) * 100).toFixed(2)
            : '0.00';
        
        const statsEmbed = new EmbedBuilder()
            .setTitle('📊 Bot Statistics')
            .setColor(COLORS.DARK_NAVY)
            .setDescription('**System Performance & Usage Statistics**')
            .addFields(
                { 
                    name: '🖥️ Server Info', 
                    value: `**Total Servers:** ${this.bot.client.guilds.cache.size}\n**Total Users:** ${this.bot.client.users.cache.size}`, 
                    inline: true 
                },
                { 
                    name: '📈 Detection Stats', 
                    value: `**Messages Analyzed:** ${stats.totalMessages.toLocaleString()}\n**Toxic Detected:** ${stats.toxicDetections.toLocaleString()}\n**Detection Rate:** ${detectionRate}%`, 
                    inline: true 
                },
                { 
                    name: '⚡ Moderation Actions', 
                    value: `**Warnings:** ${stats.warningsIssued.toLocaleString()}\n**Kicks:** ${stats.kicksIssued.toLocaleString()}\n**Bans:** ${stats.bansIssued.toLocaleString()}\n**Timeouts:** ${stats.timeoutsIssued.toLocaleString()}`, 
                    inline: true 
                },
                { 
                    name: '🛡️ Protection Stats', 
                    value: `**Spam Blocked:** ${stats.spamBlocked.toLocaleString()}\n**Links Blocked:** ${stats.linksBlocked.toLocaleString()}`, 
                    inline: true 
                },
                { 
                    name: '⏱️ Uptime', 
                    value: `**Total:** ${uptimeDays}d ${uptimeHours % 24}h ${uptimeMinutes}m\n**Ping:** ${this.bot.client.ws.ping}ms\n**Status:** ${this.bot.maintenanceMode ? '🔧 Maintenance' : '✅ Online'}`, 
                    inline: true 
                }
            )
            .setFooter({ text: 'Powered by NeoBot' })
            .setTimestamp();
            
        if (this.bot.client.user.displayAvatarURL()) {
            statsEmbed.setThumbnail(this.bot.client.user.displayAvatarURL());
        }
        
        await message.reply({ embeds: [statsEmbed] }).catch(() => {});
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

module.exports = StatsCommand;