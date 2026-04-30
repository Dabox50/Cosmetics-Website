const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./src/models/Admin');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
const Role = require('./src/models/Role');
const connectDB = require('./src/config/db');

dotenv.config();
connectDB();

const initialProducts = [
  { category: "Facesoap", name: "Premium Cleanser", brand: "Shayors", shade: "N/A", size: "200ml", ingredients: "Aloe Vera, Vitamin E", costPrice: 10.00, price: 15.00, stock: 20, threshold: 5, image: "../Image/WhatsApp1.jpeg" },
  { category: "Bar soap", name: "Glow Bar", brand: "Shayors", shade: "N/A", size: "150g", ingredients: "Honey, Turmeric", costPrice: 5.00, price: 8.00, stock: 50, threshold: 5, image: "../Image/WhatsApp2.jpeg" },
  { category: "Cleanser", name: "Deep Pore Cleanser", brand: "Shayors", shade: "N/A", size: "100ml", ingredients: "Salicylic Acid", costPrice: 12.00, price: 20.00, stock: 15, threshold: 5, image: "../Image/WhatsApp3.jpeg" },
  { category: "Facecream", name: "Day Glow Cream", brand: "Shayors", shade: "N/A", size: "50g", ingredients: "SPF 30, Hyaluronic Acid", costPrice: 15.00, price: 25.00, stock: 30, threshold: 5, image: "../Image/WhatsApp4.jpeg" },
  { category: "Bar soap", name: "Exfoliating Soap", brand: "Shayors", shade: "N/A", size: "150g", ingredients: "Oatmeal, Shea Butter", costPrice: 6.00, price: 10.00, stock: 40, threshold: 5, image: "../Image/WhatsApp5.jpeg" },
  { category: "Cleanser", name: "Luxury Mist", brand: "Shayors", shade: "N/A", size: "150ml", ingredients: "Rose Water", costPrice: 8.00, price: 15.00, stock: 25, threshold: 5, image: "../Image/WhatsApp6.jpeg" },
  { category: "Perfume oil", name: "Midnight Scent", brand: "Shayors", shade: "N/A", size: "30ml", ingredients: "Oud, Musk", costPrice: 20.00, price: 35.00, stock: 10, threshold: 5, image: "../Image/WhatsApp7.jpeg" },
  { category: "Scrub", name: "Sugar Glow Scrub", brand: "Shayors", shade: "N/A", size: "250g", ingredients: "Brown Sugar, Essential Oils", costPrice: 10.00, price: 18.00, stock: 20, threshold: 5, image: "../Image/WhatsApp8.jpeg" },
  { category: "Lotion", name: "Hydrating Body Milk", brand: "Shayors", shade: "N/A", size: "400ml", ingredients: "Cocoa Butter", costPrice: 12.00, price: 22.00, stock: 15, threshold: 5, image: "../Image/WhatsApp9.jpeg" },
  { category: "Serum", name: "Vitamin C Serum", brand: "Shayors", shade: "N/A", size: "30ml", ingredients: "20% Vitamin C", costPrice: 18.00, price: 30.00, stock: 12, threshold: 5, image: "../Image/WhatsApp10.jpeg" },
  { category: "Facecream", name: "Night Repair Cream", brand: "Shayors", shade: "N/A", size: "50g", ingredients: "Retinol", costPrice: 20.00, price: 35.00, stock: 10, threshold: 5, image: "../Image/WhatsApp11.jpeg" }
];

const initialCategories = [
  "Scrub", "Black soap", "Lotion", "Tube", "Oil", "Serum", "Bar soap", "Cleanser", 
  "Toner", "Perfume oil", "Airfreshner", "Gift box", "Tea", "Facesoap", "Body spray", 
  "Roll on", "Lubricant", "Sponge", "Haircare", "Aphrodisiacs", "Cotton pad", "Wipes"
];

const seedData = async () => {
  try {
    console.log('Starting Seeding Process...');
    
    // await Admin.deleteMany();
    // await Product.deleteMany();
    // await Category.deleteMany();

    console.log('Previous Data Cleared');

    await Admin.create({
      email: process.env.ADMIN_EMAIL || 'admin@shayors.com',
      password: process.env.ADMIN_PASSWORD || 'Shayor123',
    });

    await Product.insertMany(initialProducts);
    
    const categoryObjects = initialCategories.map(cat => ({ name: cat }));
    await Category.insertMany(categoryObjects);

    const initialRoles = [
      { name: 'Admin', permissions: ['all'] },
      { name: 'Sales Boy', permissions: ['pos_checkout', 'view_inventory', 'record_sale'] },
      { name: 'Store Manager', permissions: ['view_inventory', 'add_product', 'view_records', 'record_sale', 'manage_suppliers', 'view_reports'] }
    ];
    for (const role of initialRoles) {
      await Role.findOneAndUpdate({ name: role.name }, role, { upsert: true });
    }

    console.log('Data Seeded Successfully!');
    await mongoose.connection.close();
    process.exit();
  } catch (error) {
    console.error(`Seeding Error: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedData();
