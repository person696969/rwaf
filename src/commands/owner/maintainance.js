const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { COLORS } = require('../../config/constants');

class MaintenanceCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'maintenance';
        this.description = 'Toggle maintenance mode';
        this.usage = 'n!maintenance <on|off|status>';
        this.ownerOnly = true;
    }

    async execute(message, args) {
        const action = args[0]?.toLowerCase();
        
        if (!action || !['on', 'off', 'status'].includes(action)) {
            return message.reply({ 
                embeds: [EmbedHelper.create(
                    '🔧 Maintenance Mode',
                    `**Current Status:** ${this.bot.maintenanceMode ? '🔴 ON' : '🟢 OFF'}\n\n**Usage:**\n\`\`\`\nn!maintenance on     - Enable maintenance mode\nn!maintenance off    - Disable maintenance mode\nn!maintenance status - Check current status\`\`\``,
                    this.bot.maintenanceMode ? COLORS.ERROR : COLORS.SUCCESS
                )] 
            }).catch(() => {});
        }
        
        switch (action) {
            case 'on':
                this.bot.maintenanceMode = true;
                this.bot.client.user.setPresence({
                    activities: [{ name: '🔧 Under Maintenance', type: 3 }],
                    status: 'dnd'
                });
                await message.reply({ 
                    embeds: [EmbedHelper.error('🔧 Maintenance Mode Enabled', 'The bot is now in maintenance mode. Only the owner can use commands.')] 
                }).catch(() => {});
                console.log('🔧 Maintenance mode: ENABLED');
                break;
                
            case 'off':
                this.bot.maintenanceMode = false;
                this.bot.client.user.setPresence({
                    activities: [{ name: 'messages for toxicity | n!help', type: 3 }],
                    status: 'online'
                });
                await message.reply({ 
                    embeds: [EmbedHelper.success('✅ Maintenance Mode Disabled', 'The bot is now operational. All users can use commands.')] 
                }).catch(() => {});
                console.log('✅ Maintenance mode: DISABLED');
                break;
                
            case 'status':
                await message.reply({ 
                    embeds: [EmbedHelper.create(
                        '🔧 Maintenance Status',
                        `**Status:** ${this.bot.maintenanceMode ? '🔴 **ACTIVE**' : '🟢 **INACTIVE**'}\n\n${this.bot.maintenanceMode ? 'Only the bot owner can use commands.' : 'All users can use commands normally.'}`,
                        this.bot.maintenanceMode ? COLORS.ERROR : COLORS.SUCCESS
                    )] 
                }).catch(() => {});
                break;
        }
    }
}

module.exports = MaintenanceCommand;