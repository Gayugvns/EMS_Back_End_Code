const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/models/User');
const Config = require('../src/models/Config');
const Employee = require('../src/models/Employee');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Config.deleteMany({});
    await Employee.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@company.com',
      password: 'Admin@123',
      role: 'admin',
      department: 'Administration'
    });

    console.log('👤 Created admin user:', admin.email);

    // Initialize configurations
    await Config.initializeDefaults(admin._id);
    console.log('⚙️  Initialized default configurations');

    // Create sample employees
    const sampleEmployees = [
      {
        name: 'John Doe',
        email: 'john.doe@company.com',
        phone: '+1234567890',
        designation: 'Software Engineer',
        department: 'Engineering',
        salary: 75000,
        currency: 'USD',
        employmentType: 'full-time',
        status: 'active',
        createdBy: admin._id
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        phone: '+1987654321',
        designation: 'Product Manager',
        department: 'Product',
        salary: 95000,
        currency: 'USD',
        employmentType: 'full-time',
        status: 'active',
        createdBy: admin._id
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@company.com',
        phone: '+1555123456',
        designation: 'UX Designer',
        department: 'Design',
        salary: 85000,
        currency: 'USD',
        employmentType: 'full-time',
        status: 'on-leave',
        createdBy: admin._id
      },
      {
        name: 'Alice Brown',
        email: 'alice.brown@company.com',
        phone: '+1555987654',
        designation: 'HR Manager',
        department: 'Human Resources',
        salary: 70000,
        currency: 'USD',
        employmentType: 'full-time',
        status: 'active',
        createdBy: admin._id
      },
      {
        name: 'Charlie Wilson',
        email: 'charlie.wilson@company.com',
        phone: '+1555567890',
        designation: 'DevOps Engineer',
        department: 'Engineering',
        salary: 90000,
        currency: 'USD',
        employmentType: 'contract',
        status: 'active',
        createdBy: admin._id
      }
    ];

    const employees = await Employee.insertMany(sampleEmployees);
    console.log(`👥 Created ${employees.length} sample employees`);

    // Update dynamic lists with sample data
    const designations = [...new Set(sampleEmployees.map(e => e.designation))];
    const departments = [...new Set(sampleEmployees.map(e => e.department))];
    
    await Config.setValue('available_designations', designations, 'array', {
      category: 'employee',
      isPublic: true,
      userId: admin._id
    });
    
    await Config.setValue('available_departments', departments, 'array', {
      category: 'employee',
      isPublic: true,
      userId: admin._id
    });

    console.log('📊 Updated dynamic lists from sample data');

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('Email: admin@company.com');
    console.log('Password: Admin@123');
    console.log('\n📁 Database is ready for use.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();