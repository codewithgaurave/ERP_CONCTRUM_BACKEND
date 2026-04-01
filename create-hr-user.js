import mongoose from 'mongoose';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
import Employee from './models/Employee.js';
import Department from './models/Department.js';
import Designation from './models/Designation.js';
import EmploymentStatus from './models/EmploymentStatus.js';
import OfficeLocation from './models/OfficeLocation.js';
import WorkShift from './models/WorkShift.js';
import { Counter } from './models/Counter.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const encryptPassword = (password) => {
  return CryptoJS.AES.encrypt(password, JWT_SECRET).toString();
};

const createHRUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if HR already exists
    const existingHR = await Employee.findOne({ email: 'hr@company.com' });
    if (existingHR) {
      console.log('⚠️  HR user already exists with email: hr@company.com');
      console.log('📧 Email: hr@company.com');
      console.log('🔑 Password: hr123456');
      process.exit(0);
    }

    // Generate Employee ID first
    const counter = await Counter.findOneAndUpdate(
      { name: 'employeeId' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    const employeeId = `EMP${String(counter.value).padStart(4, '0')}`;

    // Create a temporary HR ID for master data
    const tempHRId = new mongoose.Types.ObjectId();

    // Create Department
    let department = await Department.findOne({ name: 'Administration' });
    if (!department) {
      department = await Department.create({
        name: 'Administration',
        description: 'Admin Department',
        status: 'Active',
        hrId: tempHRId
      });
      console.log('✅ Department created');
    }

    // Create Designation
    let designation = await Designation.findOne({ title: 'HR Manager' });
    if (!designation) {
      designation = await Designation.create({
        title: 'HR Manager',
        description: 'Human Resource Manager',
        status: 'Active',
        hrId: tempHRId
      });
      console.log('✅ Designation created');
    }

    // Create Employment Status
    let employmentStatus = await EmploymentStatus.findOne({ title: 'Permanent' });
    if (!employmentStatus) {
      employmentStatus = await EmploymentStatus.create({
        title: 'Permanent',
        description: 'Permanent Employee',
        status: 'Active',
        hrId: tempHRId
      });
      console.log('✅ Employment Status created');
    }

    // Create Office Location
    let officeLocation = await OfficeLocation.findOne({ officeName: 'Head Office' });
    if (!officeLocation) {
      officeLocation = await OfficeLocation.create({
        officeName: 'Head Office',
        officeAddress: '123 Main Street, Mumbai, Maharashtra, India - 400001',
        latitude: 19.0760,
        longitude: 72.8777,
        officeType: 'Office',
        hrId: tempHRId,
        createdBy: tempHRId
      });
      console.log('✅ Office Location created');
    }

    // Create Work Shift
    let workShift = await WorkShift.findOne({ name: 'General Shift' });
    if (!workShift) {
      workShift = await WorkShift.create({
        name: 'General Shift',
        startTime: '09:00',
        endTime: '18:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        status: 'Active',
        hrId: tempHRId
      });
      console.log('✅ Work Shift created');
    }

    // Create HR User
    const hrUser = await Employee.create({
      employeeId,
      name: {
        first: 'HR',
        last: 'Admin'
      },
      email: 'hr@company.com',
      mobile: '9999999999',
      gender: 'Male',
      role: 'HR_Manager',
      department: department._id,
      designation: designation._id,
      employmentStatus: employmentStatus._id,
      officeLocation: officeLocation._id,
      workShift: workShift._id,
      salary: 50000,
      password: encryptPassword('hr123456'),
      isActive: true,
      addedBy: tempHRId, // Use temp ID first
      dateOfJoining: new Date()
    });

    // Update addedBy to actual HR ID
    hrUser.addedBy = hrUser._id;
    await hrUser.save();

    // Update master data with hrId
    await Department.updateOne({ _id: department._id }, { hrId: hrUser._id });
    await Designation.updateOne({ _id: designation._id }, { hrId: hrUser._id });
    await EmploymentStatus.updateOne({ _id: employmentStatus._id }, { hrId: hrUser._id });
    await OfficeLocation.updateOne({ _id: officeLocation._id }, { hrId: hrUser._id });
    await WorkShift.updateOne({ _id: workShift._id }, { hrId: hrUser._id });

    console.log('\n🎉 HR User created successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('📋 Login Credentials:');
    console.log('═══════════════════════════════════════');
    console.log(`👤 Employee ID: ${employeeId}`);
    console.log(`📧 Email: hr@company.com`);
    console.log(`🔑 Password: hr123456`);
    console.log(`👔 Role: HR_Manager`);
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating HR user:', error);
    process.exit(1);
  }
};

createHRUser();
