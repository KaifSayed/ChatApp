import { Alert, Platform } from "react-native";

export const handleAuthError = (
  error: any,
  defaultTitle = "Authentication Error",
) => {
  let message = "An unexpected error occurred. Please try again.";

  if (typeof error === "string") {
    message = error;
  } else if (error?.code) {
    switch (error.code) {
      case "auth/email-already-in-use":
        message = "This email address is already registered. Please log in.";
        break;
      case "auth/invalid-email":
        message = "Please enter a valid email address.";
        break;
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        message = "Invalid email or password. Please check your credentials.";
        break;
      case "auth/weak-password":
        message = "Password should be at least 6 characters long.";
        break;
      case "auth/too-many-requests":
        message = "Too many failed attempts. Please try again later.";
        break;
      case "auth/network-request-failed":
        message = "Network error. Please check your internet connection.";
        break;
      case "permission-denied":
        message =
          "Database permission denied. Please publish your Firestore Security Rules in the Firebase Console.";
        break;
      default:
        if (
          error.message?.includes("Missing or insufficient permissions") ||
          error.message?.includes("permission-denied")
        ) {
          message =
            "Database permission denied. Please publish your Firestore Security Rules in the Firebase Console.";
        } else {
          message = error.message || message;
        }
    }
  } else if (error?.message) {
    if (
      error.message.includes("Missing or insufficient permissions") ||
      error.message.includes("permission-denied")
    ) {
      message =
        "Database permission denied. Please publish your Firestore Security Rules in the Firebase Console.";
    } else {
      message = error.message;
    }
  }

  // Handle alert popups across Web, iOS, and Android
  if (Platform.OS === "web") {
    window.alert(`${defaultTitle}\n\n${message}`);
  } else {
    Alert.alert(defaultTitle, message);
  }
};
