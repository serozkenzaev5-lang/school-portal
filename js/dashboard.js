import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Проверка авторизации
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

// Отрисовка интерфейса
function renderDashboard(userData) {
  document.getElementById("userInfo").innerText = `${userData.name} (${getRoleName(userData.role)})`;
  const contentArea = document.getElementById("dashboardContent");

  if (userData.role === "teacher") {
    renderTeacherPanel(contentArea);
  } else {
    renderStudentPanel(contentArea, userData);
  }
}

// Меню и панели для ученика/родителя
function renderStudentPanel(container, userData) {
  container.innerHTML = `
    <nav class="student-menu">
      <button class="menu-btn active" data-tab="grades">📊 Оценки</button>
      <button class="menu-btn" data-tab="schedule">📅 Расписание</button>
      <button class="menu-btn" data-tab="homework">📚 Домашнее задание</button>
    </nav>

    <div id="tab-grades" class="tab-content active">
      <h3>Дневник успеваемости</h3>
      <div id="gradesList" class="card">Загрузка оценок...</div>
    </div>

    <div id="tab-schedule" class="tab-content hidden">
      <h3>Расписание уроков</h3>
      <div class="card">
        <table class="schedule-table">
          <tr><th>День</th><th>Уроки</th></tr>
          <tr><td>Понедельник</td><td>Математика, Русский язык, История</td></tr>
          <tr><td>Вторник</td><td>Английский язык, Физика, Информатика</td></tr>
          <tr><td>Среда</td><td>Математика, Биология, География</td></tr>
          <tr><td>Четверг</td><td>Русский язык, Литература, Химия</td></tr>
          <tr><td>Пятница</td><td>Английский язык, Физкультура, Обществознание</td></tr>
        </table>
      </div>
    </div>

    <div id="tab-homework" class="tab-content hidden">
      <h3>Домашнее задание</h3>
      <div class="card">
        <ul>
          <li><strong>Математика:</strong> Решить № 124, 125</li>
          <li><strong>Английский:</strong> Выучить новые слова на стр. 45</li>
          <li><strong>Русский язык:</strong> Упражнение 88</li>
        </ul>
      </div>
    </div>
  `;

  // Подгружаем оценки
  loadStudentGrades(userData.email);

  // Настройка переключения вкладок
  const buttons = container.querySelectorAll('.menu-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

      btn.classList.add('active');
      const tabId = `tab-${btn.dataset.tab}`;
      document.getElementById(tabId).classList.remove('hidden');
    });
  });
}

// Загрузка оценок из Firestore
async function loadStudentGrades(email) {
  const container = document.getElementById("gradesList");
  try {
    const q = query(collection(db, "grades"), where("studentEmail", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = "<p>Оценок пока нет.</p>";
      return;
    }

    let html = "<ul>";
    querySnapshot.forEach((doc) => {
      const item = doc.data();
      html += `<li><strong>${item.subject}:</strong> ${item.grade} <span class="date">(${item.date})</span></li>`;
    });
    html += "</ul>";

    container.innerHTML = html;
  } catch (error) {
    console.error("Ошибка загрузки оценок:", error);
    container.innerHTML = "<p>Ошибка загрузки оценок.</p>";
  }
}

// Панель учителя
function renderTeacherPanel(container) {
  container.innerHTML = `
    <h3>Панель учителя</h3>
    <div class="card">
      <h4>Выставить оценку</h4>
      <form id="gradeForm">
        <input type="email" id="studentEmail" placeholder="Email ученика" required>
        <input type="text" id="subject" placeholder="Предмет" required>
        <input type="number" id="grade" placeholder="Оценка (1-5)" min="1" max="5" required>
        <button type="submit">Сохранить</button>
      </form>
    </div>
  `;
  initTeacherEvents();
}

// Обработчик формы учителя
function initTeacherEvents() {
  const form = document.getElementById("gradeForm");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const studentEmail = document.getElementById("studentEmail").value;
    const subject = document.getElementById("subject").value;
    const grade = document.getElementById("grade").value;

    try {
      await addDoc(collection(db, "grades"), {
        studentEmail: studentEmail,
        subject: subject,
        grade: parseInt(grade),
        date: new Date().toLocaleDateString("ru-RU")
      });
      alert("Оценка успешно добавлена!");
      form.reset();
    } catch (err) {
      alert("Ошибка при сохранении: " + err.message);
    }
  });
}

function getRoleName(role) {
  const roles = { teacher: "Учитель", student: "Ученик", parent: "Родитель" };
  return roles[role] || role;
}

// Выход
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  signOut(auth).then(() => window.location.href = "index.html");
});
// Переводы для страниц (RU, EN, UZ)
const translations = {
  ru: {
    roleStudent: "Ученик",
    august: "Август",
    today: "Сегодня",
    mon: "Пн", tue: "Вт", wed: "Ср", thu: "Чт", fri: "Пт", sat: "Сб", sun: "Вс",
    navSchedule: "Расписание", navGrades: "Оценки", navHw: "Задания",
    math: "Математика", rus: "Русский язык",
    gradesTitle: "Дневник успеваемости", hwTitle: "Домашнее задание"
  },
  en: {
    roleStudent: "Student",
    august: "August",
    today: "Today",
    mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
    navSchedule: "Schedule", navGrades: "Grades", navHw: "Tasks",
    math: "Mathematics", rus: "Russian Language",
    gradesTitle: "Gradebook", hwTitle: "Homework"
  },
  uz: {
    roleStudent: "O'quvchi",
    august: "Avgust",
    today: "Bugun",
    mon: "Du", tue: "Se", wed: "Ch", thu: "Pa", fri: "Ju", sat: "Sh", sun: "Yak",
    navSchedule: "Dars jadvali", navGrades: "Boholar", navHw: "Vazifalar",
    math: "Matematika", rus: "Rus tili",
    gradesTitle: "Baholar kundaligi", hwTitle: "Uy vazifasi"
  }
};

// Смена языка
const langSelect = document.getElementById("langSelect");
langSelect?.addEventListener("change", (e) => {
  const lang = e.target.value;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
});

// Смена темной/светлой темы
const themeBtn = document.getElementById("themeToggle");
themeBtn?.addEventListener("click", () => {
  const body = document.body;
  if (body.classList.contains("light-theme")) {
    body.classList.replace("light-theme", "dark-theme");
    themeBtn.textContent = "☀️";
  } else {
    body.classList.replace("dark-theme", "light-theme");
    themeBtn.textContent = "🌙";
  }
});
