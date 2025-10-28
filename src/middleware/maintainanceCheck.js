class MaintenanceChecker {
    static check(bot, userId) {
        const env = require('../config/environment');
        if (bot.maintenanceMode && userId !== env.botOwnerId) {
            return {
                inMaintenance: true,
                message: 'The bot is currently under maintenance. Please try again later.'
            };
        }
        return { inMaintenance: false };
    }
}

module.exports = MaintenanceChecker;