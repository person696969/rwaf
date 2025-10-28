const { PROFANITY_PATTERNS } = require('../config/constants');
const TextNormalizer = require('../utils/textNormalizer');

class ProfanityDetector {
    static check(text) {
        if (typeof text !== 'string') return { found: false, words: [] };
        
        try {
            const normalized = TextNormalizer.normalize(text);
            const foundWords = [];
            
            for (const pattern of PROFANITY_PATTERNS) {
                pattern.lastIndex = 0;
                const matches = normalized.match(pattern);
                if (matches) {
                    foundWords.push(...matches);
                }
                pattern.lastIndex = 0;
            }
            
            return {
                found: foundWords.length > 0,
                words: [...new Set(foundWords)]
            };
        } catch (error) {
            console.error('Error checking profanity:', error);
            return { found: false, words: [] };
        }
    }
}

module.exports = ProfanityDetector;