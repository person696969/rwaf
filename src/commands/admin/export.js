const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class ExportCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'export';
        this.description = 'Export server data';
        this.usage = 'n!export <config|strikes|history|all>';
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
    }

    async execute(message, args) {
        const type = args[0]?.toLowerCase() || 'config';
        
        if (!['config', 'strikes', 'history', 'all'].includes(type)) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ Invalid Type', 'Valid types: `config`, `strikes`, `history`, `all`')] 
            }).catch(() => {});
        }
        
        try {
            const data = await this.gatherData(message.guild.id, type);
            const json = JSON.stringify(data, null, 2);
            
            if (json.length > 8000000) {
                return message.reply({ 
                    embeds: [EmbedHelper.error('❌ Too Large', 'Data is too large to export. Try exporting specific types.')] 
                }).catch(() => {});
            }
            
            const { AttachmentBuilder } = require('discord.js');
            const buffer = Buffer.from(json, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { 
                name: `${message.guild.name.replace(/[^a-z0-9]/gi, '_')}-${type}-${Date.now()}.json` 
            });
            
            const embed = EmbedHelper.success(
                '📤 Data Exported',
                `Exported **${type}** data for ${message.guild.name}.\n\n**Size:** ${(json.length / 1024).toFixed(2)} KB\n**Records:** ${this.countRecords(data)}`
            );
            
            await message.reply({ embeds: [embed], files: [attachment] });
        } catch (error) {
            console.error('Error exporting data:', error);
            await message.reply({ 
                embeds: [EmbedHelper.error('❌ Export Failed', 'Failed to export data.')] 
            }).catch(() => {});
        }
    }

    async gatherData(guildId, type) {
        const data = { exportDate: new Date().toISOString(), guildId, type };
        
        if (type === 'config' || type === 'all') {
            data.config = await this.bot.dbManager.get('config', `guild_${guildId}`);
        }
        
        if (type === 'strikes' || type === 'all') {
            const allStrikes = await this.bot.dbManager.all('strikes');
            data.strikes = allStrikes.filter(item => item.id && item.id.startsWith(guildId));
        }
        
        if (type === 'history' || type === 'all') {
            const allHistory = await this.bot.dbManager.all('history');
            data.history = allHistory.filter(item => item.id && item.id.startsWith(guildId));
        }
        
        return data;
    }

    countRecords(data) {
        let count = 0;
        if (data.config) count++;
        if (data.strikes) count += data.strikes.length;
        if (data.history) count += data.history.length;
        return count;
    }
}

module.exports = ExportCommand;
