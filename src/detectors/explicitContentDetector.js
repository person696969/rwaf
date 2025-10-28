const { EXPLICIT_PATTERNS } = require('../config/constants');
const TextNormalizer = require('../utils/textNormalizer');
const ThreatDetector = require('./threatDetector');

class ExplicitContentDetector {
    static check(text) {
        if (typeof text !== 'string') return false;
        
        try {
            const normalized = TextNormalizer.normalize(text);
            
            if (ThreatDetector.hasSafeContext(text)) {
                return false;
            }
            
            for (const pattern of EXPLICIT_PATTERNS) {
                pattern.lastIndex = 0;
                if (pattern.test(normalized)) {
                    pattern.lastIndex = 0;
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Error checking explicit content:', error);
            return false;
        }
    }
}

module.exports = ExplicitContentDetector;