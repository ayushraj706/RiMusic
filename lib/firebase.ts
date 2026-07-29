import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database"; 
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  GithubAuthProvider, 
  TwitterAuthProvider 
} from "firebase/auth"; 

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only if it hasn't been initialized already (prevents Next.js hot-reload errors)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);

// Auth aur Providers initialize kiya
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider(); 
const githubProvider = new GithubAuthProvider(); 
const twitterProvider = new TwitterAuthProvider(); 

// 👇 YAHI WO EXPORT HAI JISKI WAJAH SE VERCEL PAR ERROR AAYA THA
export { 
  app, 
  database, 
  auth, 
  googleProvider, 
  facebookProvider, 
  githubProvider, 
  twitterProvider 
};
