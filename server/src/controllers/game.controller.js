import Game from "../models/Game.model.js";
import User from "../models/User.model.js";
import Invitation from "../models/Invitation.model.js";

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

export const getGames = async (req, res) => {
    try {
        const { filter } = req.query;
        const query = {};

        const now = new Date();

        if (filter === "upcoming") {
            query.startTime = { $gte: now };
        } else if (filter === "past") {
            query.endTime = { $lt: now };
        } else if (filter === "ongoing") {
            query.startTime = { $lte: now };
            query.endTime = { $gte: now };
        }

        const games = await Game.find(query)
            .populate("host", "name")
            .sort({ startTime: 1 });

        res.status(200).json(games);
    } catch (error) {
        console.error("Error fetching games:", error);
        res.status(500).json({ message: "Server error" });
    }
};
