const express = require('express');
const env = require('../config/environment');

class ExpressServer {
    constructor(client) {
        this.client = client;
        this.app = express();
        this.port = env.port;
        
        this.setupRoutes();
    }

    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.json({
                status: this.client.maintenanceMode ? 'maintenance' : 'online',
                bot: this.client.user ? this.client.user.tag : 'Starting...',
                servers: this.client.guilds.cache.size,
                uptime: this.client.uptime ? Math.floor(this.client.uptime / 1000) : 0,
                timestamp: new Date().toISOString()
            });
        });

        this.app.get('/health', (req, res) => {
            res.json({
                status: this.client.isReady() ? 
                    (this.client.maintenanceMode ? 'maintenance' : 'healthy') : 
                    'starting',
                ping: this.client.ws.ping,
                servers: this.client.guilds.cache.size,
                maintenance: this.client.maintenanceMode || false
            });
        });
    }

    start() {
        this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`🌐 Web server running on 0.0.0.0:${this.port}`);
        });
    }
}

module.exports = ExpressServer;
