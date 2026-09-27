const User = require("../models/User");
const Room = require("../models/Room");
const RoommateRequest = require("../models/RoommateRequest");
const Allocation = require("../models/Allocation");
const Feedback = require("../models/Feedback");

// @route   GET /api/admin/students
// @desc    List all students, with optional search/filter
// @access  Private (admin/warden)
const getAllStudents = async (req, res) => {
  try {
    const filter = { role: "student" };

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }
    if (req.query.allocated === "true") filter.currentAllocation = { $ne: null };
    if (req.query.allocated === "false") filter.currentAllocation = null;

    const students = await User.find(filter)
      .select("-password")
      .populate("currentAllocation")
      .sort({ createdAt: -1 });

    res.json({ count: students.length, students });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch students", error: error.message });
  }
};

// @route   GET /api/admin/students/:id
// @desc    Get a single student's full profile (for admin detail view)
// @access  Private (admin/warden)
const getStudentById = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: "student" })
      .select("-password")
      .populate("preferences")
      .populate("currentAllocation");

    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ student });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch student", error: error.message });
  }
};

// @route   GET /api/admin/stats
// @desc    Quick stats for the admin dashboard home
// @access  Private (admin/warden)
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents,
      unallocatedStudents,
      totalRooms,
      rooms,
      pendingRequests,
      activeAllocations,
      feedbackAvg,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "student", currentAllocation: null }),
      Room.countDocuments({ isActive: true }),
      Room.find({ isActive: true }),
      RoommateRequest.countDocuments({ status: "pending" }),
      Allocation.countDocuments({ status: "active" }),
      Feedback.aggregate([{ $group: { _id: null, avg: { $avg: "$satisfactionRating" } } }]),
    ]);

    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const totalOccupied = rooms.reduce((sum, r) => sum + r.currentOccupancy, 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    res.json({
      totalStudents,
      unallocatedStudents,
      totalRooms,
      occupancyRate,
      pendingRequests,
      activeAllocations,
      avgSatisfaction: feedbackAvg[0]?.avg ? Math.round(feedbackAvg[0].avg * 10) / 10 : null,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message });
  }
};

module.exports = { getAllStudents, getStudentById, getDashboardStats };
