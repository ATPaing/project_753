import express from "express";

import {
    createGame,
    getMyGames,
    getMyNextGame,
    editGame,
    cancelGame,
    markGameAttendance
} from "../controllers/game.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create a new game
router.post("/create", protect, createGame);

// Get games with optional filters
router.get("/my", protect, getMyGames);

// get next game
router.get("/my/next", protect, getMyNextGame);

// Mark attendance for a game
router.post("/:gameId/attendance", protect, markGameAttendance);

// Edit game details
router.patch("/:gameId/edit", protect, editGame);

// Cancel a game
router.patch("/:gameId/cancel", protect, cancelGame);

export default router;