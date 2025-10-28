const { PermissionFlagsBits } = require('discord.js');

class PermissionChecker {
    static hasPermission(member, permission) {
        if (!member || !permission) return false;
        return member.permissions.has(permission);
    }

    static isAdmin(member) {
        return this.hasPermission(member, PermissionFlagsBits.Administrator);
    }

    static canModerate(member) {
        return this.hasPermission(member, PermissionFlagsBits.ModerateMembers);
    }

    static canBan(member) {
        return this.hasPermission(member, PermissionFlagsBits.BanMembers);
    }

    static canKick(member) {
        return this.hasPermission(member, PermissionFlagsBits.KickMembers);
    }

    static canManageMessages(member) {
        return this.hasPermission(member, PermissionFlagsBits.ManageMessages);
    }
}

module.exports = PermissionChecker;