const axios = require('axios');
const { checkURL } = require('anti-phish-advanced');

class LinkCheckService {
    async checkSuspiciousLink(url) {
        try {
            // Check with anti-phish-advanced
            const antiPhishResult = await checkURL(url);
            
            if (antiPhishResult && antiPhishResult.match) {
                console.log(`🚨 Phishing link detected: ${url}`);
                return { 
                    isSuspicious: true, 
                    reason: 'Phishing link detected',
                    source: 'anti-phish-advanced'
                };
            }
            
            // Check with psafe dfndr API
            try {
                const response = await axios.post(
                    'https://www.psafe.com/dfndr-lab/wp-content/themes/tonykuehn/inc/url_api_v2.php',
                    { url: url },
                    { 
                        timeout: 5000,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }
                );
                
                if (response.data && response.data.threat) {
                    console.log(`🚨 Suspicious link detected by PSafe: ${url}`);
                    return { 
                        isSuspicious: true, 
                        reason: 'Flagged by PSafe dfndr',
                        source: 'psafe'
                    };
                }
            } catch (psafeError) {
                console.warn('PSafe API check failed:', psafeError.message);
            }
            
            return { isSuspicious: false };
        } catch (error) {
            console.error('Error checking suspicious link:', error);
            return { isSuspicious: false };
        }
    }
}

module.exports = LinkCheckService;