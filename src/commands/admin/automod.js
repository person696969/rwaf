const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

class AutoModCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'automod';
        this.description = 'Configure auto-moderation rules';
        this.usage = 'n!automod <view|add|remove|list>';
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
    }

    async execute(message, args) {
        const action = args[0]?.toLowerCase();
        const config = await this.getConfig(message.guild.id);
        
        if (!config.autoModRules) {
            config.autoModRules = [];
        }
        
        if (!action || action === 'view') {
            return this.showAutoModStatus(message, config);
        }
        
        switch (action) {
            case 'add':
                await this.addRule(message, args.slice(1), config);
                break;
            case 'remove':
                await this.removeRule(message, args.slice(1), config);
                break;
            case 'list':
                await this.listRules(message, config);
                break;
            default:
                await message.reply({ 
                    embeds: [EmbedHelper.error('❌ Invalid Action', 'Valid actions: `view`, `add`, `remove`, `list`')] 
                }).catch(() => {});
        }
    }

    async showAutoModStatus(message, config) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Auto-Moderation Status')
            .setColor(config.autoModeration ? COLORS.SUCCESS : COLORS.WARNING)
            .addFields(
                { name: 'Status', value: config.autoModeration ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: 'Active Rules', value: `${config.autoModRules?.length || 0}`, inline: true },
                { name: 'Commands', value: '```\nn!toggle automod - Enable/disable\nn!automod list - View rules\nn!automod add <type> - Add rule\nn!automod remove <id> - Remove rule```', inline: false }
            )
            .setFooter({ text: 'Auto-moderation provides additional protection layers' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }

    async addRule(message, args, config) {
        const ruleType = args[0]?.toLowerCase();
        const validTypes = ['caps', 'emoji', 'zalgo', 'invite'];
        
        if (!validTypes.includes(ruleType)) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ Invalid Type', `Valid types: ${validTypes.join(', ')}`)] 
            }).catch(() => {});
        }
        
        const rule = {
            id: Date.now().toString(),
            type: ruleType,
            enabled: true,
            createdAt: Date.now(),
            createdBy: message.author.id
        };
        
        // Add rule-specific settings
        switch (ruleType) {
            case 'caps':
                rule.threshold = parseInt(args[1]) || 70; // % of caps
                rule.minLength = parseInt(args[2]) || 10; // min message length
                break;
            case 'emoji':
                rule.maxEmojis = parseInt(args[1]) || 10;
                break;
            case 'zalgo':
                rule.sensitivity = args[1] || 'medium';
                break;
            case 'invite':
                rule.allowOwnServer = args[1] === 'true' || false;
                break;
        }
        
        config.autoModRules.push(rule);
        await this.saveConfig(message.guild.id, config);
        
        await message.reply({ 
            embeds: [EmbedHelper.success('✅ Rule Added', `Auto-mod rule \`${ruleType}\` added with ID: \`${rule.id}\``)] 
        }).catch(() => {});
    }

    async removeRule(message, args, config) {
        const ruleId = args[0];
        
        if (!ruleId) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ No ID', 'Provide a rule ID. Use `n!automod list` to see IDs.')] 
            }).catch(() => {});
        }
        
        const index = config.autoModRules.findIndex(r => r.id === ruleId);
        
        if (index === -1) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ Not Found', 'Rule not found.')] 
            }).catch(() => {});
        }
        
        const removed = config.autoModRules.splice(index, 1)[0];
        await this.saveConfig(message.guild.id, config);
        
        await message.reply({ 
            embeds: [EmbedHelper.success('✅ Rule Removed', `Removed rule: \`${removed.type}\` (ID: \`${removed.id}\`)`)] 
        }).catch(() => {});
    }

    async listRules(message, config) {
        if (!config.autoModRules || config.autoModRules.length === 0) {
            return message.reply({ 
                embeds: [EmbedHelper.info('📋 Auto-Mod Rules', 'No rules configured.')] 
            }).catch(() => {});
        }
        
        let description = '';
        for (const rule of config.autoModRules) {
            description += `**${rule.type.toUpperCase()}** (ID: \`${rule.id}\`)\n`;
            description += `├ Status: ${rule.enabled ? '✅ Enabled' : '❌ Disabled'}\n`;
            description += `├ Created: <t:${Math.floor(rule.createdAt / 1000)}:R>\n`;
            
            if (rule.type === 'caps') {
                description += `└ Settings: ${rule.threshold}% threshold, ${rule.minLength} min length\n`;
            } else if (rule.type === 'emoji') {
                description += `└ Settings: Max ${rule.maxEmojis} emojis\n`;
            } else if (rule.type === 'zalgo') {
                description += `└ Settings: ${rule.sensitivity} sensitivity\n`;
            } else if (rule.type === 'invite') {
                description += `└ Settings: Allow own server: ${rule.allowOwnServer ? 'Yes' : 'No'}\n`;
            }
            description += '\n';
        }
        
        const embed = new EmbedBuilder()
            .setTitle('📋 Auto-Moderation Rules')
            .setDescription(description)
            .setColor(COLORS.DARK_NAVY)
            .setFooter({ text: 'Use n!automod remove <id> to remove a rule' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
}

module.exports = AutoModCommand;