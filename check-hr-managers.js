import mongoose from 'mongoose';
import Employee from './models/Employee.js';
import dotenv from 'dotenv';

dotenv.config();

// Your MongoDB URI
const MONGODB_URI = 'mongodb+srv://digitalgurucse_db_user:fz729Mabd6N9rX2Q@cluster0.uv5nfvk.mongodb.net/CompleteErp?appName=Cluster0';

async function checkHRManagers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB - CompleteErp Database');

    // Find all HR managers
    const hrManagers = await Employee.find({ role: 'HR_Manager' })
      .select('employeeId name email mobile role isActive dateOfJoining password')
      .lean();

    console.log('\n📋 HR Managers in Database:');
    console.log('='.repeat(60));

    if (hrManagers.length === 0) {
      console.log('❌ No HR Managers found in the database');
      
      // Check if there are any employees at all
      const totalEmployees = await Employee.countDocuments();
      console.log(`\n📊 Total employees in database: ${totalEmployees}`);
      
      if (totalEmployees > 0) {
        // Show first few employees to understand the data
        const sampleEmployees = await Employee.find()
          .select('employeeId name email role')
          .limit(5)
          .lean();
        
        console.log('\n👥 Sample employees:');
        sampleEmployees.forEach((emp, index) => {
          console.log(`${index + 1}. ${emp.name?.first || 'N/A'} ${emp.name?.last || 'N/A'} - ${emp.email} - Role: ${emp.role}`);
        });
      }
    } else {
      hrManagers.forEach((hr, index) => {
        console.log(`\n${index + 1}. HR Manager Details:`);
        console.log(`   Employee ID: ${hr.employeeId}`);
        console.log(`   Name: ${hr.name?.first || 'N/A'} ${hr.name?.last || 'N/A'}`);
        console.log(`   Email: ${hr.email}`);
        console.log(`   Mobile: ${hr.mobile}`);
        console.log(`   Role: ${hr.role}`);
        console.log(`   Status: ${hr.isActive ? 'Active' : 'Inactive'}`);
        console.log(`   Joined: ${hr.dateOfJoining ? new Date(hr.dateOfJoining).toLocaleDateString() : 'N/A'}`);
        console.log(`   Password Hash: ${hr.password ? hr.password.substring(0, 20) + '...' : 'N/A'}`);
        console.log(`   MongoDB ID: ${hr._id}`);
      });
    }

    // Also check total employees by role
    const roleCounts = await Employee.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    console.log('\n📊 Employee Count by Role:');
    console.log('='.repeat(30));
    if (roleCounts.length === 0) {
      console.log('No employees found');
    } else {
      roleCounts.forEach(role => {
        console.log(`${role._id || 'Unknown'}: ${role.count}`);
      });
    }

    // Check total active employees
    const totalActive = await Employee.countDocuments({ isActive: true });
    const totalInactive = await Employee.countDocuments({ isActive: false });
    
    console.log('\n📈 Employee Status:');
    console.log('='.repeat(20));
    console.log(`Active: ${totalActive}`);
    console.log(`Inactive: ${totalInactive}`);
    console.log(`Total: ${totalActive + totalInactive}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
checkHRManagers();