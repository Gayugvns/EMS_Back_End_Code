const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connect();
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        autoIndex: true, // Enable automatic index creation
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      });

      console.log('MongoDB Connected Successfully');
      console.log(`Database: ${mongoose.connection.name}`);
      console.log(`Host: ${mongoose.connection.host}`);
      
      // Initialize dynamic collections
      await this.initializeDynamicCollections();
      
    } catch (error) {
      console.error(' MongoDB Connection Error:', error.message);
      process.exit(1);
    }
  }

  async initializeDynamicCollections() {
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Available Collections:', collections.map(c => c.name));
      
      // Create indexes for existing collections
      await this.createIndexes();
      
    } catch (error) {
      console.error(' Collection initialization error:', error);
    }
  }

  async createIndexes() {
    const User = require('../models/User');
    const Employee = require('../models/Employee');
    const Config = require('../models/Config');
    
    // Create indexes for each model
    await User.createIndexes();
    await Employee.createIndexes();
    await Config.createIndexes();
    
    console.log('✅ Database indexes created successfully');
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

module.exports = Database.getInstance();