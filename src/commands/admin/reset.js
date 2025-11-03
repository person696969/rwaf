const BaseCommand = require('../BaseCommand');
const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');
const { PermissionFlagsBits } = require('discord.js');

class ResetCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'reset';
        this.description = 'Reset all server data (requires confirmation)';
        this.usage = 'n!reset';
        this.aliases = ['resetserver', 'cleardata'];
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
        this.pendingResets = new Map();
    }

    async execute(message, args) {
        try {
            // Check if this is a confirmation
            if (args[0] === 'confirm') {
                return await this.handleResetConfirm(message);
            }

            // Show warning and request confirmation
            const warningEmbed = new EmbedBuilder()
                .setTitle('⚠️ Reset Server Configuration')
                .setColor(COLORS.ERROR)
                .setDescription('**⚠️ CRITICAL WARNING ⚠️**\n\nThis will **permanently delete** all data for this server, including:')
                .addFields(
                    {
                        name: '🗑️ Data to be Deleted',
                        value: '• Configuration settings\n• User strikes (all users)\n• Message history\n• Whitelist/Blacklist\n• All custom word lists',
                        inline: false
                    },
                    {
                        name: '⚠️ THIS ACTION CANNOT BE UNDONE!',
                        value: 'All moderation data and settings will be lost permanently.',
                        inline: false
                    },
                    {
                        name: '✅ To Proceed',
                        value: 'Type `n!reset confirm` within the next **30 seconds**',
                        inline: false
                    }
                )
                .setTimestamp()
                .setFooter({ text: 'Think carefully before confirming!' });

            await message.reply({ embeds: [warningEmbed] });

            // Store pending reset
            this.pendingResets.set(message.author.id, {
                guildId: message.guild.id,
                timestamp: Date.now()
            });

            // Auto-expire after 30 seconds
            setTimeout(() => {
                if (this.pendingResets.has(message.author.id)) {
                    this.pendingResets.delete(message.author.id);
                }
            }, 30000);

        } catch (error) {
            console.error('Error in reset command:', error);
            const { EmbedHelper } = require('../../utils/embedBuilder');
            const errorEmbed = EmbedHelper.error(
                '❌ Error',
                'Failed to initiate reset. Please try again.'
            );
            await message.reply({ embeds: [errorEmbed] }).catch(() => {});
        }
    }

    async handleResetConfirm(message) {
        try {
            const pending = this.pendingResets.get(message.author.id);

            if (!pending) {
                const noPendingEmbed = new EmbedBuilder()
                    .setTitle('❌ No Pending Reset')
                    .setDescription('No reset confirmation is pending. Use `n!reset` first.')
                    .setColor(COLORS.ERROR)
                    .setTimestamp();

                return message.reply({ embeds: [noPendingEmbed] });
            }

            if (pending.guildId !== message.guild.id) {
                const wrongGuildEmbed = new EmbedBuilder()
                    .setTitle('❌ Guild Mismatch')
                    .setDescription('This reset confirmation is for a different server.')
                    .setColor(COLORS.ERROR)
                    .setTimestamp();

                return message.reply({ embeds: [wrongGuildEmbed] });
            }

            if (Date.now() - pending.timestamp > 30000) {
                this.pendingResets.delete(message.author.id);

                const expiredEmbed = new EmbedBuilder()
                    .setTitle('⏱️ Confirmation Expired')
                    .setDescription('Reset confirmation has expired. Use `n!reset` to start again.')
                    .setColor(COLORS.WARNING)
                    .setTimestamp();

                return message.reply({ embeds: [expiredEmbed] });
            }

            this.pendingResets.delete(message.author.id);

            const processingEmbed = new EmbedBuilder()
                .setTitle('⏳ Processing Reset...')
                .setDescription('Deleting all server data. Please wait...')
                .setColor(COLORS.WARNING)
                .setTimestamp();

            const processingMsg = await message.reply({ embeds: [processingEmbed] });

            // Delete all guild data
            const configKeys = await this.bot.dbManager.getAllKeys('config');
            const strikeKeys = await this.bot.dbManager.getAllKeys('strikes');
            const historyKeys = await this.bot.dbManager.getAllKeys('history');

            for (const key of configKeys) {
                if (key.includes(message.guild.id)) {
                    await this.bot.dbManager.delete('config', key);
                }
            }
            for (const key of strikeKeys) {
                if (key.includes(message.guild.id)) {
                    await this.bot.dbManager.delete('strikes', key);
                }
            }
            for (const key of historyKeys) {
                if (key.includes(message.guild.id)) {
                    await this.bot.dbManager.delete('history', key);
                }
            }

            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Server Reset Complete')
                .setDescription('All server data has been permanently deleted.')
                .setColor(COLORS.SUCCESS)
                .addFields(
                    {
                        name: '🔄 What Happened',
                        value: '• All configuration reset to defaults\n• All user strikes cleared\n• All history deleted\n• All custom lists removed',
                        inline: false
                    },
                    {
                        name: '▶️ Next Steps',
                        value: 'Use `n!enable` to activate the anti-toxicity system with default settings.',
                        inline: false
                    }
                )
                .setTimestamp();

            await processingMsg.edit({ embeds: [successEmbed] });

            console.log(`🔄 Server ${message.guild.name} (${message.guild.id}) data has been reset by ${message.author.tag}`);

        } catch (error) {
            console.error('Error confirming reset:', error);
            const { EmbedHelper } = require('../../utils/embedBuilder');
            const errorEmbed = EmbedHelper.error(
                '❌ Reset Failed',
                'An error occurred while resetting server data. Please try again.'
            );
            await message.reply({ embeds: [errorEmbed] }).catch(() => {});
        }
    }
}

module.exports = ResetCommand;
