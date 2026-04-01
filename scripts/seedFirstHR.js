// scripts/finalSeed.js
import mongoose from 'mongoose';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

// 1. JWT_SECRET ensure karein - SAME AS IN YOUR LOGIN CONTROLLER
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET not found in .env');
  console.log('📝 Please add to .env file:');
  console.log('JWT_SECRET=your_actual_jwt_secret_used_in_controller');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;

// 2. EXACT SAME ENCRYPTION FUNCTION as in employeeController.js
const encryptPassword = (password) => {
  return CryptoJS.AES.encrypt(password, JWT_SECRET).toString();
};

// 3. EXACT SAME DECRYPTION FUNCTION (for verification)
const decryptPassword = (encryptedPassword) => {
  const bytes = CryptoJS.AES.decrypt(encryptedPassword, JWT_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};

const seedFirstHR = async () => {
  let conn = null;
  
  try {
    console.log('🚀 Starting seed process...');
    console.log('🔑 JWT_SECRET length:', JWT_SECRET.length);
    
    // Connect to database
    conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ERP');
    console.log('✅ Database connected');
    
    // Check if HR already exists
    const db = mongoose.connection.db;
    const existingHR = await db.collection('employees').findOne({ 
      email: 'digicoders@gmail.com' 
    });
    
    if (existingHR) {
      console.log('\n⚠️  HR already exists in database!');
      console.log('📧 Email:', existingHR.email);
      
      // Test existing password
      if (existingHR.password) {
        try {
          const decrypted = decryptPassword(existingHR.password);
          console.log('🔓 Password decrypts to:', decrypted);
        } catch (err) {
          console.log('🔓 Password decryption failed');
        }
      }
      
      console.log('\n💡 Try login with: digicoders@gmail.com / 123456');
      return;
    }
    
    console.log('\n🔐 Encrypting password...');
    const password = '123456';
    const encryptedPassword = encryptPassword(password);
    
    console.log('📊 Encryption Details:');
    console.log('  Original password:', password);
    console.log('  Encrypted:', encryptedPassword.substring(0, 50) + '...');
    console.log('  Length:', encryptedPassword.length, 'chars');
    
    // Verify encryption
    const decryptedCheck = decryptPassword(encryptedPassword);
    console.log('  Decrypted check:', decryptedCheck);
    console.log('  ✅ Encryption verified:', password === decryptedCheck);
    
    // 4. CREATE MINIMAL HR DOCUMENT (No complex references)
    const hrDoc = {
      employeeId: 'EMP0001',
      name: {
        first: 'Digi',
        last: 'Coders'
      },
      email: 'digicoders@gmail.com',
      password: encryptedPassword,
      mobile: '8630049759',
      gender: 'Male',
      role: 'HR_Manager',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('\n📝 Creating HR document...');
    const result = await db.collection('employees').insertOne(hrDoc);
    
    console.log('\n🎉 SUCCESS! HR created with ID:', result.insertedId);
    
    // 5. ALSO CREATE COUNTER FOR FUTURE EMPLOYEES
    const counterExists = await db.collection('counters').findOne({ name: 'employeeId' });
    if (!counterExists) {
      await db.collection('counters').insertOne({
        name: 'employeeId',
        value: 2 // Next will be EMP0002
      });
      console.log('✅ Counter initialized');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 LOGIN CREDENTIALS (SAVE THESE)');
    console.log('='.repeat(60));
    console.log('🌐 Login URL: POST http://localhost:5000/api/employees/login');
    console.log('📧 Email:    digicoders@gmail.com');
    console.log('🔑 Password: 123456');
    console.log('👤 Role:     HR_Manager');
    console.log('='.repeat(60));
    
    console.log('\n🔍 To verify in MongoDB:');
    console.log('db.employees.find({email: "digicoders@gmail.com"})');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (conn) {
      await mongoose.disconnect();
      console.log('\n🔌 Database disconnected');
    }
  }
};

// Run it
seedFirstHR();