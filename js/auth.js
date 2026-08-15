import { auth, db } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. СЛОВАРЬ ПЕРЕВОДОВ (RU / EN / UZ)
// ==========================================
const authTranslations = {
  ru: {
    portalTitle: "Школьный Портал",
    loginSubtitle: "Вход в личный кабинет",
    registerSubtitle: "Создайте новый аккаунт",
    lblName: "Имя и Фамилия",
    lblEmail: "Email",
    lblPassword: "Пароль",
    lblRole: "Ваша роль",
    forgotPassword: "Забыли пароль?",
    btnLogin: "Войти",
    btnRegister: "Зарегистрироваться",
    noAccountText: "Нет аккаунта?",
    linkRegister: "Зарегистрироваться",
    hasAccountText: "Уже есть аккаунт?",
    linkLogin: "Войти",
    roleDefault: "Выберите вашу роль",
    roleStudent: "Ученик",
    roleTeacher: "Учитель",
    roleParent: "Родитель",
    phName: "Иван Иванов"
  },
  en: {
    portalTitle: "School Portal",
    loginSubtitle: "Sign in to your account",
    registerSubtitle: "Create a new account",
    lblName: "Full Name",
    lblEmail: "Email",
    lblPassword: "Password",
    lblRole: "Your Role",
    forgotPassword: "Forgot password?",
    btnLogin: "Sign In",
    btnRegister: "Register",
    noAccountText: "Don't have an account?",
    linkRegister: "Register",
    hasAccountText: "Already have an account?",
    linkLogin: "Sign In",
    roleDefault: "Select your role",
    roleStudent: "Student",
    roleTeacher: "Teacher",
    roleParent: "Parent",
    phName: "John Doe"
  },
  uz: {
    portalTitle: "Maktab Portali",
    loginSubtitle: "Tizimga kirish",
    registerSubtitle: "Yangi hisob yaratish",
    lblName: "Ism va Familiya",
    lblEmail: "Email",
    lblPassword: "Parol",
    lblRole: "Sizning rolingiz",
    forgotPassword: "Parolni unutdingizmi?",
    btnLogin: "Kirish",
    btnRegister: "Ro'yxatdan o'tish",
    noAccountText: "Hisobingiz yo'qmi?",
    linkRegister: "Ro'yxatdan o'tish",
    hasAccountText: "Hisobingiz bormi?",
    linkLogin: "Kirish",
    roleDefault: "Rolingizni tanlang",
    roleStudent: "O'quvchi",
    roleTeacher: "O'qituvchi",
    roleParent: "Ota-ona",
    phName: "Ali Valiyev"
  }
};

let currentLang = localStorage.getItem("appLang") || "ru";
let isRegisterMode = false;

// ==========================================
// 2. ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  setupFormSwitching();
  setupLanguageSelect();
  setupThemeToggle();
  applyAuthLanguage();
  setupAuthHandlers();
});

// ==========================================
// 3. ПЕРЕКЛЮЧЕНИЕ ВХОД / РЕГИСТРАЦИЯ
// ==========================================
function setupFormSwitching() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const toRegisterLink = document.getElementById("toRegisterLink");
  const toLoginLink = document.getElementById("toLoginLink");

  // Изначальное состояние полей
  if (loginForm && registerForm) {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
  }

  // Переход на страницу регистрации
  toRegisterLink?.addEventListener("click", (e) => {
    e.preventDefault();
    isRegisterMode = true;
    if (loginForm) loginForm.style.display = "none";
    if (registerForm) registerForm.style.display = "block";
    applyAuthLanguage();
  });

  // Переход на страницу входа
  toLoginLink?.addEventListener("click", (e) => {
    e.preventDefault();
    isRegisterMode = false;
    if (registerForm) registerForm.style.display = "none";
    if (loginForm) loginForm.style.display = "block";
    applyAuthLanguage();
  });
}

// ==========================================
// 4. СМЕНА ЯЗЫКА И ОБНОВЛЕНИЕ ТЕКСТОВ
// ==========================================
function setupLanguageSelect() {
  const langSelect = document.getElementById("langSelect");
  if (!langSelect) return;

  langSelect.value = currentLang;

  langSelect.addEventListener("change", (e) => {
    currentLang = e.target.value;
    localStorage.setItem("appLang", currentLang); // Сохраняем для Dashboard
    applyAuthLanguage();
  });
}

