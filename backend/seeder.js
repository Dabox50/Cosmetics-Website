const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./src/models/Admin');
const connectDB = require('./src/config/db');

dotenv.config();
connectDB();

const seedAdmin = async () => {
  try {
    await Admin.deleteMany();

    const admin = await Admin.create({
      email: 'Shayorscosmestics@gmail.com',
      password: 'Shayor123', // This will be hashed by the pre-save hook
    });

    console.log('Admin User Created!');
    console.log(`Email: ${admin.email}`);
    console.log('Password: Shayor123');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

seedAdmin();
