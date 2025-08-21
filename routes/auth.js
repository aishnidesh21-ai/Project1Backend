const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const admin = require("firebase-admin");

// Firebase admin initialization with service account
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
} catch (error) {
  console.error("Firebase admin initialization error:", error);
}

// JWT token creation helper function
const createJwt = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name, email: user.email, phone: user.phone },
    process.env.JWT_SECRET || "MyAppJwtSecretKey",
    { expiresIn: "1d" }
  );
};

// Register Route
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const newUser = new User({ name, email, password, role, phone: phone || "" });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Error registering user", error: err.message });
  }
});

// Login Route
router.post("/login", async (req, res) => { 
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createJwt(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
});

// Google login
router.post("/google-login", async (req, res) => {
  try {
    const { idToken } = req.body;
    const decoded = await admin.auth().verifyIdToken(idToken);

    let user = await User.findOne({ email: decoded.email });
    if (!user) {
      user = await User.create({
        name: decoded.name || decoded.email,
        email: decoded.email,
        phone: decoded.phone_number || "",
        password: bcrypt.hashSync(Math.random().toString(36).slice(-8), 10),
        role: "student"
      });
    }

    const token = createJwt(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Google login failed", error: err.message });
  }
});

// Phone login
router.post("/phone-login", async (req, res) => {
  try {
    const { idToken } = req.body;
    const decoded = await admin.auth().verifyIdToken(idToken);

    let user = await User.findOne({ phone: decoded.phone_number });
    if (!user) {
      user = await User.create({
        name: decoded.phone_number,
        phone: decoded.phone_number,
        email: decoded.email || `${decoded.phone_number}@example.com`,
        password: bcrypt.hashSync(Math.random().toString(36).slice(-8), 10),
        role: "student"
      });
    }

    const token = createJwt(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Phone login failed", error: err.message });
  }
});

module.exports = router;
