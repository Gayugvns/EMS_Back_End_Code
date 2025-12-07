const mongoose = require('mongoose');
require('dotenv').config();

const resetDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });


    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Drop all collections
    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

resetDatabase();