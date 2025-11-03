const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class RaidModeCommand extends BaseCommand {
    constructor(bot) {
        super(bot, {
            name: 'raidmode',
            description: 'Enable/disable raid protection mode',
            usage: 'raidmode [on|off]',
            category: 'admin',
            aliases: ['raid'],
            adminOnly: true,
            requiredPermission: PermissionFlagsBits.Administrator
        });
    }

    async execute(message, args) {
        const Models = require('../../database/models/Config').Models;
        const models = new Models(this.bot.dbManager);
        
        const guildId = message.guild.id;
        let config = await models.guildConfig.get(guildId) || { guildId };

        const action = args[0]?.toLowerCase();

        if (!action || (action !== 'on' && action !== 'off')) {
            const status = config.raidMode ? '**Enabled**' : '**Disabled**';
            return message.reply({
                embeds: [EmbedHelper.info(
                    '🛡️ Raid Mode Status',
                    `Raid protection is currently ${status}\n\n` +
                    `Use \`raidmode on\` to enable or \`raidmode off\` to disable`
                )]
            });
        }

        const enable = action === 'on';
        config.raidMode = enable;
        await models.guildConfig.set(guildId, config);

        if (enable) {
            const embed = EmbedHelper.success(
                '🛡️ Raid Mode Enabled',
                '**Active Protections:**\n' +
                '• Auto-kick new accounts (< 7 days old)\n' +
                '• Require verification for new members\n' +
                '• Heightened spam detection\n' +
                '• Instant ban for suspicious patterns\n' +
                '• Limited message permissions for new joins\n\n' +
                '*Use `raidmode off` to disable*'
            );
            embed.setColor('#FF0000');

            if (config.logChannel) {
                const logChannel = await message.guild.channels.fetch(config.logChannel).catch(() => null);
                if (logChannel) {
                    await logChannel.send({ embeds: [embed] }).catch(() => {});
                }
            }

            return message.reply({ embeds: [embed] });
        } else {
            const embed = EmbedHelper.success(
                '✅ Raid Mode Disabled',
                'Raid protection has been turned off. Normal moderation resumed.'
            );

            if (config.logChannel) {
                const logChannel = await message.guild.channels.fetch(config.logChannel).catch(() => null);
                if (logChannel) {
                    await logChannel.send({ embeds: [embed] }).catch(() => {});
                }
            }

            return message.reply({ embeds: [embed] });
        }
    }
}

module.exports = RaidModeCommand;
