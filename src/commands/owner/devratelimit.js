class DevRateLimitCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'devratelimit';
        this.description = 'Monitor rate limits';
        this.ownerOnly = true;
    }

    async executeInteraction(interaction) {
        let description = '**Current Rate Limit Status**\n\n';
        const rateLimitInfo = [];
        
        // Collect rate limit data
        for (const [guildId, guild] of this.bot.client.guilds.cache) {
            const config = await this.getConfig(guildId);
            
            // Get guild rate limit status
            const guildTracker = this.bot.rateLimiter.guildTrackers.get(guildId) || [];
            const userCount = this.bot.rateLimiter.userTrackers.size;
            
            const guildCalls = guildTracker.length;
            const guildLimit = config.rateLimit;
            const percentage = ((guildCalls / guildLimit) * 100).toFixed(1);
            
            let status;
            if (guildCalls >= guildLimit) {
                status = '🔴';
            } else if (guildCalls > guildLimit * 0.8) {
                status = '🟡';
            } else {
                status = '🟢';
            }
            
            rateLimitInfo.push({
                name: guild.name,
                calls: guildCalls,
                limit: guildLimit,
                percentage: parseFloat(percentage),
                status,
                members: guild.memberCount
            });
        }
        
        // Sort by usage percentage
        rateLimitInfo.sort((a, b) => b.percentage - a.percentage);
        
        // Display top 10
        for (const info of rateLimitInfo.slice(0, 10)) {
            const bar = this.createProgressBar(info.calls, info.limit, 10);
            description += `${info.status} **${info.name}**\n`;
            description += `├ ${bar} ${info.percentage}%\n`;
            description += `└ ${info.calls}/${info.limit} calls | ${info.members} members\n\n`;
        }
        
        const globalTracker = this.bot.rateLimiter.globalTracker;
        const globalLimit = this.bot.rateLimiter.globalLimit;
        const globalCalls = globalTracker.length;
        
        const embed = new EmbedBuilder()
            .setTitle('⏳ Rate Limit Monitor')
            .setDescription(description.substring(0, 4000) || 'No active rate limits.')
            .setColor(COLORS.INFO)
            .addFields(
                { name: '🌐 Global Usage', value: `${globalCalls}/${globalLimit} (${((globalCalls/globalLimit)*100).toFixed(1)}%)`, inline: true },
                { name: '🏢 Active Guilds', value: `${this.bot.rateLimiter.guildTrackers.size}`, inline: true },
                { name: '👥 Active Users', value: `${this.bot.rateLimiter.userTrackers.size}`, inline: true },
                { name: '📊 Total Servers', value: `${rateLimitInfo.length}`, inline: true },
                { name: '⚠️ At Limit', value: `${rateLimitInfo.filter(i => i.status === '🔴').length}`, inline: true },
                { name: '🟡 Near Limit', value: `${rateLimitInfo.filter(i => i.status === '🟡').length}`, inline: true }
            )
            .setFooter({ text: 'Rate limits reset every 60 seconds' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }

    createProgressBar(current, max, length) {
        const filled = Math.round((current / max) * length);
        const empty = length - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }
}

module.exports = DevRateLimitCommand;