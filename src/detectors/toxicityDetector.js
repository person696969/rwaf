const ProfanityDetector = require('./profanityDetector');
const ThreatDetector = require('./threatDetector');
const ExplicitContentDetector = require('./explicitContentDetector');
const TextNormalizer = require('../utils/textNormalizer');
const { CONTEXT_REQUIRED_WORDS } = require('../config/constants');

class ToxicityDetector {
    constructor(bot) {
        this.bot = bot;
    }

    async analyze(message, isVerification = false) {
        if (!message || !message.guild || !message.author) return null;
        if (message.author.bot) return null;
        
        try {
            if (!isVerification) {
                await this.incrementStat('totalMessages');
            }
            
            const config = await this.getConfig(message.guild.id);
            
            if (!config.enabled && !isVerification) return null;
            
            if (await this.isWhitelisted(message.guild.id, message.author.id) && !isVerification) {
                return null;
            }
            
            // Check rate limits
            if (!isVerification) {
                const rateLimitCheck = this.checkRateLimits(message.guild.id, message.author.id, config);
                if (rateLimitCheck.limited) {
                    console.warn(`⚠️ ${rateLimitCheck.type} rate limit reached`);
                    return null;
                }
            }
            
            // Check spam
            if (config.spamProtection && !isVerification) {
                const spamResult = await this.checkSpam(message, config);
                if (spamResult.isSpam) return null;
            }
            
            // Check links
            if (config.linkProtection && !isVerification) {
                const linkResult = await this.checkLinks(message);
                if (linkResult.hasLinks) return null;
            }
            
            // Check mention spam
            if (config.mentionSpamProtection && !isVerification) {
                const mentionResult = await this.checkMentionSpam(message, config);
                if (mentionResult.isSpam) return null;
            }
            
            // Prepare text for analysis
            let textToAnalyze = message.content || '';
            let imageText = null;
            let detectionMethod = 'Text Analysis';
            let multiLineInfo = null;
            
            // Multi-line detection
            if (config.antiBypass && textToAnalyze.trim() && !isVerification) {
                const words = textToAnalyze.trim().split(/\s+/).filter(w => w.length > 0);
                
                this.bot.multiLineDetector.addToBuffer(
                    message.guild.id,
                    message.author.id,
                    message.channel.id,
                    textToAnalyze,
                    message.id
                );
                
                if (words.length >= 1 && words.length <= 5) {
                    multiLineInfo = this.bot.multiLineDetector.check(
                        message.guild.id,
                        message.author.id,
                        message.channel.id
                    );
                    
                    if (multiLineInfo) {
                        console.log(`🔍 Multi-line detected: "${multiLineInfo.combinedText}"`);
                        textToAnalyze = multiLineInfo.combinedText;
                        detectionMethod = 'Smart Multi-Line Detection';
                    }
                } else if (words.length > 5) {
                    this.bot.multiLineDetector.clear(
                        message.guild.id,
                        message.author.id,
                        message.channel.id
                    );
                }
            }
            
            // Image detection
            if (config.imageDetection && message.attachments && message.attachments.size > 0) {
                for (const attachment of message.attachments.values()) {
                    if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                        imageText = await this.bot.imageAnalysisService.analyzeImage(attachment.url);
                        if (imageText) {
                            textToAnalyze += ' ' + imageText;
                            detectionMethod = multiLineInfo ? 
                                'Multi-Line + Image Analysis' : 
                                'Image + Text Analysis';
                        }
                    }
                }
            }
            
            if (!textToAnalyze.trim()) return null;
            
            // Check whitelisted words
            if (this.hasWhitelistedWords(textToAnalyze, config.whitelistWords)) {
                if (multiLineInfo && !isVerification) {
                    this.bot.multiLineDetector.clear(
                        message.guild.id,
                        message.author.id,
                        message.channel.id
                    );
                }
                return isVerification ? { safe: true, reason: 'Contains whitelisted word' } : null;
            }
            
            // Check blacklisted words
            const blacklistResult = this.checkBlacklistedWords(textToAnalyze, config.blacklistWords);
            if (blacklistResult.found) {
                return await this.handleBlacklistedWord(message, blacklistResult, config, detectionMethod, imageText, multiLineInfo, isVerification);
            }
            
            // Check profanity
            const profanityResult = ProfanityDetector.check(textToAnalyze);
            if (profanityResult.found) {
                return await this.handleProfanity(message, profanityResult, config, detectionMethod, imageText, multiLineInfo, isVerification);
            }
            
            // Check threats
            const threatResult = ThreatDetector.check(textToAnalyze);
            if (threatResult.isThreat && threatResult.confidence === 'high') {
                return await this.handleThreat(message, config, detectionMethod, imageText, multiLineInfo, isVerification);
            }
            
            if (threatResult.confidence === 'safe_context') {
                if (multiLineInfo && !isVerification) {
                    this.bot.multiLineDetector.clear(message.guild.id, message.author.id, message.channel.id);
                }
                return isVerification ? { safe: true, reason: 'Safe context' } : null;
            }
            
            // Check explicit content
            const hasExplicitContent = ExplicitContentDetector.check(textToAnalyze);
            if (hasExplicitContent) {
                return await this.handleExplicitContent(message, config, detectionMethod, imageText, multiLineInfo, isVerification);
            }
            
            // Deep context analysis
            if (config.deepContextAnalysis && this.requiresContextAnalysis(textToAnalyze)) {
                if (ThreatDetector.hasSafeContext(textToAnalyze)) {
                    if (multiLineInfo && !isVerification) {
                        this.bot.multiLineDetector.clear(message.guild.id, message.author.id, message.channel.id);
                    }
                    return isVerification ? { safe: true, reason: 'Safe context' } : null;
                }
            }
            
            // Perspective API analysis
            const normalizedText = TextNormalizer.normalize(textToAnalyze);
            const basicToxicity = await this.bot.perspectiveService.analyzeBasic(normalizedText);
            
            const thresholdDecimal = config.threshold / 10;
            
            if (basicToxicity < thresholdDecimal * 0.8) {
                if (multiLineInfo && !isVerification) {
                    this.bot.multiLineDetector.clear(message.guild.id, message.author.id, message.channel.id);
                }
                return isVerification ? { safe: true, reason: 'Below threshold', scores: { toxicity: basicToxicity } } : null;
            }
            
            // Get detailed scores
            const scores = await this.bot.perspectiveService.analyzeDetailed(normalizedText);
            const maxScore = Math.max(...Object.values(scores));
            
            // Context multiplier
            let contextMultiplier = 1.0;
            if (config.contextAnalysis && !isVerification) {
                const history = await this.bot.dbManager.get('history', `${message.guild.id}_${message.author.id}`) || [];
                if (history.length >= 3) {
                    const recentToxic = history.filter(msg => msg.toxicity > thresholdDecimal * 0.7).length;
                    if (recentToxic >= 2) {
                        contextMultiplier = 1.2;
                    }
                }
            }
            
            const finalScore = maxScore * contextMultiplier;
            
            if (!isVerification) {
                await this.addToHistory(message.guild.id, message.author.id, message.content, maxScore);
            }
            
            if (isVerification) {
                return finalScore > thresholdDecimal ? 
                    { toxic: true, reason: 'Exceeds threshold', scores, finalScore, threshold: thresholdDecimal } :
                    { safe: true, reason: 'Below threshold', scores, finalScore, threshold: thresholdDecimal };
            }
            
            if (finalScore > thresholdDecimal) {
                await this.handleToxicMessage(message, scores, config, detectionMethod, hasExplicitContent, imageText, null, multiLineInfo);
                
                if (multiLineInfo) {
                    this.bot.multiLineDetector.clear(message.guild.id, message.author.id, message.channel.id);
                }
            } else if (multiLineInfo) {
                this.bot.multiLineDetector.clear(message.guild.id, message.author.id, message.channel.id);
            }
            
            return null;
            
        } catch (error) {
            console.error('Error in toxicity detection:', error);
            await this.bot.errorHandler.logError(this.bot.dbManager, error, 'toxicityDetector', message);
            return isVerification ? { error: true, message: error.message } : null;
        }
    }

    // Helper methods
    checkRateLimits(guildId, userId, config) {
        const globalCheck = this.bot.rateLimiter.checkGlobal();
        if (globalCheck.limited) return globalCheck;
        
        const guildCheck = this.bot.rateLimiter.checkGuild(guildId, config.rateLimit);
        if (guildCheck.limited) return guildCheck;
        
        const userCheck = this.bot.rateLimiter.checkUser(userId);
        if (userCheck.limited) return userCheck;
        
        return { limited: false };
    }

    async getConfig(guildId) {
        const defaultConfig = require('../config/defaultConfig');
        let config = await this.bot.dbManager.get('config', `guild_${guildId}`);
        return config ? { ...defaultConfig, ...config } : defaultConfig;
    }

    async isWhitelisted(guildId, userId) {
        const config = await this.getConfig(guildId);
        return Array.isArray(config.whitelist) && config.whitelist.includes(userId);
    }

    requiresContextAnalysis(text) {
        const normalized = TextNormalizer.normalize(text);
        return CONTEXT_REQUIRED_WORDS.some(word => normalized.includes(word));
    }

    hasWhitelistedWords(text, whitelistWords) {
        if (!Array.isArray(whitelistWords) || whitelistWords.length === 0) return false;
        const normalized = TextNormalizer.normalize(text);
        return whitelistWords.some(word => normalized.includes(TextNormalizer.normalize(word)));
    }

    checkBlacklistedWords(text, blacklistWords) {
        if (!Array.isArray(blacklistWords) || blacklistWords.length === 0) {
            return { found: false, words: [] };
        }
        
        const normalized = TextNormalizer.normalize(text);
        const foundWords = [];
        
        for (const word of blacklistWords) {
            const normalizedWord = TextNormalizer.normalize(word);
        const esc = normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${esc}\\b`, 'gi');
            if (regex.test(normalized)) {
                foundWords.push(word);
            }
        }
        
        return { found: foundWords.length > 0, words: foundWords };
    }

    async incrementStat(statName) {
        try {
            const current = await this.bot.dbManager.get('stats', statName) || 0;
            await this.bot.dbManager.set('stats', statName, current + 1);
        } catch (error) {
            console.error('Error incrementing stat:', error);
        }
    }

    async addToHistory(guildId, userId, content, toxicity) {
        try {
            let history = await this.bot.dbManager.get('history', `${guildId}_${userId}`) || [];
            history.push({
                content: content.substring(0, 100),
                toxicity,
                timestamp: Date.now()
            });
            
            if (history.length > 20) history = history.slice(-20);
            
            await this.bot.dbManager.set('history', `${guildId}_${userId}`, history);
        } catch (error) {
            console.error('Error adding to history:', error);
        }
    }

    async checkSpam(message, config) {
        // Implement spam checking logic
        return { isSpam: false };
    }

    async checkLinks(message) {
        // Implement link checking logic
        return { hasLinks: false };
    }

    async checkMentionSpam(message, config) {
        // Implement mention spam checking logic
        return { isSpam: false };
    }

    async handleBlacklistedWord(message, blacklistResult, config, detectionMethod, imageText, multiLineInfo, isVerification) {
        // Implement blacklisted word handling
    }

    async handleProfanity(message, profanityResult, config, detectionMethod, imageText, multiLineInfo, isVerification) {
        // Implement profanity handling
    }

    async handleThreat(message, config, detectionMethod, imageText, multiLineInfo, isVerification) {
        // Implement threat handling
    }

    async handleExplicitContent(message, config, detectionMethod, imageText, multiLineInfo, isVerification) {
        // Implement explicit content handling
    }

    async handleToxicMessage(message, scores, config, detectionMethod, hasExplicitContent, imageText, customReason, multiLineInfo) {
        // Implement toxic message handling with punishment system
    }
}

module.exports = ToxicityDetector;