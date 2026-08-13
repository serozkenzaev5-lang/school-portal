const defaultSchedule = {
  1: ["Математика", "Русский язык", "История", "Физика"],
  2: ["Английский язык", "Информатика", "Геометрия", "Биология"],
  3: ["Математика", "География", "Химия", "Литература"],
  4: ["Русский язык", "Обществознание", "Физкультура", "Английский язык"],
  5: ["Алгебра", "Физика", "История", "ИЗО"],
  6: ["Выходной день"],
  0: ["Выходной день"]
};

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

let selectedDate = new Date();
// Переменная теперь пустая и заполняется из Firebase
let currentUserData = null;

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

function initDashboard() {
  renderCalendar();
  renderScheduleForDate(selectedDate);
  initBottomNav();
  setupThemeToggle();

  // Отслеживаем вход/выход пользователя через Firebase Auth
  checkAuthState();

  // Навигация по календарю
  document.getElementById("prevWeekBtn")?.addEventListener("click", () => {
    selectedDate.setDate(selectedDate.getDate() - 7);
    renderCalendar();
    renderScheduleForDate(selectedDate);
  });

  document.getElementById("nextWeekBtn")?.addEventListener("click", () => {
    selectedDate.setDate(selectedDate.getDate() + 7);
    renderCalendar();
    renderScheduleForDate(selectedDate);
  });

  document.getElementById("btnToday")?.addEventListener("click", () => {
    selectedDate = new Date();
    renderCalendar();
    renderScheduleForDate(selectedDate);
  });

  // Кнопка выхода из аккаунта
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    const auth = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
    if (auth) {
      auth.signOut().then(() => {
        window.location.href = "login.html"; // Или index.html (страница входа)
      });
    }
  });
}

// Загрузка данных вошедшего пользователя из Firebase
function checkAuthState() {
  const auth = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
  const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);

  if (!auth) {
    console.error("Firebase Auth не подключен");
    return;
  }

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      let name = user.displayName || user.email || "Пользователь";
      let role = "student"; // По умолчанию ученик

      if (db) {
        try {
          // Ищем запись пользователя по его UID
          const userDoc = await db.collection("users").doc(user.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            name = userData.name || userData.fullName || name;
            role = userData.role || role;
          }
        } catch (e) {
          console.error("Ошибка загрузки профиля:", e);
        }
      }

      currentUserData = { id: user.uid, name, role };

      // Обновляем интерфейс профиля
      updateUserProfileUI();
      setupTeacherControls();
      loadGrades();
      loadTasks();

    } else {
      // Если не авторизован — перенаправляем на вход (при необходимости раскомментируйте):
      // window.location.href = "login.html";
    }
  });
}

// Отображение имени, роли и аватарки
function updateUserProfileUI() {
  if (!currentUserData) return;

  const userNameEl = document.getElementById("userName");
  const userRoleEl = document.getElementById("userRole");
  const avatarEl = document.getElementById("userAvatar");

  if (userNameEl) userNameEl.innerText = currentUserData.name;
  if (userRoleEl) userRoleEl.innerText = currentUserData.role === 'teacher' ? 'Учитель' : 'Ученик';

  // Генерируем аватарку из первых букв имени
  if (avatarEl && currentUserData.name) {
    const initials = currentUserData.name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    avatarEl.innerText = initials || "ШК";
  }
}

// Переключение светлой / темной темы
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

