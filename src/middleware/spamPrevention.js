class SpamPrevention {
    constructor() {
        this.userCommandTracker = new Map();
        this.commandWindow = 5000; // 5 seconds
        this.maxCommands = 3;
    }

    check(userId) {
        const now = Date.now();
        
        if (!this.userCommandTracker.has(userId)) {
            this.userCommandTracker.set(userId, []);
        }
        
        let tracker = this.userCommandTracker.get(userId);
        tracker = tracker.filter(time => now - time < this.commandWindow);
        
        if (tracker.length >= this.maxCommands) {
            return {
                isSpamming: true,
                timeRemaining: Math.ceil((this.commandWindow - (now - tracker[0])) / 1000)
            };
        }
        
        tracker.push(now);
        this.userCommandTracker.set(userId, tracker);
        
        return { isSpamming: false };
    }

    cleanup() {
        const now = Date.now();
        for (const [userId, tracker] of this.userCommandTracker.entries()) {
            const filtered = tracker.filter(time => now - time < this.commandWindow);
            if (filtered.length === 0) {
                this.userCommandTracker.delete(userId);
            } else {
                this.userCommandTracker.set(userId, filtered);
            }
        }
    }
}

module.exports = SpamPrevention;