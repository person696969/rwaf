const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const env = require('../config/environment');
const EmbedHelper = require('../utils/embedBuilder');

class SlashCommandHandler {
    constructor(bot) {
        this.bot = bot;
        this.commands = new Map();
        this.commandData = [];
        this.setupCommands();
    }

    setupCommands() {
        const helpCommand = new SlashCommandBuilder()
            .setName('help')
            .setDescription('Show all available commands')
            .addStringOption(option =>
                option.setName('command')
                    .setDescription('Get help for a specific command')
                    .setRequired(false));

        const configCommand = new SlashCommandBuilder()
            .setName('config')
            .setDescription('View current server configuration');

        const verifyCommand = new SlashCommandBuilder()
            .setName('verify')
            .setDescription('Check a message for toxicity')
            .addStringOption(option =>
                option.setName('message')
                    .setDescription('The message to verify')
                    .setRequired(true));

        const statsCommand = new SlashCommandBuilder()
            .setName('stats')
            .setDescription('Show bot statistics');

        const pingCommand = new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Check bot latency');

        const enableCommand = new SlashCommandBuilder()
            .setName('enable')
            .setDescription('Enable the protection system');

        const disableCommand = new SlashCommandBuilder()
            .setName('disable')
            .setDescription('Disable the protection system');

        const setthresholdCommand = new SlashCommandBuilder()
            .setName('setthreshold')
            .setDescription('Set toxicity detection threshold')
            .addIntegerOption(option =>
                option.setName('level')
                    .setDescription('Threshold level (0-10)')
                    .setRequired(true)
                    .setMinValue(0)
                    .setMaxValue(10));

        const setstrikesCommand = new SlashCommandBuilder()
            .setName('setstrikes')
            .setDescription('Set maximum strikes before ban')
            .addIntegerOption(option =>
                option.setName('amount')
                    .setDescription('Number of strikes (1-10)')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(10));

        const whitelistCommand = new SlashCommandBuilder()
            .setName('whitelist')
            .setDescription('Manage whitelisted users')
            .addStringOption(option =>
                option.setName('action')
                    .setDescription('Action to perform')
                    .setRequired(true)
                    .addChoices(
                        { name: 'add', value: 'add' },
                        { name: 'remove', value: 'remove' },
                        { name: 'list', value: 'list' }
                    ))
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('User to whitelist/unwhitelist')
                    .setRequired(false));

        const kickCommand = new SlashCommandBuilder()
            .setName('kick')
            .setDescription('Kick a user from the server')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('User to kick')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('Reason for kick')
                    .setRequired(false));

        const banCommand = new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Ban a user from the server')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('User to ban')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('Reason for ban')
                    .setRequired(false));

        const purgeCommand = new SlashCommandBuilder()
            .setName('purge')
            .setDescription('Delete multiple messages')
            .addIntegerOption(option =>
                option.setName('amount')
                    .setDescription('Number of messages to delete (1-100)')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(100));

        const toggleCommand = new SlashCommandBuilder()
            .setName('toggle')
            .setDescription('Toggle protection features')
            .addStringOption(option =>
                option.setName('feature')
                    .setDescription('Feature to toggle')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Image Detection', value: 'image' },
                        { name: 'Context Analysis', value: 'context' },
                        { name: 'Anti-Bypass', value: 'antibypass' },
                        { name: 'Deep Context', value: 'deepcontext' },
                        { name: 'Spam Protection', value: 'spam' },
                        { name: 'Link Protection', value: 'links' },
                        { name: 'Mention Protection', value: 'mentions' },
                        { name: 'Auto-Moderation', value: 'automod' },
                        { name: 'Phishing Detection', value: 'phishing' }
                    ));

        this.commandData = [
            helpCommand.toJSON(),
            configCommand.toJSON(),
            verifyCommand.toJSON(),
            statsCommand.toJSON(),
            pingCommand.toJSON(),
            enableCommand.toJSON(),
            disableCommand.toJSON(),
            setthresholdCommand.toJSON(),
            setstrikesCommand.toJSON(),
            whitelistCommand.toJSON(),
            kickCommand.toJSON(),
            banCommand.toJSON(),
            purgeCommand.toJSON(),
            toggleCommand.toJSON()
        ];
    }

    async registerCommands(clientId) {
        try {
            const rest = new REST({ version: '10' }).setToken(env.discordToken);
            console.log('🔄 Registering slash commands...');

            await rest.put(
                Routes.applicationCommands(clientId),
                { body: this.commandData }
            );

            console.log('✅ Successfully registered slash commands');
        } catch (error) {
            console.error('❌ Error registering slash commands:', error);
        }
    }

    async handle(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const commandName = interaction.commandName;

        try {
            await interaction.deferReply({ ephemeral: false });

            const legacyCommand = this.bot.messageHandler.commandHandler.commands.get(commandName);
            
            if (legacyCommand) {
                const mockMessage = {
                    guild: interaction.guild,
                    member: interaction.member,
                    author: interaction.user,
                    channel: interaction.channel,
                    content: `${env.prefix}${commandName}`,
                    reply: async (options) => {
                        return await interaction.editReply(options);
                    },
                    delete: async () => {}
                };

                const args = [];
                interaction.options.data.forEach(option => {
                    if (option.value !== undefined) {
                        args.push(String(option.value));
                    }
                });

                await legacyCommand.execute(mockMessage, args);
            } else {
                await interaction.editReply({
                    embeds: [EmbedHelper.error('❌ Command Not Found', 'This command is not available')]
                });
            }
        } catch (error) {
            console.error('Error handling slash command:', error);
            const errorEmbed = EmbedHelper.error('❌ Error', 'An error occurred while executing this command');
            
            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] }).catch(() => {});
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
            }
        }
    }
}

module.exports = SlashCommandHandler;
