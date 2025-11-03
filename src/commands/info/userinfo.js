const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class UserInfoCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'userinfo';
        this.aliases = ['whois', 'ui'];
        this.description = 'Get information about a user';
        this.usage = 'n!userinfo [@user]';
    }

    async execute(message, args) {
        const targetUser = message.mentions.users.first() || message.author;
        const targetMember = message.guild.members.cache.get(targetUser.id);
        
        if (!targetMember) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ Not Found', 'User not in this server.')] 
            }).catch(() => {});
        }
        
        // Get user data
        const strikes = await this.bot.dbManager.get('strikes', `${message.guild.id}_${targetUser.id}`) || 0;
        const spamStrikes = await this.bot.dbManager.get('spam_strikes', `${message.guild.id}_${targetUser.id}`) || 0;
        const mentionStrikes = await this.bot.dbManager.get('mention_strikes', `${message.guild.id}_${targetUser.id}`) || 0;
        const history = await this.bot.dbManager.get('history', `${message.guild.id}_${targetUser.id}`) || [];
        const config = await this.getConfig(message.guild.id);
        const isWhitelisted = config.whitelist && config.whitelist.includes(targetUser.id);
        
        // Calculate average toxicity
        let avgToxicity = 0;
        if (history.length > 0) {
            avgToxicity = (history.reduce((sum, msg) => sum + msg.toxicity, 0) / history.length * 100).toFixed(1);
        }
        
        const roles = targetMember.roles.cache
            .filter(role => role.id !== message.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString())
            .slice(0, 10);
        
        const { EmbedBuilder } = require('discord.js');
        const { COLORS } = require('../../config/constants');
        
        const embed = new EmbedBuilder()
            .setTitle(`📋 User Information - ${targetUser.tag}`)
            .setColor(COLORS.DARK_NAVY)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '👤 User', value: `${targetUser}\n\`${targetUser.id}\``, inline: true },
                { name: '📅 Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '📥 Joined Server', value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '⚡ Toxicity Strikes', value: `${strikes}/${config.maxStrikes}`, inline: true },
                { name: '🚨 Spam Strikes', value: `${spamStrikes}/${config.spamMaxStrikes}`, inline: true },
                { name: '👥 Mention Strikes', value: `${mentionStrikes}/${config.mentionSpamMaxStrikes}`, inline: true },
                { name: '📊 Messages Logged', value: `${history.length}`, inline: true },
                { name: '📈 Avg Toxicity', value: `${avgToxicity}%`, inline: true },
                { name: '✅ Whitelisted', value: isWhitelisted ? 'Yes' : 'No', inline: true },
                { name: '🎭 Nickname', value: targetMember.nickname || 'None', inline: true },
                { name: '🎨 Highest Role', value: targetMember.roles.highest.toString(), inline: true },
                { name: '🔇 Timed Out', value: targetMember.communicationDisabledUntil ? 'Yes' : 'No', inline: true }
            )
            .setFooter({ text: `Requested by ${message.author.tag}` })
            .setTimestamp();
        
        if (roles.length > 0) {
            embed.addFields({ 
                name: `🎭 Roles [${targetMember.roles.cache.size - 1}]`, 
                value: roles.join(', ') || 'None', 
                inline: false 
            });
        }
        
        if (targetMember.premiumSince) {
            embed.addFields({ 
                name: '💎 Boosting Since', 
                value: `<t:${Math.floor(targetMember.premiumSinceTimestamp / 1000)}:R>`, 
                inline: true 
            });
        }
        
        await message.reply({ embeds: [embed] });
    }
}

module.exports = UserInfoCommand;
