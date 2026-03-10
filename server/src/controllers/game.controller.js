import Game from "../models/Game.model.js";

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

        res.status(201).json({
            message: "Game created successfully",
            game,
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
