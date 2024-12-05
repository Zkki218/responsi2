// src/utils/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBiA-21ID8a3Ktx6HzxXgkAT5rzkKII4Pk",

  authDomain: "responsi2-607ec.firebaseapp.com",

  projectId: "responsi2-607ec",

  storageBucket: "responsi2-607ec.firebasestorage.app",

  messagingSenderId: "795041045220",

  appId: "1:795041045220:web:7472c19bb544e73c5f6af1",
};

const firebase = initializeApp(firebaseConfig);
const auth = getAuth(firebase);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(firebase);

export { auth, googleProvider, db };
