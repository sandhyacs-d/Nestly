
import Notification from "../models/notification.js";

export async function createNotification({
    recipient,
    type,
    message,
    relatedUser,
    relatedProperty,
    relatedRoommateRequest,
    relatedEnquiry
}) {
    const notification = await Notification.create({
        recipient,
        type,
        message,
        ...(relatedUser && { relatedUser }),
        ...(relatedProperty && { relatedProperty }),
        ...(relatedRoommateRequest && { relatedRoommateRequest }),
        ...(relatedEnquiry && { relatedEnquiry })
    });

    return notification;
}

export async function createNotificationSafely(notificationData) {
    try {
        await createNotification(notificationData);
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
}