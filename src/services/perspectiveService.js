const Perspective = require('perspective-api-client');
const env = require('../config/environment');
const { PERSPECTIVE_ATTRIBUTES } = require('../config/constants');

class PerspectiveService {
    constructor() {
        this.enabled = false;
        try {
            if (!env.perspectiveApiKey) {
                console.warn('⚠️  Perspective API key not provided - toxicity detection disabled');
                return;
            }
            
            this.client = new Perspective({
                apiKey: env.perspectiveApiKey
            });
            this.enabled = true;
            console.log('✅ Perspective API initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Perspective API:', error.message);
            console.warn('⚠️  Perspective API disabled - bot will continue without it');
        }
    }

    async analyzeBasic(text) {
        if (!this.enabled) {
            return 0;
        }
        
        try {
            const analysis = await this.client.analyze(text, {
                attributes: ['TOXICITY'],
                doNotStore: true
            });

            return analysis.attributeScores.TOXICITY?.summaryScore?.value || 0;
        } catch (error) {
            this.handleError(error);
            return 0;
        }
    }

    async analyzeDetailed(text) {
        if (!this.enabled) {
            return {
                toxicity: 0,
                severeToxicity: 0,
                identityAttack: 0,
                insult: 0,
                profanity: 0,
                threat: 0
            };
        }
        
        try {
            const analysis = await this.client.analyze(text, {
                attributes: PERSPECTIVE_ATTRIBUTES,
                doNotStore: true
            });

            return {
                toxicity: analysis.attributeScores.TOXICITY?.summaryScore?.value || 0,
                severeToxicity: analysis.attributeScores.SEVERE_TOXICITY?.summaryScore?.value || 0,
                identityAttack: analysis.attributeScores.IDENTITY_ATTACK?.summaryScore?.value || 0,
                insult: analysis.attributeScores.INSULT?.summaryScore?.value || 0,
                profanity: analysis.attributeScores.PROFANITY?.summaryScore?.value || 0,
                threat: analysis.attributeScores.THREAT?.summaryScore?.value || 0
            };
        } catch (error) {
            this.handleError(error);
            return {
                toxicity: 0,
                severeToxicity: 0,
                identityAttack: 0,
                insult: 0,
                profanity: 0,
                threat: 0
            };
        }
    }

    handleError(error) {
        if (error.message?.includes('rate limit')) {
            console.warn('⚠️  Perspective API rate limit reached');
        } else if (error.message?.includes('LANGUAGE_NOT_SUPPORTED') || 
                   error.message?.includes('does not support')) {
            console.warn('⚠️  Language/Attribute not supported');
        } else {
            console.error('❌ Perspective API error:', error.message);
        }
    }
}

module.exports = PerspectiveService;
