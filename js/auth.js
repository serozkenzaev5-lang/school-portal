import { auth, db } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Вход в аккаунт
const loginForm = document.getElementById('loginForm');
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "dashboard.html";
  } catch (error) {
    alert("Ошибка входа: " + error.message);
  }
});

// Регистрация аккаунта
const registerForm = document.getElementById('registerForm');
registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Сохранение пользователя в базу
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      role: role
    });

    window.location.href = "dashboard.html";
  } catch (error) {
    alert("Ошибка регистрации: " + error.message);
  }
});
