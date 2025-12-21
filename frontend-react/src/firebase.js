// Initialize Firebase
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCIRu9FELlH-EQvcCOr-UqvGDOeKtj6zzQ",
    authDomain: "greenpulseng-ed97c.firebaseapp.com",
    projectId: "greenpulseng-ed97c",
    storageBucket: "greenpulseng-ed97c.firebasestorage.app",
    messagingSenderId: "893779141442",
    appId: "1:893779141442:web:f19a558aec78af0296dedb",
    measurementId: "G-90DYX5EX86"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
