const antiPhish = require('anti-phish-advanced');
const axios = require('axios');
const env = require('../config/environment');

class PhishingDetectionService {
    constructor() {
        this.antiPhish = antiPhish;
        this.psafeApiUrl = env.psafeApiUrl;
        this.cache = new Map();
        this.cacheExpiry = 3600000;
        this.rateLimitDelay = 1000;
        this.lastRequest = 0;
    }

    async checkUrl(url) {
        try {
            const cacheKey = url.toLowerCase();
            const cached = this.cache.get(cacheKey);
            
            if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.result;
            }

            const antiPhishResult = await this.checkAntiPhish(url);
            const psafeResult = await this.checkPSafe(url);

            const result = {
                isPhishing: antiPhishResult.isPhishing || psafeResult.isPhishing,
                isMalware: psafeResult.isMalware,
                confidence: Math.max(antiPhishResult.confidence, psafeResult.confidence),
                source: antiPhishResult.isPhishing ? 'anti-phish' : (psafeResult.isPhishing || psafeResult.isMalware) ? 'psafe' : 'clean',
                details: {
                    antiPhish: antiPhishResult,
                    psafe: psafeResult
                }
            };

            this.cache.set(cacheKey, {
                result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            console.error('Error checking URL:', error);
            return {
                isPhishing: false,
                isMalware: false,
                confidence: 0,
                source: 'error',
                error: error.message
            };
        }
    }

    async checkAntiPhish(url) {
        try {
            const isPhishing = await this.antiPhish.checkLink(url);
            return {
                isPhishing: isPhishing,
                confidence: isPhishing ? 0.95 : 0.0,
                method: 'database'
            };
        } catch (error) {
            console.error('Anti-phish check error:', error);
            return {
                isPhishing: false,
                confidence: 0,
                error: error.message
            };
        }
    }

    async checkPSafe(url) {
        try {
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequest;
            
            if (timeSinceLastRequest < this.rateLimitDelay) {
                await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
            }

            this.lastRequest = Date.now();

            const response = await axios.post(this.psafeApiUrl, 
                new URLSearchParams({
                    url: url
                }), 
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: 5000
                }
            );

            const data = response.data;

            const isMalware = data.category === 'malware' || data.malware === true || data.status === 'malicious';
            const isPhishing = data.category === 'phishing' || data.phishing === true || data.status === 'phishing';
            
            let confidence = 0;
            if (isMalware || isPhishing) {
                confidence = data.confidence || 0.8;
            }

            return {
                isPhishing: isPhishing,
                isMalware: isMalware,
                confidence: confidence,
                category: data.category || 'unknown',
                method: 'api'
            };
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                console.error('PSafe API timeout');
            } else {
                console.error('PSafe API error:', error.message);
            }
            
            return {
                isPhishing: false,
                isMalware: false,
                confidence: 0,
                error: error.message
            };
        }
    }

    async checkMultipleUrls(urls) {
        const results = await Promise.all(
            urls.map(url => this.checkUrl(url))
        );

        return results.filter(result => result.isPhishing || result.isMalware);
    }

    extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+|discord\.gg\/[^\s]+|www\.[^\s]+)/gi;
        const matches = text.match(urlRegex) || [];
        
        return matches.map(url => {
            if (!url.startsWith('http')) {
                return 'http://' + url;
            }
            return url;
        });
    }

    cleanup() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp >= this.cacheExpiry) {
                this.cache.delete(key);
            }
        }
    }
}

module.exports = PhishingDetectionService;
