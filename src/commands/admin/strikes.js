const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class StrikesCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'strikes';
        this.description = 'View user strike history';
        this.usage = 'n!strikes [@user]';
        this.aliases = ['warnings', 'infractions'];
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.ModerateMembers;
    }

    async execute(message, args) {
        const user = message.mentions.users.first() || 
                     await this.bot.client.users.fetch(args[0]).catch(() => null) ||
                     message.author;

        const strikes = await this.bot.dbManager.get('strikes', `${message.guild.id}_${user.id}`);

        if (!strikes || strikes.count === 0) {
            const embed = EmbedHelper.success(
                '✅ Clean Record',
                `${user.tag} has no strikes.`
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        let history = '';
        const recent = strikes.history.slice(-5).reverse();
        for (const record of recent) {
            const date = new Date(record.timestamp).toLocaleString();
            history += `**${date}**\n${record.reason}\n\`${record.content}\`\n\n`;
        }

        const config = await this.getConfig(message.guild.id);
        const nextPunishment = config.punishments[strikes.count + 1] || 
                              config.punishments[Object.keys(config.punishments).length];

        const embed = EmbedHelper.warning(
            `⚠️ Strike History - ${user.tag}`,
            `**Total Strikes:** ${strikes.count}/${config.maxStrikes || 3}\n**Next Punishment:** ${nextPunishment ? nextPunishment.toUpperCase() : 'MAX'}\n\n**Recent Violations:**\n${history}`
        );

        await message.reply({ embeds: [embed] }).catch(() => {});
    }
}

module.exports = StrikesCommand;
