import { auth, db } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const authMessage = document.getElementById('authMessage');

function showMessage(msg, isError = true) {
  if (!authMessage) return;
  authMessage.textContent = msg;
  authMessage.className = `auth-message ${isError ? 'error' : 'success'}`;
  authMessage.classList.remove('hidden');
}

// 1. Вход в аккаунт
const loginForm = document.getElementById('loginForm');
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const loginBtn = document.getElementById('loginBtn');

  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Вход...';
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Ошибка входа:", error);
    let errorMsg = "Не удалось войти.";
    
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMsg = "Неверный Email или пароль.";
    } else if (error.code === 'auth/invalid-email') {
      errorMsg = "Некорректный адрес Email.";
    } else {
      errorMsg += " " + error.message;
    }
    
    showMessage(errorMsg, true);
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Войти';
    }
  }
});

// 2. Регистрация аккаунта
const registerForm = document.getElementById('registerForm');
registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;
  const regBtn = document.getElementById('regBtn');

  if (regBtn) {
    regBtn.disabled = true;
    regBtn.textContent = 'Создание...';
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      role: role
    });

    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    let errorMsg = "Не удалось зарегистрироваться.";
    
    if (error.code === 'auth/email-already-in-use') {
      errorMsg = "Этот Email уже зарегистрирован.";
    } else if (error.code === 'auth/weak-password') {
      errorMsg = "Пароль слишком простой (минимум 6 символов).";
    } else {
      errorMsg += " " + error.message;
    }
    
    showMessage(errorMsg, true);
  } finally {
    if (regBtn) {
      regBtn.disabled = false;
      regBtn.textContent = 'Зарегистрироваться';
    }
  }
});

// 3. Восстановление пароля (с отправкой письма на почту)
const resetForm = document.getElementById('resetForm');
resetForm?.addEventListener('submit', async (e) => {
  e.preventDefault(); // Запрещаем перезагрузку страницы

  const emailInput = document.getElementById('resetEmail');
  const email = emailInput ? emailInput.value.trim() : "";
  const resetBtn = document.getElementById('resetBtn');

  if (!email) {
    showMessage("Пожалуйста, введите Email адрес.", true);
    return;
  }

  if (resetBtn) {
    resetBtn.disabled = true;
    resetBtn.textContent = 'Отправка...';
  }

  try {
    // Отправляем письмо с ссылкой для сброса пароля через Firebase
    await sendPasswordResetEmail(auth, email);
    
    // Показываем плашку об успешной отправке
    showMessage(`Письмо со ссылкой для восстановления пароля отправлено на ${email}. Проверьте почту!`, false);
    
    // Очищаем поле ввода
    if (emailInput) emailInput.value = "";
  } catch (error) {
    console.error("Ошибка сброса пароля:", error);
    let errorMsg = "Не удалось отправить письмо.";
    
    if (error.code === 'auth/user-not-found') {
      errorMsg = "Пользователь с таким Email не найден.";
    } else if (error.code === 'auth/invalid-email') {
      errorMsg = "Некорректный адрес Email.";
    } else if (error.code === 'auth/too-many-requests') {
      errorMsg = "Слишком много запросов. Попробуйте чуть позже.";
    } else {
      errorMsg += " " + error.message;
    }
    
    showMessage(errorMsg, true);
  } finally {
    if (resetBtn) {
      resetBtn.disabled = false;
      resetBtn.textContent = 'Сбросить пароль';
    }
  }
});
