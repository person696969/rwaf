const BaseCommand = require('../BaseCommand');
const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');
const env = require('../../config/environment');

class ServerListCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'serverlist';
        this.description = 'List all servers';
        this.usage = 'n!serverlist';
        this.ownerOnly = true;
    }

    async execute(message, args) {
        const guilds = this.bot.client.guilds.cache;
        
        if (guilds.size === 0) {
            const EmbedHelper = require('../../utils/embedBuilder');
            return message.reply({ embeds: [EmbedHelper.info('📋 Server List', 'Bot is not in any servers.')] }).catch(() => {});
        }
        
        const guildList = Array.from(guilds.values()).map((guild, index) => {
            return `**${index + 1}.** ${guild.name}\n└ ID: \`${guild.id}\`\n└ Members: ${guild.memberCount}`;
        }).join('\n\n');
        
        const embed = new EmbedBuilder()
            .setTitle('📋 Server List')
            .setDescription(`Bot is currently in **${guilds.size}** server(s):\n\n${guildList}`)
            .setColor(COLORS.DARK_NAVY)
            .setFooter({ text: `Use ${env.prefix}leaveserver <server_id> to leave a server` })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] }).catch(() => {});
    }
}

module.exports = ServerListCommand;