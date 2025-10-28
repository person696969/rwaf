const { LEET_SPEAK_MAP } = require('../config/constants');

class TextNormalizer {
    static normalize(text) {
        if (typeof text !== 'string') return '';
        
        try {
            let normalized = text.toLowerCase();
            normalized = normalized.replace(/(.)\s+(?=\1)/g, '$1');
            normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');
            
            Object.keys(LEET_SPEAK_MAP).forEach(char => {
                const esc = char.replace(/[.*+?^${}()|[\]\\]/g, '\\            milliseconds = value * 60 * 1000;
            break;
        case 'h':
            millis');
                normalized = normalized.replace(new RegExp(esc, 'g'), LEET_SPEAK_MAP[char]);
            });
            
            normalized = normalized.replace(/[^\w\s]/g, ' ');
            normalized = normalized.replace(/\s+/g, ' ');
            normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            return normalized.trim();
        } catch (error) {
            console.error('Error normalizing text:', error);
            return text;
        }
    }

    static calculateSimilarity(text1, text2) {
        const words1 = new Set(this.normalize(text1).split(/\s+/).filter(w => w.length > 2));
        const words2 = new Set(this.normalize(text2).split(/\s+/).filter(w => w.length > 2));
        
        if (words1.size === 0 || words2.size === 0) return 0;
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size;
    }
}

module.exports = TextNormalizer;