import express from "express";

import {
    createGame,
    getGames,
} from "../controllers/game.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create a new game
router.post("/create", protect, createGame);

// Get games with optional filters
router.get("/", protect, getGames);

export default router;