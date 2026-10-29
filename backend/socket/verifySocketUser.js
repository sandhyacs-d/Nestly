
import User from "../models/user.js";

export async function verifySocketUser(userId) {
    const user = await User.findById(userId)
        .select("_id isActive isSuspended");

    return Boolean(
        user &&
        user.isActive !== false &&
        user.isSuspended !== true
    );
}
