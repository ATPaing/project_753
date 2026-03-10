import express from "express";

import {
    createGame
} from "../controllers/game.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create a new game
router.post("/create", protect, createGame);

export default router;