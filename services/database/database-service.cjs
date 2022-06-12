const { CONFIG } = require('../../app-config.cjs');

exports.DatabaseService = class DatabaseService {

    // would make a class model for all services to handle all similar but wanted to keep it simple
    
    client;

    async connect(url = CONFIG.DB.Url) {
        try {
            const { MongoClient } = require('mongodb');
            this.client = new MongoClient(url);
            await this.client.connect();
        } catch (err) {
            return 'DATABASE-SERVICE: ' + err.toString();
        }
    }

    getDataSource(dbName, collection = null) {
        const db = this.client.db(dbName);
        return collection ? db.collection(collection) : db;
    }

    async close() {
        await this.client.close();
    }

}