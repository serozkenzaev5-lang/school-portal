// Ваши ключи из консоли Firebase
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
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Делаем базы данных доступными для dashboard.js
window.db = firebase.firestore();
window.auth = firebase.auth();
