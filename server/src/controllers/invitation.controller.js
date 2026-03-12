import Invitation from "../models/Invitation.model.js";
import Game from "../models/Game.model.js";
import User from "../models/User.model.js";

export const createInvitations = async (req, res) => {
    try {
        const { gameId } = req.params;
        const { recipientEmails } = req.body;

        if (!Array.isArray(recipientEmails) || recipientEmails.length === 0) {
            return res
                .status(400)
                .json({ message: "Recipient emails are required" });
        }
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ message: "Game not found" });
        }

        if (game.host.toString() !== req.userId) {
            return res
                .status(403)
                .json({ message: "Only host can send invitations" });
        }

        let invitations = [];

        if (recipientEmails && recipientEmails.length > 0) {
            const uniqueEmails = [...new Set(recipientEmails)];

            const users = await User.find({
                email: { $in: uniqueEmails },
            });

            const invitationDocs = users
                .filter((user) => user._id.toString() !== req.userId)
                .map((user) => ({
                    game: game._id,
                    sender: req.userId,
                    recipient: user._id,
                }));

            if (invitationDocs.length > 0) {
                invitations = await Invitation.insertMany(invitationDocs);
            }
        }

        res.status(201).json({
            message: "Invitations created successfully",
            invitations,
        });
    } catch (error) {
        console.error("Error creating invitations:", error);
        res.status(500).json({ message: "Server error" });
    }
};
