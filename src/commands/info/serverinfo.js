class ServerInfoCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'serverinfo';
        this.aliases = ['si', 'guildinfo'];
        this.description = 'Get server information';
        this.usage = 'n!serverinfo';
    }

    async execute(message, args) {
        const guild = message.guild;
        const config = await this.getConfig(guild.id);
        
        // Get statistics
        const totalMessages = await this.bot.dbManager.get('stats', 'totalMessages') || 0;
        const toxicDetections = await this.bot.dbManager.get('stats', 'toxicDetections') || 0;
        const spamBlocked = await this.bot.dbManager.get('stats', 'spamBlocked') || 0;
        
        // Get all users in this guild from database
        const allHistory = await this.bot.dbManager.all('history');
        const guildHistory = allHistory.filter(item => item.id && item.id.startsWith(guild.id));
        const totalUsersTracked = new Set(guildHistory.map(item => item.id.split('_')[1])).size;
        
        const { EmbedBuilder } = require('discord.js');
        const { COLORS } = require('../../config/constants');
        
        const embed = new EmbedBuilder()
            .setTitle(`🏰 Server Information - ${guild.name}`)
            .setColor(COLORS.DARK_NAVY)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '🆔 Server ID', value: `\`${guild.id}\``, inline: true },
                { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
                { name: '📝 Channels', value: `${guild.channels.cache.size}`, inline: true },
                { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true },
                { name: '💎 Boost Level', value: `Level ${guild.premiumTier}`, inline: true },
                { name: '🚀 Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
                { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
                { name: '🛡️ Protection Status', value: config.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '📊 Threshold', value: `${config.threshold}/10`, inline: true },
                { name: '⚡ Max Strikes', value: `${config.maxStrikes}`, inline: true },
                { name: '📈 Messages Analyzed', value: `${totalMessages.toLocaleString()}`, inline: true },
                { name: '🚨 Toxic Detected', value: `${toxicDetections.toLocaleString()}`, inline: true },
                { name: '🛡️ Spam Blocked', value: `${spamBlocked.toLocaleString()}`, inline: true },
                { name: '👤 Users Tracked', value: `${totalUsersTracked}`, inline: true },
                { name: '✅ Whitelisted Users', value: `${config.whitelist.length}`, inline: true },
                { name: '🚫 Blacklisted Words', value: `${config.blacklistWords.length}`, inline: true }
            )
            .setFooter({ text: `Requested by ${message.author.tag}` })
            .setTimestamp();
        
        if (guild.description) {
            embed.setDescription(`*${guild.description}*`);
        }
        
        if (guild.bannerURL()) {
            embed.setImage(guild.bannerURL({ size: 512 }));
        }
        
        await message.reply({ embeds: [embed] });
    }
}

module.exports = ServerInfoCommand;