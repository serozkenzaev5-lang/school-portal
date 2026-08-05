import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Регистрация нового пользователя
export async function registerUser(email, password, role, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Сохраняем роль и имя в базу данных Firestore
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      role: role,
      createdAt: new Date()
    });

    alert("Регистрация успешна!");
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Ошибка при регистрации:", error.message);
    alert("Ошибка: " + error.message);
  }
}

// Вход существующего пользователя
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Получаем данные о роли из базы
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Сохраняем роль локально для быстрого доступа
      localStorage.setItem("userRole", userData.role);
      localStorage.setItem("userName", userData.name);
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    console.error("Ошибка при входе:", error.message);
    alert("Неверный логин или пароль");
  }
}