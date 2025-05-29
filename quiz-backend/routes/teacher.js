const express = require("express");
const User = require("../models/User");
const Quiz = require("../models/quiz");
const Result = require("../models/StudentResponse");
const router = express.Router();

const StudentRegistration = require("../models/StudentRegistration");

router.put("/update-section/:studentId", async (req, res) => {
  try {
    const { section } = req.body;
    const updatedStudent = await User.findByIdAndUpdate(
      req.params.studentId,
      { section },
      { new: true }
    );
    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ error: "Failed to update section" });
  }
});

router.put("/quiz/update/:quizId", async (req, res) => {
  try {
    const updates = req.query;
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.quizId,
      { $set: updates },
      { new: true }
    );
    res.json({ message: "Quiz updated successfully", quiz: updatedQuiz });
  } catch (error) {
    console.error("Quiz update error:", error);
    res.status(500).json({ error: "Failed to update quiz" });
  }
});

router.post("/quiz/create", async (req, res) => {
  try {
    const {
      title,
      course,
      section,
      teacherRegNo,
      password,
      duration,
      startTime,
      endTime,
      RegStartTime,
      RegEndTime,
      questions,
    } = req.body;

    if (
      !title ||
      !course ||
      !section ||
      !teacherRegNo ||
      !password ||
      !duration ||
      !startTime ||
      !endTime ||
      !RegStartTime ||
      !RegEndTime ||
      !questions ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (new Date(startTime) >= new Date(endTime)) {
      return res
        .status(400)
        .json({ message: "End time must be after start time." });
    }

    for (const question of questions) {
      if (
        !question.questionText ||
        !Array.isArray(question.options) ||
        question.options.length !== 4 ||
        question.options.some((opt) => !opt.trim())
      ) {
        return res.status(400).json({
          message: "Each question must have text and 4 non-empty options.",
        });
      }

      if (
        typeof question.correctAnswer !== "number" ||
        question.correctAnswer < 0 ||
        question.correctAnswer > 3
      ) {
        return res
          .status(400)
          .json({ message: "Each question must have a valid correct answer." });
      }
    }

    const newQuiz = new Quiz({
      title,
      course,
      section,
      teacherRegNo,
      password,
      duration,
      startTime,
      endTime,
      RegStartTime,
      RegEndTime,
      questions,
    });

    await newQuiz.save();
    res
      .status(201)
      .json({ message: "Quiz created successfully", quiz: newQuiz });
  } catch (error) {
    console.error("Quiz creation failed:", error);
    res.status(500).json({ message: "Server error while creating quiz." });
  }
});

router.get("/quizzes", async (req, res) => {
  try {
    const { teacherId } = req.query;
    const quizzes = await Quiz.find({ teacherRegNo: teacherId });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
});

router.get("/quiz/:quizId", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    res.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

// View quiz results
router.get("/results/:quizTitle", async (req, res) => {
  try {
    const responses = await Result.find({
      quizTitle: req.params.quizTitle,
    });

    // Fetch student details manually for each response
    const enrichedResults = await Promise.all(
      responses.map(async (response) => {
        const student = await User.findOne({
          registrationNumber: response.studentRegNo,
        });

        return {
          ...response._doc,
          studentDetails: student
            ? {
                name: student.name,
                email: student.email,
                registrationNumber: student.registrationNumber,
                section: student.section,
              }
            : null,
        };
      })
    );

    res.json(enrichedResults);
  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

// Fetch students who have no assigned section
router.get("/students/no-section", async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
      section: { $in: [null, ""] },
    });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Assign section to a specific student
router.put("/students/assign-section/:studentId", async (req, res) => {
  try {
    const { section } = req.body;
    const updatedStudent = await User.findByIdAndUpdate(
      req.params.studentId,
      { section },
      { new: true }
    );
    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ error: "Failed to assign section" });
  }
});

// PUT /teacher/approve-student
router.put("/approve-student", async (req, res) => {
  const { studentRegNo, quizTitle, status } = req.query;
  console.log("Incoming data:", { studentRegNo, quizTitle, status });
  try {
    const updated = await StudentRegistration.findOneAndUpdate(
      { studentRegNo, quizTitle },
      { approvedByTeacher: status },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Student registration not found." });
    }

    res.json({ message: "Approval status updated", updated });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating approval status", error: err.message });
  }
});

router.get("/students/all", async (req, res) => {
  const reg = req.query.teacherId;
  const quiztitle = req.query.quizTitle;

  try {
    const allStudents = await StudentRegistration.aggregate([
      {
        $match: {
          // approvedByTeacher: "pending",
          teacherRegNo: reg,
          quizTitle: quiztitle,
        },
      },
      {
        $lookup: {
          from: "users", // matches the User model's MongoDB collection name (should be lowercase plural)
          localField: "studentRegNo",
          foreignField: "registrationNumber",
          as: "studentDetails",
        },
      },
      {
        $unwind: "$studentDetails", // flattens the array
      },
      {
        $project: {
          studentRegNo: 1,
          quizTitle: 1,

          approvedByTeacher: 1,
          hasAttempted: 1,
          "studentDetails.name": 1,
          "studentDetails.email": 1,
          "studentDetails.section": 1,
        },
      },
    ]);

    res.json(allStudents);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching pending students with details",
      error: err.message,
    });
  }
});

module.exports = router;
