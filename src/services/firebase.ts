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
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBM3tpTLKm-W8YIasQ2gwBdBbKVmuS8p_E",
  authDomain: "smartgroceryandpricetaker.firebaseapp.com",
  projectId: "smartgroceryandpricetaker",
  storageBucket: "smartgroceryandpricetaker.firebasestorage.app",
  messagingSenderId: "778352839650",
  appId: "1:778352839650:web:26ce782031900d6fdc47bb"
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
};


