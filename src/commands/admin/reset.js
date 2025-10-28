/**
 * Reset Command
 * Resets all server configuration and data (requires confirmation)
 */

const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

// Temporary storage for pending resets (in-memory)
const pendingResets = new Map();

module.exports = {
    name: 'reset',
    description: 'Reset all server data (requires confirmation)',
    usage: 'n!reset',
    aliases: ['resetserver', 'cleardata'],
    category: 'admin',
    adminOnly: true,
    cooldown: 10,

    async execute(message, args, { models, client }) {
        try {
            // Check if this is a confirmation
            if (args[0] === 'confirm') {
                return await handleResetConfirm(message, models);
            }

            // Show warning and request confirmation
            const warningEmbed = new EmbedBuilder()
                .setTitle('⚠️ Reset Server Configuration')
                .setColor(COLORS.ERROR)
                .setDescription('**⚠️ CRITICAL WARNING ⚠️**\n\nThis will **permanently delete** all data for this server, including:')
                .addFields(
                    {
                        name: '🗑️ Data to be Deleted',
                        value: '• Configuration settings\n• User strikes (all users)\n• User spam strikes\n• User mention strikes\n• Message history\n• Whitelist/Blacklist\n• All custom word lists',
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
            pendingResets.set(message.author.id, {
                guildId: message.guild.id,
                timestamp: Date.now()
            });

            // Auto-expire after 30 seconds
            setTimeout(() => {
                if (pendingResets.has(message.author.id)) {
                    pendingResets.delete(message.author.id);
                }
            }, 30000);

        } catch (error) {
            console.error('Error in reset command:', error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription('Failed to initiate reset. Please try again.')
                .setColor(COLORS.ERROR)
                .setTimestamp();

            await message.reply({ embeds: [errorEmbed] }).catch(() => {});
        }
    }
};

/**
 * Handle reset confirmation
 * @param {Message} message - Discord message
 * @param {Models} models - Database models
 */
async function handleResetConfirm(message, models) {
    try {
        // Check if there's a pending reset for this user
        const pending = pendingResets.get(message.author.id);

        if (!pending) {
            const noPendingEmbed = new EmbedBuilder()
                .setTitle('❌ No Pending Reset')
                .setDescription('No reset confirmation is pending. Use `n!reset` first.')
                .setColor(COLORS.ERROR)
                .setTimestamp();

            return message.reply({ embeds: [noPendingEmbed] });
        }

        // Verify guild ID matches
        if (pending.guildId !== message.guild.id) {
            const wrongGuildEmbed = new EmbedBuilder()
                .setTitle('❌ Guild Mismatch')
                .setDescription('This reset confirmation is for a different server.')
                .setColor(COLORS.ERROR)
                .setTimestamp();

            return message.reply({ embeds: [wrongGuildEmbed] });
        }

        // Check if confirmation expired (30 seconds)
        if (Date.now() - pending.timestamp > 30000) {
            pendingResets.delete(message.author.id);

            const expiredEmbed = new EmbedBuilder()
                .setTitle('⏱️ Confirmation Expired')
                .setDescription('Reset confirmation has expired. Use `n!reset` to start again.')
                .setColor(COLORS.WARNING)
                .setTimestamp();

            return message.reply({ embeds: [expiredEmbed] });
        }

        // Remove pending reset
        pendingResets.delete(message.author.id);

        // Show processing message
        const processingEmbed = new EmbedBuilder()
            .setTitle('⏳ Processing Reset...')
            .setDescription('Deleting all server data. Please wait...')
            .setColor(COLORS.WARNING)
            .setTimestamp();

        const processingMsg = await message.reply({ embeds: [processingEmbed] });

        // Delete all guild data
        const dbManager = models.guildConfig.dbManager;
        await dbManager.deleteAllForGuild(message.guild.id);

        // Success message
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
            .setTimestamp()
            .setFooter({ text: 'Powered by NeoBot' });

        await processingMsg.edit({ embeds: [successEmbed] });

        console.log(`🔄 Server ${message.guild.name} (${message.guild.id}) data has been reset by ${message.author.tag}`);

    } catch (error) {
        console.error('Error confirming reset:', error);

        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Reset Failed')
            .setDescription('An error occurred while resetting server data. Please try again or contact support.')
            .setColor(COLORS.ERROR)
            .setTimestamp();

        await message.reply({ embeds: [errorEmbed] }).catch(() => {});
    }
}