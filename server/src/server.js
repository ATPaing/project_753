import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";

import dotenv from "dotenv";
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// check health
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

// connect to database and start server
connectDB().then(() => {
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((err) => {
    console.error("Failed to connect to the database", err);
    process.exit(1);
});