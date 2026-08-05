import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Slovar perevodov
const translations = {
  ru: {
    roleStudent: "Ученик", roleTeacher: "Учитель", roleParent: "Родитель",
    august: "Август", today: "Сегодня",
    mon: "Пн", tue: "Вт", wed: "Ср", thu: "Чт", fri: "Пт", sat: "Сб", sun: "Вс",
    navSchedule: "Расписание", navGrades: "Оценки", navHw: "Задания",
    math: "Математика", rus: "Русский язык",
    gradesTitle: "Дневник успеваемости", hwTitle: "Домашнее задание",
    noGrades: "Оценок пока нет.", errGrades: "Ошибка загрузки оценок."
  },
  en: {
    roleStudent: "Student", roleTeacher: "Teacher", roleParent: "Parent",
    august: "August", today: "Today",
    mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
    navSchedule: "Schedule", navGrades: "Grades", navHw: "Tasks",
    math: "Mathematics", rus: "Russian Language",
    gradesTitle: "Gradebook", hwTitle: "Homework",
    noGrades: "No grades yet.", errGrades: "Error loading grades."
  },
  uz: {
    roleStudent: "O'quvchi", roleTeacher: "O'qituvchi", roleParent: "Ota-ona",
    august: "Avgust", today: "Bugun",
    mon: "Du", tue: "Se", wed: "Ch", thu: "Pa", fri: "Ju", sat: "Sh", sun: "Yak",
    navSchedule: "Dars jadvali", navGrades: "Baholar", navHw: "Vazifalar",
    math: "Matematika", rus: "Rus tili",
    gradesTitle: "Baholar kundaligi", hwTitle: "Uy vazifasi",
    noGrades: "Hozircha baholar yo'q.", errGrades: "Baholarni yuklashda xatolik."
  }
};

let currentLang = 'ru';

// Proverka avtorizacii
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      renderDashboard(userDoc.data());
    }
  } else {
    window.location.href = "index.html";
  }
});

// Otrisovka paneli
function renderDashboard(userData) {
  const userNameEl = document.getElementById("userName");
  const userAvatarEl = document.getElementById("userAvatar");
  const userRoleEl = document.getElementById("userRole");

  if (userNameEl) userNameEl.innerText = userData.name;
  if (userAvatarEl && userData.name) {
    userAvatarEl.innerText = userData.name.split(" ").map(n => n[0]).join("").toUpperCase();
  }
  if (userRoleEl) {
    userRoleEl.innerText = getRoleName(userData.role);
    userRoleEl.setAttribute("data-i18n", `role${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}`);
  }

  // Zagruzhaem ocenki dlya uchenika
  if (userData.role !== "teacher") {
    loadStudentGrades(userData.email);
    initBottomNav();
  } else {
    renderTeacherPanel();
  }
}

// Perekluchenie vkladok v Bottom Nav Bar
function initBottomNav() {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  const tabPages = document.querySelectorAll('.tab-page');

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      navItems.forEach(b => b.classList.remove('active'));
      tabPages.forEach(p => p.classList.add('hidden'));

      btn.classList.add('active');
      const targetTab = document.getElementById(`tab-${btn.dataset.tab}`);
      if (targetTab) targetTab.classList.remove('hidden');
    });
  });
}

// Zagruzka ocenok iz Firestore
async function loadStudentGrades(email) {
  const container = document.getElementById("gradesList");
  if (!container) return;

  try {
    const q = query(collection(db, "grades"), where("studentEmail", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = `<p>${translations[currentLang].noGrades}</p>`;
      return;
    }

    let html = "";
    querySnapshot.forEach((doc) => {
      const item = doc.data();
      html += `
        <div class="card">
          <strong>${item.subject}:</strong> ${item.grade} 
          <span style="float: right; opacity: 0.6;">${item.date}</span>
        </div>`;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error("Ошибка загрузки оценок:", error);
    container.innerHTML = `<p>${translations[currentLang].errGrades}</p>`;
  }
}

// Panel uchitelya
function renderTeacherPanel() {
  const content = document.querySelector('.app-content');
  if (!content) return;

  content.innerHTML = `
    <section class="card">
      <h3>Выставить оценку</h3>
      <form id="gradeForm">
        <input type="email" id="studentEmail" placeholder="Email ученика" required>
        <input type="text" id="subject" placeholder="Предмет" required>
        <input type="number" id="grade" placeholder="Оценка (1-5)" min="1" max="5" required>
        <button type="submit" class="cal-pill" style="width: 100%; margin-top: 10px;">Сохранить</button>
      </form>
    </section>
  `;

  document.getElementById("gradeForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "grades"), {
        studentEmail: document.getElementById("studentEmail").value,
        subject: document.getElementById("subject").value,
        grade: parseInt(document.getElementById("grade").value),
        date: new Date().toLocaleDateString("ru-RU")
      });
      alert("Оценка успешно добавлена!");
      e.target.reset();
    } catch (err) {
      alert("Ошибка при сохранении: " + err.message);
    }
  });
}

function getRoleName(role) {
  const roles = { teacher: "Учитель", student: "Ученик", parent: "Родитель" };
  return roles[role] || role;
}

// Smena yazyka
document.getElementById("langSelect")?.addEventListener("change", (e) => {
  currentLang = e.target.value;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });
});

// Smena temy
document.getElementById("themeToggle")?.addEventListener("click", () => {
  const body = document.body;
  const isLight = body.classList.contains("light-theme");
  body.classList.toggle("light-theme", !isLight);
  body.classList.toggle("dark-theme", isLight);
  document.getElementById("themeToggle").textContent = isLight ? "☀️" : "🌙";
});

// Vyhod
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  signOut(auth).then(() => window.location.href = "index.html");
});
