import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA6BV3190_zakzn_zpt9Bi4kGl1EC2rh5c",
  authDomain: "kitshub-92916.firebaseapp.com",
  projectId: "kitshub-92916",
  storageBucket: "kitshub-92916.firebasestorage.app",
  messagingSenderId: "319854365891",
  appId: "1:319854365891:web:9c5ea47de3ead8b90ca676"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);