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
    const title = "⚠️ Budget Alert";
    const body = `You just logged $${amount} for ${category}. Keep an eye on your budget!`;

    // 1. Try native Web Notification API first (Best for desktop browsers & standard PWA testing)
    if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body });
            return;
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification(title, { body });
                return;
            }
        }
    }

    // 2. Try Capacitor Local Notifications (Best for compiled mobile environments)
    try {
        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title,
                        body,
                        id: Math.floor(Math.random() * 2147483647), // unique 32-bit integer ID
                        schedule: { at: new Date(Date.now() + 100) }, // schedule almost instantly
                        sound: null,
                        attachments: null,
                        actionTypeId: "",
                        extra: null
                    }
                ]
            });
            return;
        }
    } catch (error) {
        console.warn("Capacitor notification failed:", error);
    }

    // 3. Final Fallback (If notifications are completely blocked/unsupported)
    alert(`${title}\n\n${body}`);
};
