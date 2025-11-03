require('dotenv').config();

module.exports = {
    discordToken: process.env.DISCORD_TOKEN || '',
    perspectiveApiKey: process.env.PERSPECTIVE_API_KEY || '',
    botOwnerId: process.env.BOT_OWNER_ID || '',
    maxErrors: parseInt(process.env.MAX_ERRORS) || 100,
    globalRateLimit: parseInt(process.env.GLOBAL_RATE_LIMIT) || 50,
    perGuildRateLimit: parseInt(process.env.PER_GUILD_RATE_LIMIT) || 10,
    perUserRateLimit: parseInt(process.env.PER_USER_RATE_LIMIT) || 3,
    port: parseInt(process.env.PORT) || 5000,
    dbDirectory: process.env.DB_DIRECTORY || './databases',
    maxEntriesPerDB: parseInt(process.env.MAX_ENTRIES_PER_DB) || 1000
};
