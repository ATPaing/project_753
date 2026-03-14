import {
    createInvitations,
    respondInvitation,
    getMyInvitations
} from "../controllers/invitation.controller.js";

import express from "express";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create invitations for a gam
router.post("/:gameId/invite", protect, createInvitations);

// Respond to an invitation (accept or decline)
router.post("/:invitationId/respond", protect, respondInvitation);

// get my invitations
router.get("/me", protect, getMyInvitations);

export default router;