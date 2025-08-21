const express = require("express");
const router = express.Router();
const User = require("../models/User");
require("dotenv").config();

// Register Route
router.post("/register", async (req, res) => {
  const { name, phone, email, password, role } = req.body;

  if (!name || !phone || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "User already exists" });

    const newUser = new User({ name, phone, email, password, role });
    await newUser.save();

    res.status(201).json({
      message: "User registered successfully"
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
});

module.exports = router;
