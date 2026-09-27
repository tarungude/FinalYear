require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route — confirms the server + DB are alive
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "SmartStay AI backend is running",
    timestamp: new Date().toISOString(),
  });
});

// ---- Route mounting (add these as we build each module) ----
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/preferences", require("./routes/preferenceRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/matches", require("./routes/matchRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/allocations", require("./routes/allocationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/chatbot", require("./routes/chatbotRoutes"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`SmartStay AI backend listening on port ${PORT}`);
  });
};

startServer();
