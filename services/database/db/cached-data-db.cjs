const { CONFIG } = require("../../../app-config.cjs");

exports.CachedDataDB = class CachedDataDB {

    db;
    timeToLive = CONFIG.TTLInSeconds * 1000;

    constructor(dbService) {
        this.db = dbService.getDataSource(CONFIG.DB.CachedDB.Name, CONFIG.DB.CachedDB.Collection);
    }

    getValidObject() {
        return { createdAt: { $gt: Date.now() - this.timeToLive }};
    }

    async get(key) {
        this.db.deleteMany({ key, createdAt: { $lte: Date.now() - this.timeToLive } });

        var results = await this.db
            .find({ key, ...this.getValidObject() })
            .sort({ createdAt:-1 })
            .limit(1)
            .toArray();
        
        var data;

        if (!results.length) {
            console.log('Cache miss');
            data = await this.edit(key, 'ABC-' + Date.now());
        } else {
            console.log('Cache hit');
            data = results[0];
        }

        return data;
    }

    async getAllKeys() {
        return await this.db
            .find(this.getValidObject())
            .project({key:1, _id: 0})
            .toArray();
    }
    
    async edit(key, data) {
        var doc = { key, data, createdAt: Date.now() };

        const res = await this.db.updateOne({ key, ...this.getValidObject() }, { $set: doc }, { upsert: true });
        doc._id = res.upsertedId;
        
        if (doc._id) {
            const isLimitReached = (await this.db.count({ ...this.getValidObject() })) - 1 > CONFIG.DataLimit;

            if (isLimitReached) {
                // Delete the oldest created doc
                const oldest = await this.db
                    .find({ ...this.getValidObject() })
                    .sort({ createdAt: 1 })
                    .limit(1)
                    .toArray();

                this.db.deleteOne({ _id: oldest[0]._id });
            }
        }

        return doc;
    }

    async delete(key) {
        const deleteAll = !key;
        return this.db.deleteMany(deleteAll ? {} : { key, ...this.getValidObject() });
    }

}