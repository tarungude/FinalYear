const express = require("express");
const router = express.Router();
const {
  getAllStudents,
  getStudentById,
  getDashboardStats,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("admin", "warden"));

router.get("/students", getAllStudents);
router.get("/students/:id", getStudentById);
router.get("/stats", getDashboardStats);

module.exports = router;
