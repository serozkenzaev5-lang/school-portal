import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQcXc5Pvl3MedAuOlpH2Dvr2VTlXwc-jM",
  authDomain: "school-portal-ff938.firebaseapp.com",
  projectId: "school-portal-ff938",
  storageBucket: "school-portal-ff938.firebasestorage.app",
  messagingSenderId: "569193226135",
  appId: "1:569193226135:web:8f7b901a8f288d37e1eed2",
  measurementId: "G-NVQG0DTXB3"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Экспорт авторизации и базы данных
export const auth = getAuth(app);
export const db = getFirestore(app);
