const { DatabaseService } = require('./services/database/database-service.cjs');
const { CachedDataDB } = require('./services/database/db/cached-data-db.cjs');

exports.App = class App {
    
    server;
    error; // could make this an array if multiple errors handling but just wanted to keep it simple
    services = {
        db: new DatabaseService()
    };

    cachedData = {};

    constructor() {}

    async initialize() {
        const bodyParser = require('body-parser');

        this.server = require('express')();
        this.server.use(bodyParser.urlencoded({ extended: false }));
        this.server.use(bodyParser.json());

        this.server.get('/keys', this.getKeys);
        this.server.get('/data/:key', this.getCachedData);
        this.server.post('/data/:key', this.updateCachedData);
        this.server.delete('/data/:key', this.removeCachedData);
        this.server.delete('/data', this.removeAllCachedData);

        this.error = await this.services.db.connect();

        return this;
    }

    getKeys = async (_req, res) => {
        const data = await new CachedDataDB(this.services.db).getAllKeys();
        res.send(data);
    }

    getCachedData = async (req, res) => {
        const key = req.params?.key;
        const data = await new CachedDataDB(this.services.db).get(key);
        res.send(data);
    }

    updateCachedData = async (req, res) => {
        const key = req.params?.key;
        const data = req.body?.data;
        res.send(await new CachedDataDB(this.services.db).edit(key, data));
    }

    removeCachedData = async (req, res) => {
        const key = req.params?.key;
        if (!key) {
            res.send();
        }
        res.send(await new CachedDataDB(this.services.db).delete(req.params?.key));
    }
    
    removeAllCachedData = async (req, res) => {
        res.send(await new CachedDataDB(this.services.db).delete());
    }

    start(port, message = '') {
        if (!this.error) {
            this.server.listen(port, () => {
                if (message) {
                    console.log(message);
                }
            });
        } else {
            console.log('APP-ERROR: ', this.error);
        }
        return this;
    }

}