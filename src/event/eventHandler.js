const env = require('../config/environment');
const MessageHandler = require('./messageHandler');
const InteractionHandler = require('./interactionHandler');

class EventHandler {
    constructor(bot) {
        this.bot = bot;
        this.messageHandler = new MessageHandler(bot);
        this.interactionHandler = new InteractionHandler(bot);
    }

    async onReady() {
        console.log(`✅ Logged in as ${this.bot.client.user.tag}`);
        console.log(`🚀 Ready! Protecting ${this.bot.client.guilds.cache.size} servers`);
        
        const startTime = await this.bot.dbManager.get('stats', 'startTime');
        if (!startTime) {
            await this.bot.dbManager.set('stats', 'startTime', Date.now());
        }
        
        this.bot.client.user.setPresence({
            activities: [{ name: 'messages | n!help', type: 3 }],
            status: 'online'
        });
    }

    async onMessageCreate(message) {
        if (!message || !message.author || !message.id) return;
        if (message.author.bot) return;
        if (this.bot.processingMessages.has(message.id)) return;
        if (this.isMessageProcessed(message.id)) return;
        
        this.bot.processingMessages.add(message.id);
        
        try {
            await this.messageHandler.handle(message);
            this.markMessageProcessed(message.id);
        } catch (error) {
            await this.bot.errorHandler.logError(
                this.bot.dbManager,
                error,
                'messageCreate',
                message
            );
        } finally {
            this.bot.processingMessages.delete(message.id);
        }
    }

    async onMessageUpdate(oldMessage, newMessage) {
        if (!newMessage || !newMessage.author || !newMessage.id) return;
        if (newMessage.author.bot) return;
        if (this.bot.processingMessages.has(newMessage.id)) return;
        if (this.isMessageProcessed(newMessage.id)) return;
        
        if (newMessage.content && 
            !newMessage.content.startsWith(env.prefix) && 
            newMessage.content !== oldMessage.content) {
            
            this.bot.processingMessages.add(newMessage.id);
            
            try {
                await this.messageHandler.handleToxicityCheck(newMessage);
                this.markMessageProcessed(newMessage.id);
            } catch (error) {
                await this.bot.errorHandler.logError(
                    this.bot.dbManager,
                    error,
                    'messageUpdate',
                    newMessage
                );
            } finally {
                this.bot.processingMessages.delete(newMessage.id);
            }
        }
    }

    async onInteractionCreate(interaction) {
        if (!interaction.isButton()) return;
        
        try {
            await this.interactionHandler.handle(interaction);
        } catch (error) {
            await this.bot.errorHandler.logError(
                this.bot.dbManager,
                error,
                'interactionCreate'
            );
        }
    }

    async onGuildCreate(guild) {
        console.log(`➕ Joined: ${guild.name}`);
        
        try {
            if (env.botOwnerId !== 'YOUR_USER_ID_HERE') {
                const owner = await this.bot.client.users.fetch(env.botOwnerId).catch(() => null);
                if (owner && !this.bot.spamDetectionService.checkBotMessageSpam('dm_' + owner.id)) {
                    const EmbedHelper = require('../utils/embedBuilder');
                    await owner.send({ 
                        embeds: [EmbedHelper.success(
                            '🆕 New Server',
                            `**Name:** ${guild.name}\n**ID:** ${guild.id}\n**Members:** ${guild.memberCount}`
                        )] 
                    }).catch(() => {});
                }
            }
        } catch (error) {
            console.error('Error notifying owner:', error);
        }
    }

    onError(error) {
        console.error('❌ Discord client error:', error);
        this.bot.errorHandler.logError(
            this.bot.dbManager,
            error,
            'Discord Client'
        ).catch(() => {});
    }

    onWarn(warning) {
        console.warn('⚠️ Discord client warning:', warning);
    }

    isMessageProcessed(messageId) {
        return this.bot.processedMessages.has(messageId);
    }

    markMessageProcessed(messageId) {
        if (!messageId) return;
        this.bot.processedMessages.set(messageId, Date.now());
    }
}

module.exports = EventHandler;