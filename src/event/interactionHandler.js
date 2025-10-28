const env = require('../config/environment');

class InteractionHandler {
    constructor(bot) {
        this.bot = bot;
        this.historyPages = new Map();
    }

    async handle(interaction) {
        if (interaction.customId.startsWith('history_')) {
            await this.handleHistoryPagination(interaction);
        } else if (interaction.customId === 'show_dev_commands') {
            await this.handleDevCommands(interaction);
        } else if (['dev_stats', 'dev_database', 'dev_errors', 'dev_ratelimit'].includes(interaction.customId)) {
            await this.handleDevPanel(interaction);
        }
    }

    async handleHistoryPagination(interaction) {
        const pageData = this.historyPages.get(interaction.message.id);
        
        if (!pageData) {
            return interaction.reply({ 
                content: '❌ Expired. Run command again.', 
                ephemeral: true 
            }).catch(() => {});
        }
        
        if (pageData.userId !== interaction.user.id) {
            return interaction.reply({ 
                content: '❌ Only command user can use buttons.', 
                ephemeral: true 
            }).catch(() => {});
        }
        
        // Handle pagination logic here
        // Import and use the history command pagination logic
    }

    async handleDevCommands(interaction) {
        if (interaction.user.id !== env.botOwnerId) {
            return interaction.reply({ 
                content: '❌ Owner only.', 
                ephemeral: true 
            }).catch(() => {});
        }
        
        const { EmbedBuilder } = require('discord.js');
        const { COLORS } = require('../config/constants');
        
        const devEmbed = new EmbedBuilder()
            .setTitle('👑 Developer Commands')
            .setColor(COLORS.GOLD)
            .addFields(
                { 
                    name: '📊 Monitoring', 
                    value: '```n!devpanel\nn!serverlist\nn!setratelimit <id> <limit>```', 
                    inline: false 
                },
                { 
                    name: '🔧 Management', 
                    value: '```n!leaveserver <id>\nn!maintenance <on/off>\nn!backup\nn!restore```', 
                    inline: false 
                }
            )
            .setTimestamp();
        
        return interaction.reply({ embeds: [devEmbed], ephemeral: true }).catch(() => {});
    }

    async handleDevPanel(interaction) {
        if (interaction.user.id !== env.botOwnerId) {
            return interaction.reply({ 
                content: '❌ Owner only.', 
                ephemeral: true 
            }).catch(() => {});
        }
        
        await interaction.deferReply({ ephemeral: true });
        
        // Import and execute appropriate dev panel handler
        const handlers = {
            'dev_stats': require('../commands/owner/devStats'),
            'dev_database': require('../commands/owner/devDatabase'),
            'dev_errors': require('../commands/owner/devErrors'),
            'dev_ratelimit': require('../commands/owner/devRateLimit')
        };
        
        const HandlerClass = handlers[interaction.customId];
        if (HandlerClass) {
            const handler = new HandlerClass(this.bot);
            await handler.executeInteraction(interaction);
        }
    }
}

module.exports = InteractionHandler;