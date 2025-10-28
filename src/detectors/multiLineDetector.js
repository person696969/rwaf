const { TIME_WINDOWS, LIMITS, TOXIC_INDICATORS } = require('../config/constants');
const TextNormalizer = require('../utils/textNormalizer');

class MultiLineDetector {
    constructor() {
        this.messageBuffer = new Map();
        this.bufferTimeWindow = TIME_WINDOWS.BUFFER;
        this.maxMessages = LIMITS.BUFFER_MAX_MESSAGES;
    }

    addToBuffer(guildId, userId, channelId, content, messageId) {
        if (!guildId || !userId || !channelId || !content) return;
        
        try {
            const key = `${guildId}_${userId}_${channelId}`;
            const now = Date.now();
            
            if (!this.messageBuffer.has(key)) {
                this.messageBuffer.set(key, []);
            }
            
            const buffer = this.messageBuffer.get(key);
            const validMessages = buffer.filter(msg => now - msg.timestamp < this.bufferTimeWindow);
            
            const words = content.trim().split(/\s+/).filter(w => w.length > 0);
            validMessages.push({
                content: content.trim(),
                wordCount: words.length,
                timestamp: now,
                messageId: messageId
            });
            
            if (validMessages.length > this.maxMessages) {
                validMessages.shift();
            }
            
            this.messageBuffer.set(key, validMessages);
            return validMessages;
        } catch (error) {
            console.error('Error adding to message buffer:', error);
            return [];
        }
    }

    hasToxicCoherence(messages) {
        const combinedText = messages.map(m => m.content).join(' ');
        const normalized = TextNormalizer.normalize(combinedText);
        
        let toxicIndicatorCount = 0;
        for (const indicator of TOXIC_INDICATORS) {
            if (normalized.includes(indicator)) {
                toxicIndicatorCount++;
            }
        }
        
        const strongToxicWords = ['kys', 'kill yourself', 'i hate you', 'you suck'];
        const hasStrongToxic = strongToxicWords.some(word => normalized.includes(word));
        
        return toxicIndicatorCount >= 2 || hasStrongToxic;
    }

    check(guildId, userId, channelId) {
        if (!guildId || !userId || !channelId) return null;
        
        try {
            const key = `${guildId}_${userId}_${channelId}`;
            const buffer = this.messageBuffer.get(key);
            
            if (!buffer || buffer.length < 2) {
                return null;
            }
            
            const recentMessages = buffer.slice(-4);
            const shortMessages = recentMessages.filter(msg => msg.wordCount >= 1 && msg.wordCount <= 5);
            
            if (shortMessages.length < 2) {
                return null;
            }
            
            for (let i = 0; i < shortMessages.length - 1; i++) {
                for (let j = i + 1; j < shortMessages.length; j++) {
                    const msg1 = shortMessages[i];
                    const msg2 = shortMessages[j];
                    
                    const similarity = TextNormalizer.calculateSimilarity(msg1.content, msg2.content);
                    
                    const combination = [msg1, msg2];
                    if (this.hasToxicCoherence(combination)) {
                        const combinedText = combination.map(m => m.content).join(' ');
                        console.log(`🔍 Multi-line detected: "${combinedText}" (${(similarity * 100).toFixed(1)}%)`);
                        
                        return {
                            combinedText,
                            messageCount: combination.length,
                            wordCount: combination.reduce((sum, m) => sum + m.wordCount, 0),
                            messageIds: combination.map(m => m.messageId),
                            similarity: similarity
                        };
                    }
                }
            }
            
            if (shortMessages.length >= 3) {
                const last3 = shortMessages.slice(-3);
                if (this.hasToxicCoherence(last3)) {
                    const combinedText = last3.map(m => m.content).join(' ');
                    console.log(`🔍 Multi-line detected (3 msgs): "${combinedText}"`);
                    
                    return {
                        combinedText,
                        messageCount: last3.length,
                        wordCount: last3.reduce((sum, m) => sum + m.wordCount, 0),
                        messageIds: last3.map(m => m.messageId)
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error checking multi-line bypass:', error);
            return null;
        }
    }

    clear(guildId, userId, channelId) {
        if (!guildId || !userId || !channelId) return;
        
        try {
            const key = `${guildId}_${userId}_${channelId}`;
            this.messageBuffer.delete(key);
        } catch (error) {
            console.error('Error clearing message buffer:', error);
        }
    }

    cleanup() {
        const now = Date.now();
        
        for (const [key, buffer] of this.messageBuffer.entries()) {
            const filtered = buffer.filter(msg => now - msg.timestamp < this.bufferTimeWindow);
            if (filtered.length === 0) {
                this.messageBuffer.delete(key);
            } else {
                this.messageBuffer.set(key, filtered);
            }
        }
    }
}

module.exports = MultiLineDetector;