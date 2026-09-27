const Room = require("../models/Room");

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private (admin/warden)
const createRoom = async (req, res) => {
  try {
    const { roomNumber, block, floor, capacity, amenities, monthlyRent, feeType, genderRestriction } = req.body;

    if (!roomNumber || !block || floor === undefined || !capacity || !monthlyRent) {
      return res.status(400).json({
        message: "roomNumber, block, floor, capacity, and monthlyRent are required",
      });
    }

    const existing = await Room.findOne({ roomNumber, block });
    if (existing) {
      return res.status(409).json({ message: "A room with this number already exists in this block" });
    }

    const room = await Room.create({
      roomNumber,
      block,
      floor,
      capacity,
      amenities: amenities || [],
      monthlyRent,
      feeType: feeType || "monthly",
      genderRestriction: genderRestriction || "any",
    });

    res.status(201).json({ message: "Room created", room });
  } catch (error) {
    res.status(500).json({ message: "Failed to create room", error: error.message });
  }
};

// @route   GET /api/rooms
// @desc    List all rooms (supports ?available=true to filter to rooms with free slots)
// @access  Private
const getRooms = async (req, res) => {
  try {
    const filter = { isActive: true };

    const rooms = await Room.find(filter).populate("occupants", "name email").sort({ block: 1, roomNumber: 1 });

    let result = rooms;
    if (req.query.available === "true") {
      result = rooms.filter((r) => r.currentOccupancy < r.capacity);
    }

    res.json({ count: result.length, rooms: result });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rooms", error: error.message });
  }
};

// @route   GET /api/rooms/:id
// @access  Private
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate("occupants", "name email");
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json({ room });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch room", error: error.message });
  }
};

// @route   PUT /api/rooms/:id
// @desc    Update room details
// @access  Private (admin/warden)
const updateRoom = async (req, res) => {
  try {
    const allowedUpdates = ["roomNumber", "block", "floor", "capacity", "amenities", "monthlyRent", "feeType", "genderRestriction", "isActive"];
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const room = await Room.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json({ message: "Room updated", room });
  } catch (error) {
    res.status(500).json({ message: "Failed to update room", error: error.message });
  }
};

// @route   DELETE /api/rooms/:id
// @desc    Soft-delete a room (marks inactive rather than removing, to preserve history)
// @access  Private (admin/warden)
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.currentOccupancy > 0) {
      return res.status(400).json({
        message: "Cannot delete a room with current occupants. Reassign them first.",
      });
    }

    room.isActive = false;
    await room.save();

    res.json({ message: "Room deactivated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete room", error: error.message });
  }
};

module.exports = { createRoom, getRooms, getRoomById, updateRoom, deleteRoom };
