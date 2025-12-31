// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDG3LyMNraSP0RNBXVlC_mEniYtOTlqKJo",
  authDomain: "tsumagari-homepage.firebaseapp.com",
  projectId: "tsumagari-homepage",
  storageBucket: "tsumagari-homepage.firebasestorage.app",
  messagingSenderId: "226654043626",
  appId: "1:226654043626:web:83659817b51f342fbb8693"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
