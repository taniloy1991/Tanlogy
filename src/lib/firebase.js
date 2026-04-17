import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsxXNn4W8UzpXuVVWWXZ07ILwQyhNtwEc",
  authDomain: "tanlogy.firebaseapp.com",
  projectId: "tanlogy",
  storageBucket: "tanlogy.firebasestorage.app",
  messagingSenderId: "199379941294",
  appId: "1:199379941294:web:3b501f59c779ce77f27a3f",
  measurementId: "G-S7XS46BJWP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { app, analytics, auth, db };
