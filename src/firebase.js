import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUR6oVAirVYLa-5JitM2wOLw3us1Nh2ZI",
  authDomain: "cute-expense-tracking-app.firebaseapp.com",
  projectId: "cute-expense-tracking-app",
  storageBucket: "cute-expense-tracking-app.appspot.com",
  messagingSenderId: "698429586639",
  appId: "1:698429586639:web:126270ba68e71cde2d4bba",
  measurementId: "G-0BJW71TZ71"
};

let auth, db, analytics, googleProvider;

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  analytics = getAnalytics(app);
  googleProvider = new GoogleAuthProvider();

  // If you're using Firebase Emulators, uncomment the following line:
  // connectFirestoreEmulator(db, 'localhost', 8080);

  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Add this function to test Firestore connection
const testFirestoreConnection = async () => {
  try {
    const testDoc = await db.collection('test').doc('test').get();
    console.log("Firestore connection successful:", testDoc.exists);
  } catch (error) {
    console.error("Firestore connection error:", error);
  }
};

testFirestoreConnection();

export { auth, db, googleProvider, analytics };