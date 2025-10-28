const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../config/constants');

class EmbedHelper {
    static create(title, description, color = COLORS.DARK_NAVY) {
        try {
            return new EmbedBuilder()
                .setTitle(String(title).substring(0, 256))
                .setDescription(String(description).substring(0, 4096))
                .setColor(color)
                .setTimestamp()
                .setFooter({ text: 'Powered by NeoBot' });
        } catch (error) {
            console.error('Error creating embed:', error);
            return new EmbedBuilder()
                .setTitle('Error')
                .setDescription('An error occurred')
                .setColor(COLORS.ERROR);
        }
    }

    static success(title, description) {
        return this.create(title, description, COLORS.SUCCESS);
    }

    static error(title, description) {
        return this.create(title, description, COLORS.ERROR);
    }

    static warning(title, description) {
        return this.create(title, description, COLORS.WARNING);
    }

    static info(title, description) {
        return this.create(title, description, COLORS.INFO);
    }
}

module.exports = EmbedHelper;