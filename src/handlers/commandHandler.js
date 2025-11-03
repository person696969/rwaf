const env = require('../config/environment');
const EmbedHelper = require('../utils/embedBuilder');
const fs = require('fs');
const path = require('path');

class CommandHandler {
    constructor(bot) {
        this.bot = bot;
        this.commands = new Map();
        this.pendingResets = new Map();
        this.loadCommands();
    }

    loadCommands() {
        const commandDirs = ['admin', 'moderation', 'config', 'info', 'owner'];
        
        for (const dir of commandDirs) {
            const dirPath = path.join(__dirname, '../commands', dir);
            if (!fs.existsSync(dirPath)) continue;
            
            const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
            
            for (const file of files) {
                try {
                    const Command = require(path.join(dirPath, file));
                    const command = new Command(this.bot);
                    this.commands.set(command.name, command);
                    
                    if (command.aliases) {
                        command.aliases.forEach(alias => {
                            this.commands.set(alias, command);
                        });
                    }
                } catch (error) {
                    console.error(`Error loading command ${file}:`, error);
                }
            }
        }
        
        console.log(`✅ Loaded ${this.commands.size} commands`);
    }

    async handle(message) {
        if (!message || !message.guild || !message.member || !message.author) return;
        if (message.author.bot) return;
        
        // Check maintenance mode
        if (this.bot.maintenanceMode && message.author.id !== env.botOwnerId) {
            const embed = EmbedHelper.warning(
                '🔧 Maintenance Mode',
                'The bot is currently under maintenance. Please try again later.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }
        
        if (this.bot.spamDetectionService.checkBotMessageSpam(message.channel.id)) {
            console.error('🚨 Command response blocked due to spam prevention');
            return;
        }
        
        try {
            const args = message.content.slice(env.prefix.length).trim().split(/\s+/);
            const commandName = args.shift()?.toLowerCase();
            
            if (!commandName) return;
            
            const command = this.commands.get(commandName);
            
            if (!command) {
                return message.reply({ 
                    embeds: [EmbedHelper.error(
                        '❌ Unknown Command',
                        `Use \`${env.prefix}help\` for a list of commands.`
                    )] 
                }).catch(() => {});
            }
            
            // Check permissions
            if (!this.checkPermissions(message, command)) {
                return message.reply({ 
                    embeds: [EmbedHelper.error(
                        '❌ Access Denied',
                        'You don\'t have permission to use this command.'
                    )] 
                }).catch(() => {});
            }
            
            await command.execute(message, args);
            
        } catch (error) {
            console.error('Error in command handler:', error);
            await this.bot.errorHandler.logError(
                this.bot.dbManager,
                error,
                'commandHandler',
                message
            );
        }
    }

    checkPermissions(message, command) {
        // Owner only
        if (command.ownerOnly && message.author.id !== env.botOwnerId) {
            return false;
        }
        
        // Admin only
        if (command.adminOnly && !message.member.permissions.has(command.requiredPermission)) {
            return false;
        }
        
        return true;
    }
}

module.exports = CommandHandler;