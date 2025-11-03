const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class DevErrorsCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'deverrors';
        this.description = 'View error logs';
        this.ownerOnly = true;
    }

    async executeInteraction(interaction) {
        const errorLog = await this.bot.dbManager.get('errors', 'error_log') || [];
        
        if (errorLog.length === 0) {
            const EmbedHelper = require('../../utils/embedBuilder');
            return interaction.editReply({ 
                embeds: [EmbedHelper.success('✅ No Errors', 'No errors have been logged recently.')] 
            });
        }
        
        const recentErrors = errorLog.slice(-10).reverse();
        
        // Group errors by context
        const errorsByContext = {};
        for (const err of recentErrors) {
            if (!errorsByContext[err.context]) {
                errorsByContext[err.context] = [];
            }
            errorsByContext[err.context].push(err);
        }
        
        let description = '**Recent Error Log (Last 10)**\n\n';
        
        for (const [context, errors] of Object.entries(errorsByContext)) {
            description += `**${context}** (${errors.length})\n`;
            for (let i = 0; i < Math.min(errors.length, 3); i++) {
                const err = errors[i];
                const time = new Date(err.timestamp).toLocaleString();
                description += `├ \`${time}\`\n`;
                description += `└ ${err.error.substring(0, 100)}\n`;
            }
            description += '\n';
        }
        
        const errorStats = {
            total: errorLog.length,
            last24h: errorLog.filter(e => Date.now() - e.timestamp < 86400000).length,
            lastHour: errorLog.filter(e => Date.now() - e.timestamp < 3600000).length,
            critical: errorLog.filter(e => e.error.includes('CRITICAL') || e.error.includes('FATAL')).length
        };
        
        const embed = new EmbedBuilder()
            .setTitle('⚠️ Error Log')
            .setDescription(description.substring(0, 4000))
            .setColor(COLORS.ERROR)
            .addFields(
                { name: '📊 Total Errors', value: `${errorStats.total}`, inline: true },
                { name: '📅 Last 24h', value: `${errorStats.last24h}`, inline: true },
                { name: '⏰ Last Hour', value: `${errorStats.lastHour}`, inline: true },
                { name: '🔴 Critical', value: `${errorStats.critical}`, inline: true },
                { name: '🔄 Error Tracker', value: `${this.bot.errorHandler.errorCount}/${this.bot.errorHandler.maxErrors}`, inline: true },
                { name: '📈 Error Rate', value: `${(errorStats.last24h / 24).toFixed(2)}/hour`, inline: true }
            )
            .setFooter({ text: 'Errors are automatically logged and tracked' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
}

module.exports = DevErrorsCommand;