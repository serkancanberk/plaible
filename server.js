import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { User } from "./models/User.js";
import storiesRouter from "./routes/stories.js";
import sessionsRouter from "./routes/sessions.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple route
app.get("/", (req, res) => {
  res.send("Plaible API is running...");
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development" });
});

// Users router
const usersRouter = express.Router();
usersRouter.get("/test", (req, res) => {
  res.json({ message: "User route works" });
});
app.use("/api/users", usersRouter);

// Stories router
app.use("/api/stories", storiesRouter);

// Sessions router
app.use("/api/sessions", sessionsRouter);

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/plaible";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});