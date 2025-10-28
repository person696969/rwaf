class DevDatabaseCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'devdatabase';
        this.description = 'Database information and management';
        this.ownerOnly = true;
    }

    async executeInteraction(interaction) {
        const stats = await this.bot.dbManager.getDatabaseStats();
        const totalDatabases = Object.values(stats).reduce((sum, info) => sum + info.count, 0);
        const totalEntries = Object.values(stats).reduce((sum, info) => sum + info.totalEntries, 0);
        
        let description = '**Database Status & Utilization**\n\n';
        
        for (const [type, info] of Object.entries(stats)) {
            const percentage = (info.totalEntries / (info.count * this.bot.dbManager.maxEntriesPerDB) * 100).toFixed(1);
            description += `**${type.toUpperCase()}**\n`;
            description += `├ Databases: ${info.count}\n`;
            description += `├ Total Entries: ${info.totalEntries.toLocaleString()}\n`;
            description += `├ Utilization: ${percentage}%\n`;
            description += `└ Details:\n`;
            
            for (const db of info.databases) {
                const bar = this.createProgressBar(db.entries, this.bot.dbManager.maxEntriesPerDB, 10);
                description += `   ├ DB #${db.index}: ${db.entries.toLocaleString()} entries\n`;
                description += `   │  ${bar} ${db.utilization}\n`;
            }
            description += '\n';
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🗄️ Database Information')
            .setDescription(description.substring(0, 4000))
            .setColor(COLORS.INFO)
            .addFields(
                { name: '📊 Total Databases', value: `${totalDatabases}`, inline: true },
                { name: '📈 Total Entries', value: `${totalEntries.toLocaleString()}`, inline: true },
                { name: '💾 Max per DB', value: `${this.bot.dbManager.maxEntriesPerDB.toLocaleString()}`, inline: true },
                { name: '📁 Directory', value: `\`${this.bot.dbManager.dbDirectory}\``, inline: true },
                { name: '🔄 Auto-Scale', value: 'Enabled', inline: true },
                { name: '💿 Storage', value: this.calculateTotalSize(), inline: true }
            )
            .setFooter({ text: 'Database auto-scales at 10k entries per file' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }

    createProgressBar(current, max, length) {
        const filled = Math.round((current / max) * length);
        const empty = length - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }

    calculateTotalSize() {
        try {
            const fs = require('fs');
            const path = require('path');
            let totalSize = 0;
            
            const files = fs.readdirSync(this.bot.dbManager.dbDirectory);
            for (const file of files) {
                if (file.endsWith('.sqlite')) {
                    const stats = fs.statSync(path.join(this.bot.dbManager.dbDirectory, file));
                    totalSize += stats.size;
                }
            }
            
            return `${(totalSize / 1024 / 1024).toFixed(2)} MB`;
        } catch (error) {
            return 'N/A';
        }
    }
}

module.exports = DevDatabaseCommand;
