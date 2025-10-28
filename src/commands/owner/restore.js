const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');

class RestoreCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'restore';
        this.description = 'View restore information';
        this.usage = 'n!restore';
        this.ownerOnly = true;
    }

    async execute(message, args) {
        const embed = EmbedHelper.info(
            'ℹ️ Database Restore',
            'Database restoration is automatic on bot startup.\n\nAll SQLite files in `./databases/` are loaded automatically.\n\nTo restore from backup:\n1. Stop the bot\n2. Replace files in `./databases/`\n3. Restart the bot'
        );
        
        await message.reply({ embeds: [embed] });
    }
}

module.exports = RestoreCommand;