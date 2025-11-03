const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class AutoRoleCommand extends BaseCommand {
    constructor(bot) {
        super(bot, {
            name: 'autorole',
            description: 'Configure automatic role assignment for new members',
            usage: 'autorole <set|remove|view> [@role]',
            category: 'admin',
            adminOnly: true,
            requiredPermission: PermissionFlagsBits.ManageRoles
        });
    }

    async execute(message, args) {
        const Models = require('../../database/models/Config').Models;
        const models = new Models(this.bot.dbManager);
        
        const guildId = message.guild.id;
        let config = await models.guildConfig.get(guildId) || { guildId };

        const subcommand = args[0]?.toLowerCase();

        if (!subcommand) {
            return message.reply({
                embeds: [EmbedHelper.error(
                    '❌ Missing Subcommand',
                    `Usage: \`${this.usage}\`\n\n` +
                    '**Subcommands:**\n' +
                    '`set` - Set an auto-role\n' +
                    '`remove` - Remove the auto-role\n' +
                    '`view` - View current auto-role'
                )]
            });
        }

        switch (subcommand) {
            case 'set':
                return await this.handleSet(message, args, config, models);
            case 'remove':
                return await this.handleRemove(message, config, models);
            case 'view':
                return await this.handleView(message, config);
            default:
                return message.reply({
                    embeds: [EmbedHelper.error('❌ Invalid Subcommand', `Valid options: \`set\`, \`remove\`, \`view\``)]
                });
        }
    }

    async handleSet(message, args, config, models) {
        const role = message.mentions.roles.first() || 
                    await message.guild.roles.fetch(args[1]).catch(() => null);

        if (!role) {
            return message.reply({
                embeds: [EmbedHelper.error('❌ Invalid Role', 'Please mention a valid role or provide a role ID')]
            });
        }

        if (role.managed) {
            return message.reply({
                embeds: [EmbedHelper.error('❌ Invalid Role', 'Cannot use managed roles (bot roles)')]
            });
        }

        const botMember = await message.guild.members.fetch(this.bot.client.user.id);
        if (role.position >= botMember.roles.highest.position) {
            return message.reply({
                embeds: [EmbedHelper.error(
                    '❌ Role Too High',
                    'I cannot assign roles that are higher than or equal to my highest role'
                )]
            });
        }

        config.autoRole = role.id;
        await models.guildConfig.set(message.guild.id, config);

        return message.reply({
            embeds: [EmbedHelper.success(
                '✅ Auto-Role Set',
                `New members will automatically receive the **${role.name}** role`
            )]
        });
    }

    async handleRemove(message, config, models) {
        if (!config.autoRole) {
            return message.reply({
                embeds: [EmbedHelper.error('❌ No Auto-Role', 'There is no auto-role configured')]
            });
        }

        config.autoRole = null;
        await models.guildConfig.set(message.guild.id, config);

        return message.reply({
            embeds: [EmbedHelper.success('✅ Auto-Role Removed', 'Auto-role has been disabled')]
        });
    }

    async handleView(message, config) {
        if (!config.autoRole) {
            return message.reply({
                embeds: [EmbedHelper.info('📋 Auto-Role', 'No auto-role is currently configured')]
            });
        }

        const role = await message.guild.roles.fetch(config.autoRole).catch(() => null);
        const roleName = role ? role.name : 'Unknown Role (deleted)';

        return message.reply({
            embeds: [EmbedHelper.info(
                '📋 Auto-Role Configuration',
                `**Current Auto-Role**: ${roleName}\n\n` +
                '*New members will automatically receive this role upon joining*'
            )]
        });
    }
}

module.exports = AutoRoleCommand;
