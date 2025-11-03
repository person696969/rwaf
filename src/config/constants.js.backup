/**
 * Constants and Patterns for Anti-Toxicity Bot
 * All regex patterns, word lists, and configuration constants
 */

// Bot Configuration
const PREFIX = 'n!';
const DARK_NAVY = '#1a1f3a';
const BOT_OWNER_ID = process.env.BOT_OWNER_ID || 'YOUR_USER_ID_HERE';

// Rate Limiting Configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const BOT_MESSAGE_LIMIT = 10;
const BOT_MESSAGE_WINDOW = 60000;

// Error Tracking Configuration
const ERROR_TRACKER_CONFIG = {
    maxErrors: 50,
    window: 60000
};

// Multi-line Detection Configuration
const BUFFER_TIME_WINDOW = 10000;
const BUFFER_MAX_MESSAGES = 5;
const BUFFER_MIN_SIMILARITY = 0.6;

// Perspective API Attributes
const PERSPECTIVE_ATTRIBUTES = [
    'TOXICITY',
    'SEVERE_TOXICITY',
    'IDENTITY_ATTACK',
    'INSULT',
    'PROFANITY',
    'THREAT'
];

// Context-Required Words (require context analysis)
const CONTEXT_REQUIRED_WORDS = [
    'kill', 'killed', 'killing', 'killer',
    'murder', 'murdered', 'murderer', 'murdering',
    'die', 'died', 'death', 'dead', 'dying',
    'stab', 'stabbed', 'stabbing',
    'shoot', 'shot', 'shooting', 'shooter',
    'beat', 'beaten', 'beating',
    'attack', 'attacked', 'attacking',
    'fight', 'fighting', 'fought',
    'hate', 'hated', 'hating'
];

// Safe Context Indicators (gaming, entertainment, news)
const SAFE_CONTEXT_INDICATORS = [
    // Gaming
    'game', 'gaming', 'gamer', 'play', 'playing', 'played', 'player',
    'boss', 'level', 'quest', 'mission', 'enemy', 'mob', 'npc',
    'respawn', 'spawn', 'loadout', 'match', 'round', 'gg', 'wp',
    'valorant', 'fortnite', 'apex', 'cod', 'minecraft', 'roblox',
    'league', 'dota', 'pubg', 'cs', 'overwatch', 'warzone',
    
    // Entertainment
    'movie', 'film', 'show', 'series', 'episode', 'season',
    'book', 'novel', 'story', 'character', 'plot', 'scene',
    'anime', 'manga', 'comic', 'cartoon',
    
    // Past tense / News
    'was', 'were', 'has', 'had', 'been', 'yesterday', 'ago',
    'news', 'reported', 'article', 'happened', 'incident',
    'history', 'historical', 'according', 'said',
    
    // Humor indicators
    'literally', 'figuratively', 'metaphor', 'joke', 'funny',
    'laughing', 'lol', 'lmao', 'haha', 'hehe', 'jk', 'kidding'
];

// Toxic Indicators (for multi-line detection)
const TOXIC_INDICATORS = [
    'idiot', 'stupid', 'dumb', 'moron', 'fool', 'loser', 'pathetic',
    'worthless', 'useless', 'trash', 'garbage', 'hate', 'disgusting',
    'kys', 'kill yourself', 'die', 'hope you', 'gonna kill', 'will kill'
];

// Direct Threat Patterns (HIGH CONFIDENCE ONLY)
const THREAT_PATTERNS = [
    /\b(imma|ima|im gonna|i will|gonna|going to|bout to)\s+(kill|hurt|stab|shoot|beat|end|murder)\s+(you|u|ya|yall|ur|yourself)\b/gi,
    /\bkys\b/gi,
    /\b(kill|hurt)\s+yourself\b/gi,
    /\b(coming for|find you|track you|hunt you|get you|coming to get)\s+(and|to)?\s*(kill|hurt|stab|beat|you)?\b/gi,
    /\b(know where you|got your address|found your location|know your|doxx)\b/gi,
    /\bi hope you (die|get killed|get hurt)\b/gi
];

