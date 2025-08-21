const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "MyAppJwtSecretKey";

// Inline auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, name, email }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Use middleware for all routes below
router.use(authMiddleware);

// Add Course (Only instructors)
router.post("/", async (req, res) => {
  try {
    if (req.user.role !== "instructor") {
      return res.status(403).json({ message: "Access denied" });
    }
    const { title, description, instructor, logo } = req.body;
    const course = new Course({ title, description, instructor, logo });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    console.error("Add course error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get All Courses (All authenticated users)
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

// Delete Course (Only instructors)
router.delete("/:id", async (req, res) => {
  try {
    if (req.user.role !== "instructor") {
      return res.status(403).json({ message: "Access denied" });
    }
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete course" });
  }
});

// Edit/Update Course (Only instructors)
router.put("/:id", async (req, res) => {
  try {
    if (req.user.role !== "instructor") {
      return res.status(403).json({ message: "Access denied" });
    }
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedCourse)
      return res.status(404).json({ message: "Course not found" });

    res.json({ message: "Course updated", course: updatedCourse });
  } catch (err) {
    res.status(500).json({ message: "Failed to update course" });
  }
});

// Enroll Student (Only students)
router.post("/:id/enroll", async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Only students can enroll" });
  }
  const { studentName, email } = req.body;
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const alreadyEnrolled = course.students.some(
      (s) => s.studentName === studentName && s.email === email
    );
    if (alreadyEnrolled) {
      return res.status(400).json({ message: "Student already enrolled" });
    }

    const studentId = Date.now().toString();
    course.students.push({ studentId, studentName, email });
    await course.save();

    res.status(200).json({ message: "Enrollment successful" });
  } catch (err) {
    res.status(500).json({ message: "Enrollment failed" });
  }
});

// Remove Enrolled Student (Instructor only)
router.delete("/:courseId/students/:studentId", async (req, res) => {
  if (req.user.role !== "instructor") {
    return res.status(403).json({ message: "Only instructors can remove students" });
  }
  const { courseId, studentId } = req.params;
  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.students = course.students.filter(
      (student) => student.studentId !== studentId
    );
    await course.save();

    res.json({ message: "Student removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove student" });
  }
});

// Edit Enrolled Student (Instructor only)
router.put("/:courseId/students/:studentId", async (req, res) => {
  if (req.user.role !== "instructor") {
    return res.status(403).json({ message: "Only instructors can edit students" });
  }
  const { courseId, studentId } = req.params;
  const { studentName, email } = req.body;
  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.students = course.students.map((student) =>
      student.studentId === studentId
        ? { ...student.toObject(), studentName, email }
        : student
    );
    await course.save();

    res.json({ message: "Student updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update student" });
  }
});

module.exports = router;
