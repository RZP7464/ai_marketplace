require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const apiRoutes = require("./routes/api");
const merchantRoutes = require("./routes/merchant");
const mcpRoutes = require("./routes/mcp");
const chatRoutes = require("./routes/chat");
const settingsRoutes = require("./routes/settings");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Increased limit for logo uploads

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/merchant-apis", apiRoutes);
app.use("/api/merchant", merchantRoutes);
app.use("/api/mcp", mcpRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/settings", settingsRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
