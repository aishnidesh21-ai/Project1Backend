require('dotenv').config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();

// app.use(cors({ origin: "http://localhost:5173" }));
// ✅ Allow frontend from both local and Netlify
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://course-management-project.netlify.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

const mongoURI = process.env.MONGO_URI || "mongodb+srv://aishnidesh21:w3hfJwqv3PV851C8@cluster0.jxovuda.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// User model
const User = require("./models/User");

// Routes
const authRoutes = require("./routes/auth");  
const courseRoutes = require("./routes/courseRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/api/auth", authRoutes);    
app.use("/api/courses", courseRoutes);
app.use("/api", userRoutes);

app.get("/", (req, res) => {
  res.send("✅ Backend deployed successfully on Render!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
