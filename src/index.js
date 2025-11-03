const { Client, GatewayIntentBits } = require('discord.js');
const env = require('./config/environment');
const DatabaseManager = require('./database/DatabaseManager');
const AdvancedRateLimiter = require('./utils/rateLimiter');
const ErrorHandler = require('./utils/errorHandler');
const PerspectiveService = require('./services/perspectiveService');
const SpamDetectionService = require('./services/spamDetectionService');
const ImageAnalysisService = require('./services/imageAnalysisService');
const LinkCheckService = require('./services/linkCheckService');
const MultiLineDetector = require('./detectors/multiLineDetector');
const ExpressServer = require('./server/expressServer');
const EventHandler = require('./event/eventHandler');

class Bot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ]
        });

        // Initialize services
        this.dbManager = new DatabaseManager();
        this.rateLimiter = new AdvancedRateLimiter();
        this.errorHandler = new ErrorHandler();
        this.perspectiveService = new PerspectiveService();
        this.spamDetectionService = new SpamDetectionService();
        this.imageAnalysisService = new ImageAnalysisService();
        this.linkCheckService = new LinkCheckService();
        this.multiLineDetector = new MultiLineDetector();

        // State
        this.maintenanceMode = false;
        this.processingMessages = new Set();
        this.processedMessages = new Map();

        // Initialize express server
        this.expressServer = new ExpressServer(this.client);
        
        // Setup event handlers
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        const eventHandler = new EventHandler(this);
        
        this.client.once('ready', () => eventHandler.onReady());
        this.client.on('messageCreate', (msg) => eventHandler.onMessageCreate(msg));
        this.client.on('messageUpdate', (old, newMsg) => eventHandler.onMessageUpdate(old, newMsg));
        this.client.on('interactionCreate', (int) => eventHandler.onInteractionCreate(int));
        this.client.on('guildCreate', (guild) => eventHandler.onGuildCreate(guild));
        this.client.on('error', (error) => eventHandler.onError(error));
        this.client.on('warn', (warning) => eventHandler.onWarn(warning));
    }

    async start() {
        try {
            await this.loginWithRetry();
            this.startCleanupInterval();
            this.startHealthCheck();
            this.expressServer.start();
        } catch (error) {
            console.error('❌ Failed to start bot:', error);
            process.exit(1);
        }
    }

    async loginWithRetry(maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔐 Login attempt ${attempt}/${maxRetries}...`);
                await this.client.login(env.discordToken);
                return;
            } catch (error) {
                console.error(`❌ Login attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    startCleanupInterval() {
        setInterval(() => {
            try {
                this.rateLimiter.cleanup();
                this.spamDetectionService.cleanup();
                this.multiLineDetector.cleanup();
                
                const now = Date.now();
                for (const [id, timestamp] of this.processedMessages.entries()) {
                    if (now - timestamp > 60000) {
                        this.processedMessages.delete(id);
                    }
                }
                
                console.log(`🧹 Cleanup completed`);
            } catch (error) {
                console.error('Cleanup error:', error);
            }
        }, 300000); // Every 5 minutes
    }

    startHealthCheck() {
        setInterval(() => {
            try {
                if (this.client.isReady()) {
                    console.log(`✅ Health: OK | Servers: ${this.client.guilds.cache.size} | Uptime: ${Math.floor(this.client.uptime/60000)}m`);
                } else {
                    console.warn('⚠️ Health: Not ready');
                }
            } catch (error) {
                console.error('Health check error:', error);
            }
        }, 600000); // Every 10 minutes
    }

    async shutdown() {
        console.log('\n🛑 Shutting down gracefully...');
        try {
            await this.client.destroy();
            console.log('✅ Bot disconnected successfully');
            process.exit(0);
        } catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
        }
    }
}

// Initialize and start bot
const bot = new Bot();

// Process handlers
process.on('SIGINT', () => bot.shutdown());
process.on('SIGTERM', () => bot.shutdown());

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
    const error = reason instanceof Error ? reason : new Error(String(reason));
    bot.errorHandler.logError(bot.dbManager, error, 'Unhandled Rejection').catch(() => {});
});

process.on('uncaughtException', error => {
    console.error('❌ Uncaught Exception:', error);
    bot.errorHandler.logError(bot.dbManager, error, 'Uncaught Exception').catch(() => {});
    if (error.message && error.message.includes('FATAL')) {
        bot.shutdown();
    }
});

// Start the bot
bot.start();