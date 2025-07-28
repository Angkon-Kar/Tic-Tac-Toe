// js/auth.js
// Import Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Configuration (REPLACE WITH YOUR ACTUAL CONFIG)
const firebaseConfig = {
  apiKey: "AIzaSyD1EunADEEbG8WGbLfcpMl0V62rK_WYO9Y",
  authDomain: "ak-tic-tac-toe-game-3.firebaseapp.com",
  projectId: "ak-tic-tac-toe-game-3",
  storageBucket: "ak-tic-tac-toe-game-3.firebasestorage.app",
  messagingSenderId: "437811263623",
  appId: "1:437811263623:web:5e93e8e73d1f4bfdd1e022",
  measurementId: "G-KWBP59VV82"
};

// Use the projectId from your firebaseConfig as the appId for consistency
export const appId = firebaseConfig.projectId;

// initialAuthToken is only for the Canvas environment, not needed for external deployment
const initialAuthToken = null;

// Firebase instances - declared globally but initialized within the function
let app;
export let db;
export let auth;
export let userId = null; // Current user's ID

// Callback function to notify when auth is ready
let authReadyCallback = null;

/**
 * Initializes Firebase app and authenticates the user.
 * This function should be called once when the application starts.
 * It sets up an authentication state observer to get the user ID.
 * @param {Function} callback - A function to call once authentication is ready and userId is set.
 */
export async function initializeFirebaseAndAuth(callback) {
    console.log("Auth: Attempting to initialize Firebase and authenticate...");
    authReadyCallback = callback; // Store the callback

    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("Auth: Firebase app initialized.");

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                userId = user.uid;
                console.log("Auth: Authenticated with user ID:", userId);
                if (authReadyCallback) {
                    authReadyCallback(userId); // Notify main script that auth is ready
                    authReadyCallback = null; // Clear callback after use
                }
            } else {
                console.log("Auth: No user signed in, attempting anonymous sign-in...");
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                    console.log("Auth: Signed in with custom token.");
                } else {
                    await signInAnonymously(auth);
                    console.log("Auth: Signed in anonymously.");
                }
            }
        });
    } catch (error) {
        console.error("Auth: Error initializing Firebase or authenticating:", error);
        // In a real app, you might want to display a persistent error message here
        // For now, we'll let the main.js handle the modal display on init failure.
    }
}

/**
 * Gets the current authenticated user ID.
 * @returns {string|null} The current user ID or null if not authenticated.
 */
export function getCurrentUserId() {
    return userId;
}
