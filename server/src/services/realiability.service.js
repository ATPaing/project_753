import Invitation from "../models/Invitation.model.js";
import User from "../models/User.model.js";

export const recalculateReliabilityScore = async (userId) => {
    
    const acceptedCount = await Invitation.countDocuments({
        recipient: userId,
        status: "accepted",
    });

    const noShowCount = await Invitation.countDocuments({
        recipient: userId,
        status: "accepted",
        attendanceStatus: "no_show",
    });

    const reliabilityScore =
        acceptedCount === 0
            ? 100
            : Math.round(((acceptedCount - noShowCount) / acceptedCount) * 100);

    await User.findByIdAndUpdate(userId, { reliabilityScore });

    return reliabilityScore;
};
