const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class SetLogChannelCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'setlogchannel';
        this.description = 'Set channel for moderation logs';
        this.usage = 'n!setlogchannel [#channel]';
        this.aliases = ['logchannel', 'setlogs'];
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
    }

    async execute(message, args) {
        const config = await this.getConfig(message.guild.id);
        
        // If no args, remove log channel
        if (!args[0]) {
            config.logChannel = null;
            await this.saveConfig(message.guild.id, config);
            
            const embed = EmbedHelper.success(
                '✅ Log Channel Removed',
                'Moderation logs will no longer be sent to a channel.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        // Get channel from mention or ID
        const channelId = args[0].replace(/[<#>]/g, '');
        const channel = message.guild.channels.cache.get(channelId);
        
        if (!channel) {
            const embed = EmbedHelper.error(
                '❌ Channel Not Found',
                'Please mention a valid channel or provide a channel ID.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (!channel.isTextBased()) {
            const embed = EmbedHelper.error(
                '❌ Invalid Channel Type',
                'Log channel must be a text channel.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        config.logChannel = channel.id;
        await this.saveConfig(message.guild.id, config);
        
        const embed = EmbedHelper.success(
            '✅ Log Channel Set',
            `Moderation logs will be sent to ${channel}`
        );
        
        // Send test message to log channel
        const testEmbed = EmbedHelper.info(
            '📋 Log Channel Configured',
            'This channel will receive moderation action logs.'
        );
        await channel.send({ embeds: [testEmbed] }).catch(() => {});
        
        await message.reply({ embeds: [embed] }).catch(() => {});
    }
}

module.exports = SetLogChannelCommand;
