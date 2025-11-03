const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class SetThresholdCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'setthreshold';
        this.description = 'Set toxicity detection sensitivity';
        this.usage = 'n!setthreshold <0-10>';
        this.aliases = ['threshold', 'sensitivity'];
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
    }

    async execute(message, args) {
        if (!args[0]) {
            const embed = EmbedHelper.error(
                '❌ Invalid Usage',
                `Usage: ${this.usage}\n\nSet sensitivity from 0-10 (0 = least sensitive, 10 = most sensitive)`
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const threshold = parseFloat(args[0]);
        
        if (isNaN(threshold) || threshold < 0 || threshold > 10) {
            const embed = EmbedHelper.error(
                '❌ Invalid Threshold',
                'Threshold must be a number between 0 and 10.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const config = await this.getConfig(message.guild.id);
        
        // Convert 0-10 scale to 0-1 scale for internal use
        const normalizedThreshold = threshold / 10;
        config.thresholds = config.thresholds || {};
        config.thresholds.toxicity = normalizedThreshold;
        config.thresholds.severeToxicity = Math.max(0, normalizedThreshold - 0.1);
        config.thresholds.threat = Math.max(0, normalizedThreshold - 0.05);
        config.thresholds.profanity = Math.min(1, normalizedThreshold + 0.05);
        config.thresholds.identityAttack = normalizedThreshold;
        config.thresholds.insult = normalizedThreshold;
        
        await this.saveConfig(message.guild.id, config);
        
        let sensitivityLevel = 'Low';
        if (threshold >= 7) sensitivityLevel = 'Very High';
        else if (threshold >= 5) sensitivityLevel = 'High';
        else if (threshold >= 3) sensitivityLevel = 'Medium';
        
        const embed = EmbedHelper.success(
            '✅ Threshold Updated',
            `Sensitivity set to **${threshold}/10** (${sensitivityLevel})\n\nThe bot will now ${threshold >= 7 ? 'strictly' : threshold >= 5 ? 'moderately' : 'loosely'} filter toxic content.`
        );
        
        await message.reply({ embeds: [embed] }).catch(() => {});
    }
}

module.exports = SetThresholdCommand;