function applyAuthLanguage() {
  const t = authTranslations[currentLang] || authTranslations.ru;

  // Заголовки
  const portalTitle = document.getElementById("portalTitle");
  if (portalTitle) portalTitle.innerText = t.portalTitle;

  const authSubtitle = document.getElementById("authSubtitle");
  if (authSubtitle) {
    authSubtitle.innerText = isRegisterMode ? t.registerSubtitle : t.loginSubtitle;
  }

  // Метки полей
  const lblLoginEmail = document.getElementById("lblLoginEmail");
  if (lblLoginEmail) lblLoginEmail.innerText = t.lblEmail;

  const lblLoginPassword = document.getElementById("lblLoginPassword");
  if (lblLoginPassword) lblLoginPassword.innerText = t.lblPassword;

  const lblRegName = document.getElementById("lblRegName");
  if (lblRegName) lblRegName.innerText = t.lblName;

  const lblRegEmail = document.getElementById("lblRegEmail");
  if (lblRegEmail) lblRegEmail.innerText = t.lblEmail;

  const lblRegPassword = document.getElementById("lblRegPassword");
  if (lblRegPassword) lblRegPassword.innerText = t.lblPassword;

  const lblRegRole = document.getElementById("lblRegRole");
  if (lblRegRole) lblRegRole.innerText = t.lblRole;

  // Плейсхолдер
  const regName = document.getElementById("regName");
  if (regName) regName.placeholder = t.phName;

  // Кнопки и ссылки
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  if (forgotPasswordBtn) forgotPasswordBtn.innerText = t.forgotPassword;

  const btnLogin = document.getElementById("btnLogin");
  if (btnLogin) btnLogin.innerText = t.btnLogin;

  const btnRegister = document.getElementById("btnRegister");
  if (btnRegister) btnRegister.innerText = t.btnRegister;

  const noAccountText = document.getElementById("noAccountText");
  if (noAccountText) noAccountText.innerText = t.noAccountText;

  const toRegisterLink = document.getElementById("toRegisterLink");
  if (toRegisterLink) toRegisterLink.innerText = t.linkRegister;

  const hasAccountText = document.getElementById("hasAccountText");
  if (hasAccountText) hasAccountText.innerText = t.hasAccountText;

  const toLoginLink = document.getElementById("toLoginLink");
  if (toLoginLink) toLoginLink.innerText = t.linkLogin;

  // Список ролей
  const regRole = document.getElementById("regRole");
  if (regRole && regRole.options.length >= 4) {
    regRole.options[0].text = t.roleDefault;
    regRole.options[1].text = t.roleStudent;
    regRole.options[2].text = t.roleTeacher;
    regRole.options[3].text = t.roleParent;
  }
}

// ==========================================
// 5. ПЕРЕКЛЮЧЕНИЕ ТЕМЫ (Светлая / Темная)
// ==========================================
function setupThemeToggle() {
  const themeBtn = document.getElementById("themeToggle");
  if (!themeBtn) return;

  const savedTheme = localStorage.getItem("appTheme") || "light-theme";
  document.body.className = savedTheme;
  themeBtn.textContent = savedTheme === "dark-theme" ? "🌙" : "☀️";

  themeBtn.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark-theme");
    const newTheme = isDark ? "light-theme" : "dark-theme";
    
    document.body.className = newTheme;
    themeBtn.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("appTheme", newTheme);
  });
}

// ==========================================
// 6. ОБРАБОТКА ФОРМ (Firebase)
// ==========================================
function setupAuthHandlers() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  // Авторизация
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("Ошибка входа:", error);
      alert("Не удалось войти. Проверьте логин и пароль.");
    }
  });

  // Регистрация
  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const role = document.getElementById("regRole").value;

    if (!role) {
      alert("Выберите вашу роль!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        role: role,
        createdAt: new Date().toISOString()
      });

      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("Ошибка регистрации:", error);
      alert("Ошибка при создании аккаунта.");
    }
  });
}
