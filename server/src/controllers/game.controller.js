import Game from "../models/Game.model.js";
import User from "../models/User.model.js";
import Invitation from "../models/Invitation.model.js";
import { recalculateReliabilityScore } from "../services/reliability.service.js";

export const createGame = async (req, res) => {
    try {
        const {
            title,
            location,
            startTime,
            endTime,
            minReliabilityScore,
            feeType,
            feeAmount,
            maxPlayers,
            inviteEmails,
        } = req.body;

        if (
            !title ||
            !location ||
            !startTime ||
            !endTime ||
            !feeType ||
            !maxPlayers
        ) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (maxPlayers < 2) {
            return res
                .status(400)
                .json({ message: "There must be at least 2 players." });
        }

        if (new Date(endTime) <= new Date(startTime)) {
            return res.status(400).json({
                message: "End time must be after start time",
            });
        }
        if (feeType === "split" && feeAmount == null) {
            return res.status(400).json({
                message: "Fee amount is required when fee type is split",
            });
        }

        const game = await Game.create({
            title,
            startTime,
            endTime,
            location,
            minReliabilityScore,
            feeType,
            feeAmount,
            host: req.userId,
            maxPlayers,
        });

        let invitations = [];

        if (inviteEmails && inviteEmails.length > 0) {
            const uniqueEmails = [...new Set(inviteEmails)];

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
            message: "Game created successfully",
            game,
            invitations,
        });
    } catch (error) {
        console.error("Error creating game:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getMyGames = async (req, res) => {
    try {
        const { filter } = req.query;

        const allowedFilters = ["upcoming", "past", "ongoing"];

        if (filter && !allowedFilters.includes(filter)) {
            return res.status(400).json({
                message: "Invalid filter value",
            });
        }

        const hostQuery = {
            host: req.userId,
            status: { $ne: "cancelled" },
        };

        let hostedGames = await Game.find(hostQuery)
            .populate("host", "name")
            .sort({ startTime: -1 });

        hostedGames = hostedGames.map((game) => ({
            ...game.toObject(),
            role: "host",
        }));

        const guestQuery = {
            recipient: req.userId,
            status: "accepted",
        };

        const acceptedInvitations = await Invitation.find(guestQuery).populate({
            path: "game",
            select: "title startTime endTime status host",
            populate: {
                path: "host",
                select: "name",
            },
        });

        let invitedGames = acceptedInvitations
            .filter((invitation) => invitation.game)
            .filter((invitation) => invitation.game.status !== "cancelled")
            .map((invitation) => ({
                ...invitation.game.toObject(),
                role: "guest",
            }));

        if (filter) {
            const now = new Date();

            if (filter === "upcoming") {
                hostedGames = hostedGames.filter(
                    (game) => new Date(game.startTime) >= now,
                );
                invitedGames = invitedGames.filter(
                    (game) => new Date(game.startTime) >= now,
                );
            } else if (filter === "past") {
                hostedGames = hostedGames.filter(
                    (game) => new Date(game.endTime) < now,
                );
                invitedGames = invitedGames.filter(
                    (game) => new Date(game.endTime) < now,
                );
            } else if (filter === "ongoing") {
                hostedGames = hostedGames.filter(
                    (game) =>
                        new Date(game.startTime) <= now &&
                        new Date(game.endTime) >= now,
                );
                invitedGames = invitedGames.filter(
                    (game) =>
                        new Date(game.startTime) <= now &&
                        new Date(game.endTime) >= now,
                );
            }
        }

        res.status(200).json({
            hosted: hostedGames,
            invited: invitedGames,
            totalGame: hostedGames.length + invitedGames.length,
        });
    } catch (error) {
        console.error("Error fetching my games:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getMyNextGame = async (req, res) => {
    try {
        const userId = req.userId;
        const now = new Date();

        // get hostedgame
        const nextHostedGame = await Game.findOne({
            host: userId,
            startTime: { $gte: now },
            status: "scheduled",
        })
            .sort({ startTime: 1 })
            .populate("host", "name email");

        // get invited games
        const invitations = await Invitation.find({
            recipient: userId,
            status: "accepted",
        }).populate({
            path: "game",
            select: "title location startTime endTime status host feeType feeAmount maxPlayers createdAt",
            populate: {
                path: "host",
                select: "name email",
            },
        });

        const nextInvitedInvitation =
            invitations
                .filter(
                    (invitation) =>
                        invitation.game &&
                        invitation.game.status === "scheduled" &&
                        new Date(invitation.game.startTime) >= now,
                )
                .sort(
                    (a, b) =>
                        new Date(a.game.startTime) - new Date(b.game.startTime),
                )[0] || null;

        const nextInvitedGame = nextInvitedInvitation
            ?   {
                    ...nextInvitedInvitation.game.toObject(),
                    respondedAt: nextInvitedInvitation.respondedAt,
                    invitationId: nextInvitedInvitation._id,
                    invitationStatus: nextInvitedInvitation.status,
                }
            : null;

        let nextGame = null;

        if (nextHostedGame && nextInvitedGame) {
            nextGame =
                new Date(nextHostedGame.startTime) <
                new Date(nextInvitedGame.startTime)
                    ? nextHostedGame
                    : nextInvitedGame;
        } else if (nextHostedGame) {
            nextGame = nextHostedGame;
        } else if (nextInvitedGame) {
            nextGame = nextInvitedGame;
        }
        return res.status(200).json(nextGame);
    } catch (error) {
        return res.status(500).json({
            message: "Failed to get next game",
            error: error.message,
        });
    }
};

export const editGame = async (req, res) => {
    try {
        const { gameId } = req.params;
        const {
            title,
            location,
            startTime,
            endTime,
            minReliabilityScore,
            feeType,
            feeAmount,
            maxPlayers,
        } = req.body;

        const game = await Game.findById(gameId);

        if (!game) {
            return res.status(404).json({
                message: "Game not found",
            });
        }

        if (game.host.toString() !== req.userId) {
            return res.status(403).json({
                message: "Only the host can edit this game",
            });
        }

        if (game.status === "cancelled") {
            return res.status(400).json({
                message: "Cancelled games cannot be edited",
            });
        }

        if (game.endTime < new Date()) {
            return res.status(400).json({
                message: "Past games cannot be edited",
            });
        }

        if (title !== undefined) game.title = title;
        if (location !== undefined) game.location = location;
        if (startTime !== undefined) game.startTime = startTime;
        if (endTime !== undefined) game.endTime = endTime;
        if (minReliabilityScore !== undefined) {
            game.minReliabilityScore = minReliabilityScore;
        }
        if (feeType !== undefined) game.feeType = feeType;
        if (maxPlayers !== undefined) game.maxPlayers = maxPlayers;

        if (feeType !== undefined) {
            if (feeType === "free") {
                game.feeAmount = undefined;
            } else if (feeAmount !== undefined) {
                game.feeAmount = feeAmount;
            }
        } else if (feeAmount !== undefined) {
            game.feeAmount = feeAmount;
        }

        await game.save();

        const updatedGame = await Game.findById(gameId).populate(
            "host",
            "name",
        );

        return res.status(200).json({
            message: "Game updated successfully",
            game: updatedGame,
        });
    } catch (error) {
        console.error("Error editing game:", error);
        return res.status(500).json({
            message: "Server error",
        });
    }
};

export const cancelGame = async (req, res) => {
    try {
        const { gameId } = req.params;

        const game = await Game.findById(gameId);

        if (!game) {
            return res.status(404).json({
                message: "Game not found",
            });
        }

        if (game.host.toString() !== req.userId) {
            return res.status(403).json({
                message: "Only the host can cancel this game",
            });
        }

        if (game.status === "cancelled") {
            return res.status(400).json({
                message: "Game is already cancelled",
            });
        }

        if (game.endTime < new Date()) {
            return res.status(400).json({
                message: "Past games cannot be edited",
            });
        }

        game.status = "cancelled";
        await game.save();

        return res.status(200).json({
            message: "Game cancelled successfully",
            game,
        });
    } catch (error) {
        console.error("Error cancelling game:", error);
        return res.status(500).json({
            message: "Server error",
        });
    }
};

export const markGameAttendance = async (req, res) => {
    try {
        const { gameId } = req.params;
        const { attendanceStatus, recipients } = req.body;

        if (!["present", "no_show"].includes(attendanceStatus)) {
            return res.status(400).json({
                message: "Attendance status must be 'present' or 'no_show'",
            });
        }

        if (!Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({
                message: "Recipients must be a non-empty array of user IDs",
            });
        }

        const uniqueRecipients = [...new Set(recipients)];

        const game = await Game.findById(gameId);

        if (!game) {
            return res.status(404).json({
                message: "Game not found",
            });
        }

        if (game.host.toString() !== req.userId) {
            return res.status(403).json({
                message: "Only the host can mark attendance",
            });
        }

        const invitations = await Invitation.find({
            game: gameId,
            recipient: { $in: uniqueRecipients },
        }).populate("recipient", "name email");

        if (invitations.length !== uniqueRecipients.length) {
            return res.status(400).json({
                message:
                    "Some recipients do not have invitations for this game",
            });
        }

        const invalidInvitations = invitations.filter(
            (invitation) => invitation.status !== "accepted",
        );

        if (invalidInvitations.length > 0) {
            return res.status(400).json({
                message:
                    "Only accepted invitations can be marked for attendance",
                invalidRecipients: invalidInvitations.map((invitation) => ({
                    recipientId:
                        invitation.recipient?._id || invitation.recipient,
                    status: invitation.status,
                })),
            });
        }

        const updatedInvitations = [];

        for (const invitation of invitations) {
            invitation.attendanceStatus = attendanceStatus;
            await invitation.save();

            await recalculateReliabilityScore(invitation.recipient._id);

            updatedInvitations.push(invitation);
        }

        return res.status(200).json({
            message: "Attendance updated successfully",
            updatedCount: updatedInvitations.length,
            invitations: updatedInvitations,
        });
    } catch (error) {
        console.error("Error marking attendance:", error);
        return res.status(500).json({
            message: "Server error",
        });
    }
};
