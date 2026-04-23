const mongoose = require('mongoose');
const { migrateLegacyRevisionRatings } = require('../migrations/migrateRevisionRatings');

const buildMongoUri = () => {
    const rawMongoUri = process.env.MONGO_URI;
    const username = process.env.MONGODB_USER_NAME;
    const password = process.env.MONGODB_PASSWORD;

    if (!rawMongoUri) {
        throw new Error('MONGO_URI is required');
    }

    if (!username || !password) {
        return rawMongoUri;
    }

    try {
        const parsed = new URL(rawMongoUri);
        if (parsed.username || parsed.password) {
            return rawMongoUri;
        }

        parsed.username = username;
        parsed.password = password;
        return parsed.toString();
    } catch (error) {
        console.warn('[DB] Could not inject MongoDB credentials into MONGO_URI, using raw value:', error.message);
        return rawMongoUri;
    }
};

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(buildMongoUri());
        await migrateLegacyRevisionRatings();
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
