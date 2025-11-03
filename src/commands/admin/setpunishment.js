const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class SetPunishmentCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'setpunishment';
        this.description = 'Set punishment type for strikes';
        this.usage = 'n!setpunishment <strike#> <warn|timeout|kick|ban>';
        this.aliases = ['punishment', 'setaction'];
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
    }

    async execute(message, args) {
        if (args.length < 2) {
            const config = await this.getConfig(message.guild.id);
            const punishments = config.punishments || {};
            
            let punishmentList = '';
            for (let i = 1; i <= (config.maxStrikes || 3); i++) {
                punishmentList += `Strike ${i}: **${(punishments[i] || 'warn').toUpperCase()}**\n`;
            }
            
            const embed = EmbedHelper.info(
                '⚖️ Current Punishments',
                `${punishmentList}\n**Usage:** \`n!setpunishment <strike#> <warn|timeout|kick|ban>\`\n\n**Examples:**\n\`n!setpunishment 1 warn\`\n\`n!setpunishment 2 timeout\`\n\`n!setpunishment 3 ban\``
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const strikeNum = parseInt(args[0]);
        const punishment = args[1].toLowerCase();
        
        const validPunishments = ['warn', 'timeout', 'kick', 'ban'];
        
        if (isNaN(strikeNum) || strikeNum < 1 || strikeNum > 10) {
            const embed = EmbedHelper.error(
                '❌ Invalid Strike Number',
                'Strike number must be between 1 and 10.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (!validPunishments.includes(punishment)) {
            const embed = EmbedHelper.error(
                '❌ Invalid Punishment',
                `Punishment must be one of: ${validPunishments.join(', ')}`
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const config = await this.getConfig(message.guild.id);
        config.punishments = config.punishments || {};
        config.punishments[strikeNum] = punishment;
        await this.saveConfig(message.guild.id, config);
        
        const embed = EmbedHelper.success(
            '✅ Punishment Set',
            `Strike ${strikeNum} will now result in: **${punishment.toUpperCase()}**`
        );
        
        await message.reply({ embeds: [embed] }).catch(() => {});
    }
}

module.exports = SetPunishmentCommand;
