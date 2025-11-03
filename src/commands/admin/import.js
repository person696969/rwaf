const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class ImportCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'import';
        this.description = 'Import server data from JSON file';
        this.usage = 'n!import (attach JSON file)';
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
    }

    async execute(message, args) {
        if (message.attachments.size === 0) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ No File', 'Please attach a JSON file exported using `n!export`.')] 
            }).catch(() => {});
        }
        
        const attachment = message.attachments.first();
        
        if (!attachment.name.endsWith('.json')) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ Invalid File', 'File must be a JSON file.')] 
            }).catch(() => {});
        }
        
        try {
            const axios = require('axios');
            const response = await axios.get(attachment.url);
            const data = response.data;
            
            // Validate data
            if (!data.guildId || !data.exportDate) {
                return message.reply({ 
                    embeds: [EmbedHelper.error('❌ Invalid Data', 'File is not a valid export.')] 
                }).catch(() => {});
            }
            
            // Confirm import
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_import')
                        .setLabel('Confirm Import')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('cancel_import')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            const confirmEmbed = EmbedHelper.warning(
                '⚠️ Confirm Import',
                `**WARNING:** This will overwrite existing data!\n\n**Export Date:** ${new Date(data.exportDate).toLocaleString()}\n**Records:** ${this.countRecords(data)}\n\nClick "Confirm Import" to proceed.`
            );
            
            const confirmMsg = await message.reply({ embeds: [confirmEmbed], components: [row] });
            
            const filter = i => i.user.id === message.author.id;
            const collector = confirmMsg.createMessageComponentCollector({ filter, time: 30000 });
            
            collector.on('collect', async i => {
                if (i.customId === 'confirm_import') {
                    await i.update({ components: [] });
                    await this.performImport(message, data);
                } else {
                    await i.update({ 
                        embeds: [EmbedHelper.info('ℹ️ Cancelled', 'Import cancelled.')], 
                        components: [] 
                    });
                }
                collector.stop();
            });
            
            collector.on('end', collected => {
                if (collected.size === 0) {
                    confirmMsg.edit({ 
                        embeds: [EmbedHelper.warning('⏱️ Timeout', 'Import cancelled due to timeout.')], 
                        components: [] 
                    }).catch(() => {});
                }
            });
        } catch (error) {
            console.error('Error importing data:', error);
            await message.reply({ 
                embeds: [EmbedHelper.error('❌ Import Failed', 'Failed to import data. Check file format.')] 
            }).catch(() => {});
        }
    }

    async performImport(message, data) {
        try {
            let imported = 0;
            
            if (data.config) {
                await this.bot.dbManager.set('config', `guild_${message.guild.id}`, data.config);
                imported++;
            }
            
            if (data.strikes) {
                for (const strike of data.strikes) {
                    await this.bot.dbManager.set('strikes', strike.id, strike.value);
                    imported++;
                }
            }
            
            if (data.history) {
                for (const hist of data.history) {
                    await this.bot.dbManager.set('history', hist.id, hist.value);
                    imported++;
                }
            }
            
            const embed = EmbedHelper.success(
                '✅ Import Complete',
                `Successfully imported **${imported}** records.`
            );
            
            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error performing import:', error);
            await message.channel.send({ 
                embeds: [EmbedHelper.error('❌ Import Failed', 'An error occurred during import.')] 
            }).catch(() => {});
        }
    }

    countRecords(data) {
        let count = 0;
        if (data.config) count++;
        if (data.strikes) count += data.strikes.length;
        if (data.history) count += data.history.length;
        return count;
    }
}

module.exports = ImportCommand;