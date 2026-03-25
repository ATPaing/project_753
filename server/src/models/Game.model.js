import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        location: {
            type: String,
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    return this.startTime < value;
                },
                message: "endTime must be later than startTime",
            },
        },
        minReliabilityScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 0,
        },
        feeType: {
            type: String,
            enum: ["free", "split"],
            default: "free",
            required: true,
        },
        feeAmount: {
            type: Number,
            required: function () {
                return this.feeType === "split";
            },
            min: 0,
        },
        host: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["scheduled", "ongoing", "completed", "cancelled"],
            default: "scheduled",
        },
        maxPlayers: {
            type: Number,
            min: 2,
        },
    },
    {
        timestamps: true,
    },
);

const Game = mongoose.model("Game", gameSchema);

export default Game;
