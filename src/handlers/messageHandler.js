const env = require('../config/environment');
const CommandHandler = require('./commandHandler');
const ToxicityDetector = require('../detectors/toxicityDetector');

class MessageHandler {
    constructor(bot) {
        this.bot = bot;
        this.commandHandler = new CommandHandler(bot);
    }

    async handle(message) {
        if (message.content && message.content.startsWith(env.prefix)) {
            await this.commandHandler.handle(message);
        } else {
            await this.handleToxicityCheck(message);
        }
    }

    async handleToxicityCheck(message, isVerification = false) {
        const detector = new ToxicityDetector(this.bot);
        return await detector.analyze(message, isVerification);
    }
}

module.exports = MessageHandler;