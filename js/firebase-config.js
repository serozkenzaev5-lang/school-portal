import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Конфигурация твоего Firebase проекта
const firebaseConfig = {
  // Твои ключи Firebase (вставь свои, если отличаются)
  apiKey: "AIzaSy...", 
  authDomain: "school-portal-ff938.firebaseapp.com",
  projectId: "school-portal-ff938",
  storageBucket: "school-portal-ff938.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// 1. Инициализация приложения
const app = initializeApp(firebaseConfig);

// 2. Инициализация и ОБЯЗАТЕЛЬНЫЙ ЭКСПОРТ auth и db
export const auth = getAuth(app);
export const db = getFirestore(app);