function renderCalendar() {
  const container = document.getElementById("calendarDays");
  const monthYearHeader = document.getElementById("currentMonthYear");
  if (!container) return;

  container.innerHTML = "";

  const startOfWeek = new Date(selectedDate);
  const dayIndex = startOfWeek.getDay();
  const diffToMon = startOfWeek.getDate() - dayIndex + (dayIndex === 0 ? -6 : 1);
  startOfWeek.setDate(diffToMon);

  if (monthYearHeader) {
    monthYearHeader.innerText = `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  }

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);

    const isSelected = day.toDateString() === selectedDate.toDateString();
    const dayOfWeek = day.getDay();
    const month = day.getMonth();
    const isRedDay = (month === 7) || (dayOfWeek === 0 || dayOfWeek === 6);

    const dayEl = document.createElement("div");
    dayEl.className = `day-col ${isSelected ? "active" : ""}`;
    dayEl.innerHTML = `
      <span class="day-name">${dayNames[i]}</span>
      <span class="day-num ${isRedDay ? "is-red" : ""}">${day.getDate()}</span>
    `;

    dayEl.addEventListener("click", () => {
      selectedDate = new Date(day);
      renderCalendar();
      renderScheduleForDate(selectedDate);
    });

    container.appendChild(dayEl);
  }
}

function renderScheduleForDate(date) {
  const scheduleContainer = document.getElementById("scheduleList");
  const dateTitle = document.getElementById("selectedDateTitle");
  if (!scheduleContainer) return;

  const dayOfWeek = date.getDay();
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  if (dateTitle) dateTitle.innerText = `Расписание на ${date.toLocaleDateString('ru-RU', options)}`;

  const schoolStart = new Date(2026, 8, 1);
  scheduleContainer.innerHTML = "";

  if (date < schoolStart) {
    scheduleContainer.innerHTML = `
      <div class="card vacation-card">
        <h4>🌴 Летние каникулы</h4>
        <p>Учебные занятия начнутся с 1 сентября 2026 года.</p>
      </div>`;
    return;
  }

  const lessons = defaultSchedule[dayOfWeek] || ["Выходной день"];

  lessons.forEach((lesson, index) => {
    const card = document.createElement("div");
    card.className = "card lesson-card";
    card.innerHTML = `
      <div class="lesson-num">${index + 1}</div>
      <div class="lesson-info">
        <h4 class="lesson-title active-term-text">${lesson}</h4>
      </div>
    `;
    scheduleContainer.appendChild(card);
  });
}

async function setupTeacherControls() {
  if (!currentUserData) return;

  const teacherGradePanel = document.getElementById('teacherGradePanel');
  const teacherTaskPanel = document.getElementById('teacherTaskPanel');

  if (currentUserData.role === 'teacher') {
    teacherGradePanel?.classList.remove('hidden');
    teacherTaskPanel?.classList.remove('hidden');
    
    const select = document.getElementById('gradeStudentSelect');
    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>Загрузка учеников...</option>';

    const firestoreDb = window.db || (typeof db !== 'undefined' ? db : null);

    try {
      if (firestoreDb) {
        const snapshot = await firestoreDb.collection("users").where("role", "==", "student").get();
        select.innerHTML = '<option value="" disabled selected>Выберите ученика</option>';

        if (snapshot.empty) {
          select.innerHTML += '<option value="" disabled>Ученики в базе не найдены</option>';
          return;
        }

        snapshot.forEach((doc) => {
          const student = doc.data();
          const option = document.createElement('option');
          option.value = doc.id;
          option.textContent = student.name || student.fullName || "Ученик";
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Ошибка загрузки учеников из Firebase:", error);
      select.innerHTML = '<option value="" disabled selected>Ошибка загрузки списка</option>';
    }
  } else {
    // Если зашел ученик — скрываем панели учителя
    teacherGradePanel?.classList.add('hidden');
    teacherTaskPanel?.classList.add('hidden');
  }
}

function loadGrades() {
  const container = document.getElementById('gradesList');
  if (container && container.children.length === 0) {
    container.innerHTML = `<div class="card"><p>Оценок пока нет.</p></div>`;
  }
}

function loadTasks() {
  const container = document.getElementById('tasksList');
  if (container && container.children.length === 0) {
    container.innerHTML = `<div class="card"><p>Домашних заданий пока нет.</p></div>`;
  }
}

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
