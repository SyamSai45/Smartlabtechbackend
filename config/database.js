import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }
    
    console.log('════════════════════════════════════════════════');
    console.log('📡 Connecting to MongoDB Atlas...');
    console.log('════════════════════════════════════════════════');
    
    // Connection options
    const options = {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      family: 4, // Use IPv4
      retryWrites: true,
      w: 'majority'
    };
    
    const conn = await mongoose.connect(mongoURI, options);
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`🔢 Port: ${conn.connection.port}`);
    console.log('════════════════════════════════════════════════\n');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
    return conn;
  } catch (error) {
    console.error('\n❌ MongoDB Connection Error:', error.message);
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('─────────────────────────────────────────────────');
    
    if (error.message.includes('Authentication failed')) {
      console.log('1. Authentication Issue - Check your credentials:');
      console.log('   Username: syampixelmindsolutions_db_user');
      console.log('   Password: Pixelmind1234');
      console.log('   Solution: Reset password in MongoDB Atlas');
    }
    
    if (error.message.includes('getaddrinfo') || error.message.includes('ENOTFOUND')) {
      console.log('2. DNS Resolution Issue - Try these:');
      console.log('   • Run as Administrator: ipconfig /flushdns');
      console.log('   • Restart your computer');
      console.log('   • Use mobile hotspot to test');
    }
    
    if (error.message.includes('whitelist') || error.message.includes('IP')) {
      console.log('3. IP Whitelist Issue:');
      console.log('   • Go to MongoDB Atlas → Network Access');
      console.log('   • Add IP: 0.0.0.0/0');
      console.log('   • Wait 2 minutes for changes');
    }
    
    console.log('\n4. Current Connection String (check if correct):');
    // console.log(`   ${mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
    
    console.log('\n5. Try Local MongoDB Instead:');
    console.log('   Install MongoDB locally and use:');
    console.log('   mongodb://localhost:27017/smartlabtech');
    
    console.log('─────────────────────────────────────────────────\n');
    
    // Don't exit - keep server running for local development
    console.log('⚠️ Continuing without database - using fallback mode');
    return null;
  }
};

export default connectDB;