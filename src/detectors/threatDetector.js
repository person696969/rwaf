const { THREAT_PATTERNS, SAFE_CONTEXT_INDICATORS } = require('../config/constants');
const TextNormalizer = require('../utils/textNormalizer');

class ThreatDetector {
    static hasSafeContext(text) {
        if (typeof text !== 'string') return false;
        
        try {
            const normalized = TextNormalizer.normalize(text);
            
            for (const indicator of SAFE_CONTEXT_INDICATORS) {
                if (normalized.includes(indicator)) {
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Error checking safe context:', error);
            return false;
        }
    }

    static check(text) {
        if (typeof text !== 'string') {
            return { isThreat: false, confidence: 'none', patterns: [] };
        }
        
        try {
            const normalized = TextNormalizer.normalize(text);
            const matchedPatterns = [];
            let confidence = 'none';
            
            if (this.hasSafeContext(text)) {
                console.log(`✅ Safe context detected - allowing message`);
                return { isThreat: false, confidence: 'safe_context', patterns: [] };
            }
            
            for (const pattern of THREAT_PATTERNS) {
                pattern.lastIndex = 0;
                if (pattern.test(normalized)) {
                    matchedPatterns.push(pattern.source);
                    confidence = 'high';
                    pattern.lastIndex = 0;
                }
            }
            
            return {
                isThreat: matchedPatterns.length > 0,
                confidence: confidence,
                patterns: matchedPatterns
            };
        } catch (error) {
            console.error('Error checking threats:', error);
            return { isThreat: false, confidence: 'none', patterns: [] };
        }
    }
}

module.exports = ThreatDetector;