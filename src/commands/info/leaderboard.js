class LeaderboardCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'leaderboard';
        this.aliases = ['lb', 'top'];
        this.description = 'View server leaderboard';
        this.usage = 'n!leaderboard [strikes|messages|clean]';
    }

    async execute(message, args) {
        const type = args[0]?.toLowerCase() || 'strikes';
        
        if (!['strikes', 'messages', 'clean'].includes(type)) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ Invalid Type', 'Valid types: `strikes`, `messages`, `clean`')] 
            }).catch(() => {});
        }
        
        let leaderboardData = [];
        
        if (type === 'strikes') {
            const allStrikes = await this.bot.dbManager.all('strikes');
            const guildStrikes = allStrikes.filter(item => item.id && item.id.startsWith(message.guild.id));
            
            leaderboardData = guildStrikes
                .map(item => ({
                    userId: item.id.split('_')[1],
                    value: item.value
                }))
                .filter(item => item.value > 0)
                .sort((a, b) => b.value - a.value)
                .slice(0, 10);
            
        } else if (type === 'messages') {
            const allHistory = await this.bot.dbManager.all('history');
            const guildHistory = allHistory.filter(item => item.id && item.id.startsWith(message.guild.id));
            
            const userMessageCounts = {};
            for (const item of guildHistory) {
                const userId = item.id.split('_')[1];
                userMessageCounts[userId] = (userMessageCounts[userId] || 0) + item.value.length;
            }
            
            leaderboardData = Object.entries(userMessageCounts)
                .map(([userId, count]) => ({ userId, value: count }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 10);
            
        } else if (type === 'clean') {
            const allHistory = await this.bot.dbManager.all('history');
            const guildHistory = allHistory.filter(item => item.id && item.id.startsWith(message.guild.id));
            
            const userAvgToxicity = {};
            for (const item of guildHistory) {
                const userId = item.id.split('_')[1];
                const messages = item.value;
                if (messages.length > 0) {
                    const avg = messages.reduce((sum, msg) => sum + msg.toxicity, 0) / messages.length;
                    userAvgToxicity[userId] = avg;
                }
            }
            
            leaderboardData = Object.entries(userAvgToxicity)
                .map(([userId, avg]) => ({ userId, value: avg }))
                .sort((a, b) => a.value - b.value)
                .slice(0, 10);
        }
        
        if (leaderboardData.length === 0) {
            return message.reply({ 
                embeds: [EmbedHelper.info('📊 Leaderboard', 'No data available yet.')] 
            }).catch(() => {});
        }
        
        let description = '';
        const medals = ['🥇', '🥈', '🥉'];
        
        for (let i = 0; i < leaderboardData.length; i++) {
            const data = leaderboardData[i];
            const medal = medals[i] || `**${i + 1}.**`;
            const user = await this.bot.client.users.fetch(data.userId).catch(() => null);
            const userName = user ? user.tag : `User ${data.userId.substring(0, 8)}`;
            
            if (type === 'clean') {
                description += `${medal} ${userName} - ${(data.value * 100).toFixed(1)}% avg toxicity\n`;
            } else if (type === 'messages') {
                description += `${medal} ${userName} - ${data.value} messages\n`;
            } else {
                description += `${medal} ${userName} - ${data.value} strikes\n`;
            }
        }
        
        const titles = {
            strikes: '⚡ Top Strike Leaders',
            messages: '📊 Most Active Users',
            clean: '✨ Cleanest Users'
        };
        
        const { EmbedBuilder } = require('discord.js');
        const { COLORS } = require('../../config/constants');
        
        const embed = new EmbedBuilder()
            .setTitle(`📊 Leaderboard - ${message.guild.name}`)
            .setColor(COLORS.DARK_NAVY)
            .addFields({
                name: titles[type],
                value: description || 'No data',
                inline: false
            })
            .setFooter({ text: `Use n!leaderboard [strikes|messages|clean] to change type` })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
}

module.exports = LeaderboardCommand;