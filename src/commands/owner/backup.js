const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');

class BackupCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'backup';
        this.description = 'View backup information';
        this.usage = 'n!backup';
        this.ownerOnly = true;
    }

    async execute(message, args) {
        const stats = await this.bot.dbManager.getDatabaseStats();
        
        const embed = EmbedHelper.info(
            '💾 Database Backup',
            `**Status:** All data is automatically saved to SQLite files.\n\n**Location:** \`./databases/\`\n\n**Database Stats:**\n${Object.entries(stats).map(([type, info]) => `• ${type}: ${info.totalEntries} entries across ${info.count} file(s)`).join('\n')}`
        );
        
        await message.reply({ embeds: [embed] });
    }
}

module.exports = BackupCommand;