const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function migrate() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI not found in .env.local at path:", path.join(__dirname, '../.env.local'));
        process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);

    const EmsUserSchema = new mongoose.Schema({
        ssoUserId: String,
        status: String
    }, { strict: false });

    const EmsUser = mongoose.model('EmsUser', EmsUserSchema, 'emsusers');

    console.log("Updating existing users without a status field...");
    const result = await EmsUser.updateMany(
        { status: { $exists: false } },
        { $set: { status: 'approved' } }
    );

    console.log(`Updated ${result.modifiedCount} users to 'approved' status.`);
    
    const resultNull = await EmsUser.updateMany(
        { status: null },
        { $set: { status: 'approved' } }
    );
    console.log(`Updated ${resultNull.modifiedCount} users with null status to 'approved'.`);

    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
