import {
    createInvitations,
    respondInvitation,
} from "../controllers/invitation.controller.js";

import express from "express";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create invitations for a gam
router.post("/:gameId/invite", protect, createInvitations);

// Respond to an invitation (accept or decline)
router.post("/:invitationId/respond", protect, respondInvitation);

export default router;