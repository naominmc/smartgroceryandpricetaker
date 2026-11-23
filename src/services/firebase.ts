import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

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
export { doc, setDoc, onSnapshot, getDoc };