// Enhanced Profanity Patterns
const PROFANITY_PATTERNS = [
    /f+u+c+k+/gi,
    /s+h+i+t+/gi,
    /b+i+t+c+h+/gi,
    /a+s+s+h+o+l+e+/gi,
    /d+a+m+n+/gi,
    /c+u+n+t+/gi,
    /p+i+s+s+/gi,
    /d+i+c+k+/gi,
    /c+o+c+k+/gi,
    /p+u+s+s+y+/gi,
    /w+h+o+r+e+/gi,
    /s+l+u+t+/gi,
    /b+a+s+t+a+r+d+/gi,
    /n+i+g+g+a+/gi,
    /n+i+g+g+e+r+/gi,
    /f+a+g+g+o+t+/gi,
    /r+e+t+a+r+d+/gi
];

// Explicit Content Patterns
const EXPLICIT_PATTERNS = [
    /\b(n[i1!]gg[ae3]r|f[a@4]gg[o0]t|r[e3]t[a@4]rd)\b/gi,
    /\b(r[a@4]p[e3]|r[a@4]p[i1!]ng)\s+(you|her|him|them|someone)\b/gi,
    /\b(porn|xxx|nsfw)\s+(link|video|pic|image|discord\.gg)\b/gi
];

// Leet Speak Mapping
const LEET_SPEAK_MAP = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '8': 'b',
    '@': 'a',
    '$': 's',
    '!': 'i',
    '|': 'i',
    '€': 'e',
    '£': 'l',
    '¥': 'y'
};

// Link Detection Pattern
const LINK_PATTERN = /(https?:\/\/[^\s]+|discord\.gg\/[^\s]+|www\.[^\s]+)/gi;

// Color Codes for Embeds
const COLORS = {
    SUCCESS: '#00FF00',
    ERROR: '#FF0000',
    WARNING: '#FFA500',
    INFO: DARK_NAVY,
    GOLD: '#FFD700',
    DARK_RED: '#8B0000',
    ORANGE: '#FF6600',
    CYAN: '#00CED1',
    PURPLE: '#9370DB',
    FIRE: '#FF4500'
};

// Punishment Types
const PUNISHMENT_TYPES = ['warn', 'kick', 'ban', 'timeout'];

// Valid Toggle Features
const VALID_FEATURES = [
    'image',
    'context',
    'antibypass',
    'deepcontext',
    'spam',
    'links',
    'mentions',
    'automod'
];

// Feature Name Mapping
const FEATURE_MAP = {
    'image': 'imageDetection',
    'context': 'contextAnalysis',
    'antibypass': 'antiBypass',
    'deepcontext': 'deepContextAnalysis',
    'spam': 'spamProtection',
    'links': 'linkProtection',
    'mentions': 'mentionSpamProtection',
    'automod': 'autoModeration'
};

// Command Permissions
const PERMISSION_LEVELS = {
    USER: 0,
    MODERATOR: 1,
    ADMIN: 2,
    OWNER: 3
};

// Export all constants
module.exports = {
    PREFIX,
    DARK_NAVY,
    BOT_OWNER_ID,
    RATE_LIMIT_WINDOW,
    BOT_MESSAGE_LIMIT,
    BOT_MESSAGE_WINDOW,
    ERROR_TRACKER_CONFIG,
    BUFFER_TIME_WINDOW,
    BUFFER_MAX_MESSAGES,
    BUFFER_MIN_SIMILARITY,
    PERSPECTIVE_ATTRIBUTES,
    CONTEXT_REQUIRED_WORDS,
    SAFE_CONTEXT_INDICATORS,
    TOXIC_INDICATORS,
    THREAT_PATTERNS,
    PROFANITY_PATTERNS,
    EXPLICIT_PATTERNS,
    LEET_SPEAK_MAP,
    LINK_PATTERN,
    COLORS,
    PUNISHMENT_TYPES,
    VALID_FEATURES,
    FEATURE_MAP,
    PERMISSION_LEVELS
};