const BaseCommand = require('../BaseCommand');
const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

class DevStatsCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'devstats';
        this.description = 'Detailed developer statistics';
        this.ownerOnly = true;
    }

    async execute(message, args) {
        // This is triggered via button, but can also be command
        await this.executeInteraction({ 
            editReply: async (data) => message.reply(data),
            deferReply: async () => {}
        });
    }

    async executeInteraction(interaction) {
        const stats = await this.getDetailedStats();
        
        const embed = new EmbedBuilder()
            .setTitle('📊 Detailed Developer Statistics')
            .setColor(COLORS.GOLD)
            .setDescription('**Comprehensive bot performance metrics**')
            .addFields(
                { 
                    name: '🔢 Message Processing', 
                    value: `**Total Processed:** ${stats.totalMessages.toLocaleString()}\n**Toxic Found:** ${stats.toxicDetections.toLocaleString()}\n**False Positives:** ~${stats.estimatedFalsePositives}\n**Accuracy:** ${stats.accuracy}%`, 
                    inline: true 
                },
                { 
                    name: '⚡ Actions Taken', 
                    value: `**Warnings:** ${stats.warningsIssued.toLocaleString()}\n**Kicks:** ${stats.kicksIssued.toLocaleString()}\n**Bans:** ${stats.bansIssued.toLocaleString()}\n**Timeouts:** ${stats.timeoutsIssued.toLocaleString()}\n**Total:** ${stats.totalActions.toLocaleString()}`, 
                    inline: true 
                },
                { 
                    name: '💾 Memory Usage', 
                    value: `**Heap Used:** ${stats.heapUsed} MB\n**Heap Total:** ${stats.heapTotal} MB\n**External:** ${stats.external} MB\n**RSS:** ${stats.rss} MB`, 
                    inline: true 
                },
                { 
                    name: '⏱️ Performance', 
                    value: `**Uptime:** ${stats.uptime}\n**Ping:** ${this.bot.client.ws.ping}ms\n**Maintenance:** ${this.bot.maintenanceMode ? '🔴 ON' : '🟢 OFF'}\n**CPU Usage:** ${stats.cpuUsage}%`, 
                    inline: true 
                },
                {
                    name: '🌐 Network Stats',
                    value: `**API Calls:** ${stats.apiCalls.toLocaleString()}\n**Rate Limits Hit:** ${stats.rateLimitHits}\n**Failed Requests:** ${stats.failedRequests}\n**Avg Response:** ${stats.avgResponseTime}ms`,
                    inline: true
                },
                {
                    name: '📈 Detection Breakdown',
                    value: `**Profanity:** ${stats.profanityDetected}\n**Threats:** ${stats.threatsDetected}\n**Spam:** ${stats.spamBlocked}\n**Links:** ${stats.linksBlocked}\n**Multi-line:** ${stats.multiLineDetected}`,
                    inline: true
                }
            )
            .setFooter({ text: 'Powered by NeoBot | Owner Only' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }

    async getDetailedStats() {
        const memUsage = process.memoryUsage();
        const totalMessages = await this.bot.dbManager.get('stats', 'totalMessages') || 0;
        const toxicDetections = await this.bot.dbManager.get('stats', 'toxicDetections') || 0;
        const warningsIssued = await this.bot.dbManager.get('stats', 'warningsIssued') || 0;
        const kicksIssued = await this.bot.dbManager.get('stats', 'kicksIssued') || 0;
        const bansIssued = await this.bot.dbManager.get('stats', 'bansIssued') || 0;
        const timeoutsIssued = await this.bot.dbManager.get('stats', 'timeoutsIssued') || 0;
        const spamBlocked = await this.bot.dbManager.get('stats', 'spamBlocked') || 0;
        const linksBlocked = await this.bot.dbManager.get('stats', 'linksBlocked') || 0;
        const profanityDetected = await this.bot.dbManager.get('stats', 'profanityDetected') || 0;
        const threatsDetected = await this.bot.dbManager.get('stats', 'threatsDetected') || 0;
        const multiLineDetected = await this.bot.dbManager.get('stats', 'multiLineDetected') || 0;
        const apiCalls = await this.bot.dbManager.get('stats', 'apiCalls') || 0;
        const rateLimitHits = await this.bot.dbManager.get('stats', 'rateLimitHits') || 0;
        const failedRequests = await this.bot.dbManager.get('stats', 'failedRequests') || 0;
        
        const uptime = this.bot.client.uptime;
        const uptimeHours = Math.floor(uptime / 3600000);
        const uptimeMinutes = Math.floor((uptime % 3600000) / 60000);
        const uptimeDays = Math.floor(uptimeHours / 24);
        
        const totalActions = warningsIssued + kicksIssued + bansIssued + timeoutsIssued;
        const estimatedFalsePositives = Math.floor(toxicDetections * 0.05);
        const accuracy = totalMessages > 0 ? ((1 - (estimatedFalsePositives / totalMessages)) * 100).toFixed(2) : 100;
        
        const cpuUsage = process.cpuUsage();
        const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000 / uptime * 100).toFixed(2);
        
        const avgResponseTime = apiCalls > 0 ? Math.floor(uptime / apiCalls) : 0;
        
        return {
            totalMessages,
            toxicDetections,
            warningsIssued,
            kicksIssued,
            bansIssued,
            timeoutsIssued,
            totalActions,
            spamBlocked,
            linksBlocked,
            profanityDetected,
            threatsDetected,
            multiLineDetected,
            apiCalls,
            rateLimitHits,
            failedRequests,
            estimatedFalsePositives,
            accuracy,
            heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
            heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
            external: (memUsage.external / 1024 / 1024).toFixed(2),
            rss: (memUsage.rss / 1024 / 1024).toFixed(2),
            uptime: `${uptimeDays}d ${uptimeHours % 24}h ${uptimeMinutes}m`,
            cpuUsage: cpuPercent,
            avgResponseTime
        };
    }
}

module.exports = DevStatsCommand;