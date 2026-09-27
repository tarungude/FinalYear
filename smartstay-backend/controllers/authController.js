const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { name, email, password, role, course, branch, year, gender, contactNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    // Only allow "student" role via public signup.
    // Admin/warden accounts should be created separately (seed script or by a super-admin).
    // Optional enum fields (course, gender) must be omitted entirely when left
    // blank — passing an empty string fails Mongoose's enum validator, since ""
    // is not itself a listed enum value.
    const userData = { name, email, password, role: "student" };
    if (course) userData.course = course;
    if (branch) userData.branch = branch;
    if (year) userData.year = year;
    if (gender) userData.gender = gender;
    if (contactNumber) userData.contactNumber = contactNumber;

    const user = await User.create(userData);

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // password field has select:false in the schema, so explicitly include it here
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  // req.user is already attached by the protect middleware
  res.json({ user: req.user });
};

// @route   PUT /api/auth/me
// @desc    Update the logged-in user's own profile (name, contact, course/branch,
//          year, gender, profile photo, and optionally password). Shared by the
//          student "Profile" tab and the admin "My Profile" section.
// @access  Private
const updateMe = async (req, res) => {
  try {
    const {
      name, contactNumber, course, branch, year, gender, profilePhoto,
      currentPassword, newPassword,
    } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) user.name = name;
    if (contactNumber !== undefined) user.contactNumber = contactNumber;
    // course/gender are enum-constrained — an empty string (the "cleared" state
    // from a dropdown) is not itself a valid enum value, so it must unset the
    // field (undefined) rather than be assigned literally.
    if (course !== undefined) user.course = course || undefined;
    if (branch !== undefined) user.branch = branch;
    if (year !== undefined) user.year = year || undefined;
    if (gender !== undefined) user.gender = gender || undefined;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    // Password change requires the current password, verified explicitly
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "currentPassword is required to set a new password" });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }
      user.password = newPassword; // pre-save hook hashes it
    }

    await user.save();

    const safeUser = await User.findById(user._id); // password excluded by default select:false
    res.json({ message: "Profile updated", user: safeUser });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

module.exports = { signup, login, getMe, updateMe };
