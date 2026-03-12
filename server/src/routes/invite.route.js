import {
    createInvitations
} from "../controllers/invitation.controller.js";

import express from "express";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create invitations for a game
router.post("/:gameId/invitations", protect, createInvitations);

export default router;