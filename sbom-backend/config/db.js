const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if we have a valid MONGODB_URI
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sbom-finder';
    
    if (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://')) {
      throw new Error('Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"');
    }
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB; 