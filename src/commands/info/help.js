const BaseCommand = require('../BaseCommand');
const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

class HelpCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'help';
        this.description = 'Show all available commands';
        this.usage = 'n!help [command]';
        this.aliases = ['commands', 'h'];
    }

    async execute(message, args) {
        // If specific command requested
        if (args[0]) {
            const commandName = args[0].toLowerCase();
            const command = this.bot.commandHandler?.commands?.get(commandName);
            
            if (!command) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Command Not Found')
                    .setDescription(`No command found with name \`${commandName}\``)
                    .setColor(COLORS.ERROR);
                return message.reply({ embeds: [embed] }).catch(() => {});
            }

            const embed = new EmbedBuilder()
                .setTitle(`📖 ${command.name}`)
                .setDescription(command.description)
                .addFields(
                    { name: 'Usage', value: `\`${command.usage}\``, inline: false },
                    { name: 'Aliases', value: command.aliases?.join(', ') || 'None', inline: true },
                    { name: 'Admin Only', value: command.adminOnly ? 'Yes' : 'No', inline: true }
                )
                .setColor(COLORS.INFO);
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Anti-Toxicity Bot Commands')
            .setDescription('Advanced Discord moderation and toxicity detection')
            .setColor(COLORS.INFO)
            .addFields(
                {
                    name: '🎛️ System Controls (Admin)',
                    value: '```n!enable          - Enable protection\nn!disable         - Disable protection\nn!config          - View configuration\nn!reset           - Reset server data```',
                    inline: false
                },
                {
                    name: '⚙️ Configuration (Admin)',
                    value: '```n!setthreshold <0-10>        - Set sensitivity\nn!setstrikes <1-10>          - Set max strikes\nn!setpunishment <type>       - warn/kick/ban/timeout\nn!settimeout <duration>      - Set timeout duration\nn!setlogchannel [#channel]   - Set log channel```',
                    inline: false
                },
                {
                    name: '👥 User Management (Admin)',
                    value: '```n!whitelist add/remove/list @user\nn!strikes @user\nn!clearstrikes @user```',
                    inline: false
                },
                {
                    name: '📝 Word Lists (Admin)',
                    value: '```n!blacklist add/remove/list <word>\nn!whitelistwords add/remove/list <word>```',
                    inline: false
                },
                {
                    name: '🔧 Features (Admin)',
                    value: '```n!toggle image       - Image OCR detection\nn!toggle context     - Historical context\nn!toggle antibypass  - Multi-line detection\nn!toggle deepcontext - Smart reply scanning\nn!toggle spam        - Spam protection\nn!toggle links       - Link protection\nn!toggle mentions    - Mention spam protection```',
                    inline: false
                },
                {
                    name: '🔨 Moderation',
                    value: '```n!ban @user [reason]\nn!kick @user [reason]\nn!timeout @user <10m/1h/1d> [reason]\nn!mute @user <duration> [reason]\nn!unmute @user\nn!purge <amount>```',
                    inline: false
                },
                {
                    name: '📊 Information',
                    value: '```n!stats      - View bot statistics\nn!verify <message> - Check message toxicity\nn!ping       - Check bot latency\nn!serverinfo - View server information\nn!userinfo   - View user information\nn!help [command] - This message```',
                    inline: false
                }
            )
            .setFooter({ text: 'Use n!help <command> for detailed information about a command' })
            .setTimestamp();

        if (message.guild.iconURL()) {
            embed.setThumbnail(message.guild.iconURL({ dynamic: true }));
        }

        await message.reply({ embeds: [embed] }).catch(() => {});
    }
}

module.exports = HelpCommand;
