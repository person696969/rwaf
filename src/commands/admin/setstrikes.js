const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class SetStrikesCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'setstrikes';
        this.description = 'Set maximum strikes before ban';
        this.usage = 'n!setstrikes <1-10>';
        this.aliases = ['maxstrikes', 'strikes'];
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
    }

    async execute(message, args) {
        if (!args[0]) {
            const embed = EmbedHelper.error(
                '❌ Invalid Usage',
                `Usage: ${this.usage}\n\nSet max strikes from 1-10 before final punishment`
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const strikes = parseInt(args[0]);
        
        if (isNaN(strikes) || strikes < 1 || strikes > 10) {
            const embed = EmbedHelper.error(
                '❌ Invalid Number',
                'Max strikes must be between 1 and 10.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const config = await this.getConfig(message.guild.id);
        config.maxStrikes = strikes;
        await this.saveConfig(message.guild.id, config);
        
        const embed = EmbedHelper.success(
            '✅ Max Strikes Updated',
            `Users will receive up to **${strikes}** strikes before final punishment.\n\nConfigure punishments with \`n!setpunishment\``
        );
        
        await message.reply({ embeds: [embed] }).catch(() => {});
    }
}

module.exports = SetStrikesCommand;
