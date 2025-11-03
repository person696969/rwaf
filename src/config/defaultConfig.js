module.exports = {
    enabled: true,
    autoModeration: true,
    imageDetection: true,
    contextAnalysis: true,
    antiBypass: true,
    deepContextAnalysis: true,
    spamProtection: true,
    linkProtection: true,
    mentionSpamProtection: true,
    
    thresholds: {
        toxicity: 0.75,
        severeToxicity: 0.65,
        identityAttack: 0.70,
        insult: 0.75,
        profanity: 0.80,
        threat: 0.65
    },
    
    punishments: {
        1: 'warn',
        2: 'timeout',
        3: 'kick',
        4: 'ban'
    },
    
    timeoutDurations: {
        1: '10m',
        2: '1h',
        3: '24h'
    },
    
    maxMentions: 5,
    spamThreshold: 5,
    spamWindow: 10000,
    
    logChannel: null,
    modRole: null,
    immuneRoles: [],
    
    customWords: [],
    whitelistedLinks: [],
    
    createdAt: Date.now(),
    updatedAt: Date.now()
};
