const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class WhitelistCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'whitelist';
        this.description = 'Manage whitelisted users';
        this.usage = 'n!whitelist <add|remove|list> [@user]';
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
    }

    async execute(message, args) {
        const config = await this.getConfig(message.guild.id);
        config.whitelist = config.whitelist || [];

        if (!args[0] || !['add', 'remove', 'list'].includes(args[0].toLowerCase())) {
            const embed = EmbedHelper.error(
                '❌ Invalid Usage',
                `**Usage:** ${this.usage}\n\n**Commands:**\n\`add\` - Add user to whitelist\n\`remove\` - Remove user from whitelist\n\`list\` - Show all whitelisted users`
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const action = args[0].toLowerCase();

        if (action === 'list') {
            if (config.whitelist.length === 0) {
                const embed = EmbedHelper.info(
                    '📋 Whitelist',
                    'No users are whitelisted.'
                );
                return message.reply({ embeds: [embed] }).catch(() => {});
            }

            let userList = '';
            for (const userId of config.whitelist) {
                const user = await this.bot.client.users.fetch(userId).catch(() => null);
                userList += `• ${user ? user.tag : userId}\n`;
            }

            const embed = EmbedHelper.info(
                '📋 Whitelisted Users',
                `${userList}\n**Total:** ${config.whitelist.length} users`
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        // For add/remove, we need a user
        const user = message.mentions.users.first() || 
                     await this.bot.client.users.fetch(args[1]).catch(() => null);

        if (!user) {
            const embed = EmbedHelper.error(
                '❌ User Not Found',
                'Please mention a user or provide a valid user ID.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (action === 'add') {
            if (config.whitelist.includes(user.id)) {
                const embed = EmbedHelper.warning(
                    '⚠️ Already Whitelisted',
                    `${user.tag} is already whitelisted.`
                );
                return message.reply({ embeds: [embed] }).catch(() => {});
            }

            config.whitelist.push(user.id);
            await this.saveConfig(message.guild.id, config);

            const embed = EmbedHelper.success(
                '✅ User Whitelisted',
                `${user.tag} has been added to the whitelist and will bypass toxicity detection.`
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (action === 'remove') {
            const index = config.whitelist.indexOf(user.id);
            if (index === -1) {
                const embed = EmbedHelper.warning(
                    '⚠️ Not Whitelisted',
                    `${user.tag} is not on the whitelist.`
                );
                return message.reply({ embeds: [embed] }).catch(() => {});
            }

            config.whitelist.splice(index, 1);
            await this.saveConfig(message.guild.id, config);

            const embed = EmbedHelper.success(
                '✅ User Removed',
                `${user.tag} has been removed from the whitelist.`
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }
    }
}

module.exports = WhitelistCommand;
