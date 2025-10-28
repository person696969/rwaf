const Perspective = require('perspective-api-client');
const env = require('../config/environment');
const { ATTRIBUTES } = require('../config/constants');

class PerspectiveService {
    constructor() {
        try {
            this.client = new Perspective({
                apiKey: env.perspectiveApiKey
            });
            console.log('✅ Perspective API initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Perspective API:', error);
            throw error;
        }
    }

    async analyzeBasic(text) {
        try {
            const analysis = await this.client.analyze(text, {
                attributes: ['TOXICITY'],
                doNotStore: true
            });

            return analysis.attributeScores.TOXICITY?.summaryScore?.value || 0;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    async analyzeDetailed(text) {
        try {
            const analysis = await this.client.analyze(text, {
                attributes: ATTRIBUTES,
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
            throw error;
        }
    }

    handleError(error) {
        if (error.message?.includes('rate limit')) {
            console.warn('⚠️ Perspective API rate limit reached');
        } else if (error.message?.includes('LANGUAGE_NOT_SUPPORTED') || 
                   error.message?.includes('does not support')) {
            console.warn('⚠️ Language/Attribute not supported');
        } else {
            console.error('❌ Perspective API error:', error.message);
        }
    }
}

module.exports = PerspectiveService;