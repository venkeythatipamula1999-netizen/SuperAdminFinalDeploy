/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { domains: ["firebasestorage.googleapis.com"] },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY:             "AIzaSyA-daJ4E8CEVh89BGEU9wRLGOZAT7T3-vM",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:         "school-app-87900.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:          "school-app-87900",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:      "school-app-87900.firebasestorage.app",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "774655999002",
    NEXT_PUBLIC_FIREBASE_APP_ID:              "1:774655999002:android:6ccc7fd89c5c57598565a3",
    NEXT_PUBLIC_API_URL:                      process.env.NEXT_PUBLIC_API_URL || "",
  },
};

module.exports = nextConfig;
