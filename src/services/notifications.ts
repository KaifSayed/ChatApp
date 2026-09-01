import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Highlight-start: Guard handler initialization for Web
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
// Highlight-end

export async function registerForPushNotificationsAsync() {
  let token;

  // Guard clause: Skip push registration on Web unless specifically configured with VAPID keys
  if (Platform.OS === "web") {
    console.log(
      "Skipping push notification token registration on web platform.",
    );
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.warn(
          "Project ID not found. Ensure app.json is configured correctly for EAS/Push.",
        );
      }

      const pushTokenResult = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = pushTokenResult.data;
      console.log("Expo Push Token:", token);
    } catch (e: any) {
      if (
        e?.message?.includes("Default FirebaseApp is not initialized") ||
        e?.message?.includes("fcm-credentials")
      ) {
        console.warn(
          "[PushNotifications] Android FCM credentials are not configured yet. To enable remote notifications, add 'google-services.json' and set 'android.googleServicesFile' in app.json. (Local notifications and in-app messaging work normally).",
        );
      } else {
        console.warn(
          "[PushNotifications] Could not get push token:",
          e?.message || e,
        );
      }
      return null;
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}
