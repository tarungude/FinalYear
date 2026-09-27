/**
 * Creates (or promotes) an admin account so you can access admin-only routes
 * without manually editing documents in Atlas.
 *
 * Usage:
 *   node scripts/createAdmin.js "Admin Name" admin@smartstay.com adminpass123
 *
 * If a user with that email already exists, it just promotes them to admin
 * (useful if you signed up normally first, then want to make that account an admin).
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function run() {
  const [, , name, email, password] = process.argv;

  if (!name || !email || !password) {
    console.error("Usage: node scripts/createAdmin.js \"Admin Name\" admin@email.com password123");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB Atlas");

  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    user.role = "admin";
    await user.save();
    console.log(`Existing user "${user.email}" promoted to admin.`);
  } else {
    user = await User.create({
      name,
      email,
      password,
      role: "admin",
    });
    console.log(`Admin account created: ${user.email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Failed to create admin:", err.message);
  process.exit(1);
});
