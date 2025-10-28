const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class EnableCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'enable';
        this.description = 'Enable anti-toxicity system';
        this.usage = 'n!enable';
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
    }

    async execute(message, args) {
        const config = await this.getConfig(message.guild.id);
        config.enabled = true;
        await this.saveConfig(message.guild.id, config);
        
        const embed = EmbedHelper.success(
            '✅ System Enabled',
            'Anti-toxicity system is now active.'
        );
        
        await message.reply({ embeds: [embed] }).catch(() => {});
    }
}

module.exports = EnableCommand;