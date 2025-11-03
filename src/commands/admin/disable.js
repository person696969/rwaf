const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class DisableCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'disable';
        this.description = 'Disable anti-toxicity system';
        this.usage = 'n!disable';
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
    }

    async execute(message, args) {
        const config = await this.getConfig(message.guild.id);
        config.enabled = false;
        await this.saveConfig(message.guild.id, config);
        
        const embed = EmbedHelper.warning(
            '⚠️ System Disabled',
            'Anti-toxicity system is now inactive. Messages will not be monitored.'
        );
        
        await message.reply({ embeds: [embed] }).catch(() => {});
    }
}

module.exports = DisableCommand;
