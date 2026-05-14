import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixSkuIssue = async () => {
  try {
    // Use standard connection string (not SRV) to avoid DNS issues
    const mongoURI = 'mongodb+srv://syamsai455_db_user:stJ1qsb1giOtNwEA@smartlab.nfikmbq.mongodb.net/?appName=smartlab';
    
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const collection = db.collection('products');
    
    // 1. Show current indexes
    console.log('📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // 2. Drop sku_1 index if it exists
    console.log('\n🗑️ Removing SKU index...');
    try {
      await collection.dropIndex('sku_1');
      console.log('   ✅ SKU index removed');
    } catch (error) {
      if (error.message.includes('index not found')) {
        console.log('   ℹ️ SKU index already removed');
      } else {
        console.log('   ⚠️ Error:', error.message);
      }
    }
    
    // 3. Remove sku field from all products
    console.log('\n🗑️ Removing sku field from all products...');
    const updateResult = await collection.updateMany(
      { sku: { $exists: true } },
      { $unset: { sku: "" } }
    );
    console.log(`   ✅ Updated ${updateResult.modifiedCount} products`);
    
    // 4. Verify final indexes
    console.log('\n📋 Final indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n✅ Fix completed successfully!');
    console.log('🚀 You can now create products without SKU errors\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Alternative: Use MongoDB Atlas web interface to drop the sku_1 index');
    process.exit(1);
  }
};

fixSkuIssue();