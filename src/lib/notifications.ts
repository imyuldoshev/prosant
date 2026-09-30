export async function registerForPushNotificationsAsync() {
  console.log("Push notifications disabled in Expo Go (Android)");
  return false;
}

export async function scheduleNotificationForDate(title: string, body: string, date: Date) {
  console.log("Notification scheduled: ", title, date);
}

export async function sendImmediateNotification(title: string, body: string) {
  console.log("Immediate notification: ", title);
}

export async function cancelAllNotifications() {
  console.log("Cancelled notifications");
}
