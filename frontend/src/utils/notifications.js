import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Checks and requests permission for local notifications.
 */
export const requestNotificationPermission = async () => {
    try {
        const { display } = await LocalNotifications.checkPermissions();
        if (display !== 'granted') {
            const { display: newPermission } = await LocalNotifications.requestPermissions();
            return newPermission === 'granted';
        }
        return true;
    } catch (error) {
        console.warn('Local Notifications not natively available, falling back or ignoring', error);
        return false; // Typically means we are in standard web without native bridge
    }
};

/**
 * Schedules a simple notification immediately.
 * Web browser support depends on the Capacitor PWA elements / native platform.
 */
export const sendBudgetAlert = async (amount, category) => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    try {
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: "⚠️ High Expense Alert",
                    body: `You just logged $${amount} for ${category}. Keep an eye on your budget!`,
                    id: new Date().getTime(), // unique ID
                    schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
                    sound: null,
                    attachments: null,
                    actionTypeId: "",
                    extra: null
                }
            ]
        });
    } catch (error) {
        console.error("Failed to schedule notification:", error);
    }
};
