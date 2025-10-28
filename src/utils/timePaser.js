const { LIMITS } = require('../config/constants');

function parseTimeoutDuration(duration) {
    if (typeof duration !== 'string') return null;
    
    const match = duration.match(/^(\d+)([mhd])$/);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    let milliseconds;
    switch (unit) {
        case 'm':
            milliseconds = value * 60 * 1000;
            break;
        case 'h':
            milliseconds = value * 60 * 60 * 1000;
            break;
        case 'd':
            milliseconds = value * 24 * 60 * 60 * 1000;
            break;
        default:
            return null;
    }
    
    if (milliseconds > LIMITS.MAX_TIMEOUT_DAYS * 24 * 60 * 60 * 1000) {
        return null;
    }
    
    return milliseconds;
}

module.exports = { parseTimeoutDuration };