import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
    {
        game: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Game",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "declined"],
            default: "pending",
        },
        attendanceStatus: {
            type: String,
            enum: ["unmarked", "present", "no_show"],
            default: "unmarked",
        },
        respondedAt: {
            type: Date,
            required: function () {
                return this.status !== "pending";
            },
        },
    },
    {
        timestamps: true,
    },
);

invitationSchema.index({ game: 1, recipient: 1 }, { unique: true });

const Invitation = mongoose.model("Invitation", invitationSchema);

export default Invitation;
