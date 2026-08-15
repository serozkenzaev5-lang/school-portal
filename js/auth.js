import { auth, db } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Переводы
const translations = {
  ru: {
    portalTitle: "Школьный Портал",
    loginSubtitle: "Вход в личный кабинет",
    registerSubtitle: "Создайте новый аккаунт",
    email: "Email",
    password: "Пароль",
    name: "Имя и Фамилия",
    role: "Ваша роль",
    forgot: "Забыли пароль?",
    loginBtn: "Войти",
    regBtn: "Зарегистрироваться",
    noAcc: "Нет аккаунта?",
    toReg: "Зарегистрироваться",
    hasAcc: "Уже есть аккаунт?",
    toLogin: "Войти",
    selectRole: "Выберите вашу роль",
    student: "Ученик",
    teacher: "Учитель",
    parent: "Родитель"
  },
  en: {
    portalTitle: "School Portal",
    loginSubtitle: "Sign in to your account",
    registerSubtitle: "Create a new account",
    email: "Email",
    password: "Password",
    name: "Full Name",
    role: "Your Role",
    forgot: "Forgot password?",
    loginBtn: "Sign In",
    regBtn: "Register",
    noAcc: "Don't have an account?",
    toReg: "Register",
    hasAcc: "Already have an account?",
    toLogin: "Sign In",
    selectRole: "Select your role",
    student: "Student",
    teacher: "Teacher",
    parent: "Parent"
  },
  uz: {
    portalTitle: "Maktab Portali",
    loginSubtitle: "Tizimga kirish",
    registerSubtitle: "Yangi hisob yaratish",
    email: "Email",
    password: "Parol",
    name: "Ism va Familiya",
    role: "Sizning rolingiz",
    forgot: "Parolni unutdingizmi?",
    loginBtn: "Kirish",
    regBtn: "Ro'yxatdan o'tish",
    noAcc: "Hisobingiz yo'qmi?",
    toReg: "Ro'yxatdan o'tish",
    hasAcc: "Hisobingiz bormi?",
    toLogin: "Kirish",
    selectRole: "Rolingizni tanlang",
    student: "O'quvchi",
    teacher: "O'qituvchi",
    parent: "Ota-ona"
  }
};

let currentLang = localStorage.getItem("appLang") || "ru";
let isRegisterMode = false;

document.addEventListener("DOMContentLoaded", () => {
  initFormSwitch();
  initLanguage();
  initTheme();
  initAuth();
});

// Переключение Вход / Регистрация
function initFormSwitch() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const toRegisterLink = document.getElementById("toRegisterLink");
  const toLoginLink = document.getElementById("toLoginLink");

  toRegisterLink?.addEventListener("click", (e) => {
    e.preventDefault();
    isRegisterMode = true;
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    updateLanguageTexts();
  });

  toLoginLink?.addEventListener("click", (e) => {
    e.preventDefault();
    isRegisterMode = false;
    registerForm.style.display = "none";
    loginForm.style.display = "block";
    updateLanguageTexts();
  });
}

// Переключение языков
function initLanguage() {
  const langSelect = document.getElementById("langSelect");
  if (!langSelect) return;

  langSelect.value = currentLang;

  langSelect.addEventListener("change", (e) => {
    currentLang = e.target.value;
    localStorage.setItem("appLang", currentLang);
    updateLanguageTexts();
  });

  updateLanguageTexts();
}

function updateLanguageTexts() {
  const t = translations[currentLang] || translations.ru;

  document.getElementById("portalTitle").innerText = t.portalTitle;
  document.getElementById("authSubtitle").innerText = isRegisterMode ? t.registerSubtitle : t.loginSubtitle;

  document.getElementById("lblLoginEmail").innerText = t.email;
  document.getElementById("lblLoginPassword").innerText = t.password;
  document.getElementById("lblRegName").innerText = t.name;
  document.getElementById("lblRegEmail").innerText = t.email;
  document.getElementById("lblRegPassword").innerText = t.password;
  document.getElementById("lblRegRole").innerText = t.role;

  document.getElementById("forgotPasswordBtn").innerText = t.forgot;
  document.getElementById("btnLogin").innerText = t.loginBtn;
  document.getElementById("btnRegister").innerText = t.regBtn;

  document.getElementById("noAccountText").innerText = t.noAcc;
  document.getElementById("toRegisterLink").innerText = t.toReg;
  document.getElementById("hasAccountText").innerText = t.hasAcc;
  document.getElementById("toLoginLink").innerText = t.toLogin;

  const regRole = document.getElementById("regRole");
  if (regRole && regRole.options.length >= 4) {
    regRole.options[0].text = t.selectRole;
    regRole.options[1].text = t.student;
    regRole.options[2].text = t.teacher;
    regRole.options[3].text = t.parent;
  }
}

// Тема
function initTheme() {
  const themeBtn = document.getElementById("themeToggle");
  if (!themeBtn) return;

  const savedTheme = localStorage.getItem("appTheme") || "dark-theme";
  document.body.className = savedTheme;
  themeBtn.textContent = savedTheme === "dark-theme" ? "☀️" : "🌙";

  themeBtn.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark-theme");
    const newTheme = isDark ? "light-theme" : "dark-theme";
    document.body.className = newTheme;
    themeBtn.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("appTheme", newTheme);
  });
}

// Авторизация Firebase
function initAuth() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html";
    } catch (err) {
      alert("Ошибка входа: " + err.message);
    }
  });

  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const role = document.getElementById("regRole").value;

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", res.user.uid), {
        name,
        email,
        role,
        createdAt: new Date().toISOString()
      });
      window.location.href = "dashboard.html";
    } catch (err) {
      alert("Ошибка регистрации: " + err.message);
    }
  });
}
