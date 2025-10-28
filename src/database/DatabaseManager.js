const { QuickDB } = require('quick.db');
const fs = require('fs');
const path = require('path');
const env = require('../config/environment');

class DatabaseManager {
    constructor() {
        this.databases = new Map();
        this.maxEntriesPerDB = env.maxEntriesPerDB;
        this.dbDirectory = env.dbDirectory;
        
        if (!fs.existsSync(this.dbDirectory)) {
            fs.mkdirSync(this.dbDirectory, { recursive: true });
        }
    }

    async getDatabase(type) {
        if (!this.databases.has(type)) {
            await this.loadDatabases(type);
        }
        return this.databases.get(type);
    }

    async loadDatabases(type) {
        const dbFiles = fs.readdirSync(this.dbDirectory)
            .filter(f => f.startsWith(`${type}_`) && f.endsWith('.sqlite'))
            .sort();

        const dbInstances = [];
        
        if (dbFiles.length === 0) {
            const newDB = new QuickDB({ 
                filePath: path.join(this.dbDirectory, `${type}_1.sqlite`)
            });
            dbInstances.push({ db: newDB, index: 1, entries: 0 });
        } else {
            for (const file of dbFiles) {
                const index = parseInt(file.match(/_(\d+)\.sqlite$/)[1]);
                const db = new QuickDB({ 
                    filePath: path.join(this.dbDirectory, file)
                });
                const entries = (await db.all()).length;
                dbInstances.push({ db, index, entries });
            }
        }

        this.databases.set(type, dbInstances);
        console.log(`✅ Loaded ${dbInstances.length} database(s) for ${type}`);
    }

    async get(type, key) {
        try {
            const databases = await this.getDatabase(type);
            
            for (const { db } of databases) {
                const value = await db.get(key);
                if (value !== null && value !== undefined) {
                    return value;
                }
            }
            
            return null;
        } catch (error) {
            console.error(`Error getting ${type}:${key}`, error);
            throw error;
        }
    }

    async set(type, key, value) {
        try {
            const databases = await this.getDatabase(type);
            
            for (const dbInstance of databases) {
                const existing = await dbInstance.db.get(key);
                if (existing !== null && existing !== undefined) {
                    await dbInstance.db.set(key, value);
                    return;
                }
            }

            let targetDB = databases[databases.length - 1];

            if (targetDB.entries >= this.maxEntriesPerDB) {
                console.log(`⚠️ Database ${type}_${targetDB.index} full, creating new...`);
                const newIndex = targetDB.index + 1;
                const newDB = new QuickDB({ 
                    filePath: path.join(this.dbDirectory, `${type}_${newIndex}.sqlite`)
                });
                const newInstance = { db: newDB, index: newIndex, entries: 0 };
                databases.push(newInstance);
                targetDB = newInstance;
                console.log(`✅ Created: ${type}_${newIndex}.sqlite`);
            }

            await targetDB.db.set(key, value);
            targetDB.entries++;
        } catch (error) {
            console.error(`Error setting ${type}:${key}`, error);
            throw error;
        }
    }

    async delete(type, key) {
        try {
            const databases = await this.getDatabase(type);
            
            for (const { db } of databases) {
                const exists = await db.get(key);
                if (exists !== null && exists !== undefined) {
                    await db.delete(key);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error(`Error deleting ${type}:${key}`, error);
            throw error;
        }
    }

    async all(type) {
        try {
            const databases = await this.getDatabase(type);
            const allData = [];
            
            for (const { db } of databases) {
                const data = await db.all();
                allData.push(...data);
            }
            
            return allData;
        } catch (error) {
            console.error(`Error getting all ${type}`, error);
            throw error;
        }
    }

    async deleteAllForGuild(guildId) {
        const types = ['config', 'strikes', 'history', 'spam_strikes', 'mention_strikes'];
        
        for (const type of types) {
            try {
                const databases = await this.getDatabase(type);
                
                for (const { db } of databases) {
                    const allData = await db.all();
                    
                    for (const item of allData) {
                        if (item.id && item.id.includes(guildId)) {
                            await db.delete(item.id);
                        }
                    }
                }
            } catch (error) {
                console.error(`Error deleting ${type} for guild ${guildId}`, error);
            }
        }
    }

    async getDatabaseStats() {
        const stats = {};
        
        for (const [type, databases] of this.databases.entries()) {
            stats[type] = {
                count: databases.length,
                totalEntries: databases.reduce((sum, db) => sum + db.entries, 0),
                databases: databases.map(db => ({
                    index: db.index,
                    entries: db.entries,
                    utilization: ((db.entries / this.maxEntriesPerDB) * 100).toFixed(2) + '%'
                }))
            };
        }
        
        return stats;
    }
}

module.exports = DatabaseManager;