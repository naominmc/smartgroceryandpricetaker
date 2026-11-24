import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  getDocFromServer,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDsQJnaG88UWoliGvAOU5cvf9ctJrIJ4Rg",
  authDomain: "grocerytracker-9ef9b.firebaseapp.com",
  projectId: "grocerytracker-9ef9b",
  storageBucket: "grocerytracker-9ef9b.firebasestorage.app",
  messagingSenderId: "788986834823",
  appId: "1:788986834823:web:ec633464913ad15537ed22",
  measurementId: "G-YC612QM83L",
};

export const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export {
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  getDocFromServer,
  collection,
  query,
  where,
  getDocs,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User,
};
