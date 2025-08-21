const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    studentName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  instructor: { type: String, required: true, trim: true },
  logo: { type: String, trim: true }, 
  students: {
    type: [studentSchema],
    default: [],
  },
});

module.exports = mongoose.model("Course", courseSchema);
