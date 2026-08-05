import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const defaultSchedule = {
  1: ["Математика", "Русский язык", "История", "Физика"],
  2: ["Английский язык", "Информатика", "Геометрия", "Биология"],
  3: ["Математика", "География", "Химия", "Литература"],
  4: ["Русский язык", "Обществознание", "Физкультура", "Английский язык"],
  5: ["Алгебра", "Физика", "История", "ИЗО"],
  6: ["Внеурочное занятие"],
  0: ["Выходной день"]
};

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

let selectedDate = new Date();

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      initDashboard(userDoc.data());
    } else {
      initDashboard({ name: "Шероз Кенжаев", role: "Ученик" });
    }
  } else {
    // Вход по умолчанию для тестирования
    initDashboard({ name: "Шероз Кенжаев", role: "Ученик" });
  }
});

function initDashboard(userData) {
  const userNameEl = document.getElementById("userName");
  if (userNameEl) userNameEl.innerText = userData.name;

  renderCalendar();
  renderScheduleForDate(selectedDate);
  initBottomNav();

  // ПЕРЕКЛЮЧЕНИЕ ТОЛЬКО ПО КЛИКУ НА СТРЕЛКИ
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

  // Кнопка перехода на сегодняшнюю дату
  document.getElementById("btnToday")?.addEventListener("click", () => {
    selectedDate = new Date();
    renderCalendar();
    renderScheduleForDate(selectedDate);
  });
}

function renderCalendar() {
  const container = document.getElementById("calendarDays");
  const monthYearHeader = document.getElementById("currentMonthYear");
  if (!container) return;

  container.innerHTML = "";

  // Определяем понедельник текущей недели
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

    const dayEl = document.createElement("div");
    dayEl.className = `day-col ${isSelected ? "active" : ""}`;
    dayEl.innerHTML = `
      <span class="day-name">${dayNames[i]}</span>
      <span class="day-num">${day.getDate()}</span>
    `;

    // Выбор дня внутри отображаемой недели
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

  // До 1 сентября показывуется карточка каникул
  const schoolStart = new Date(2026, 8, 1);
  const isVacation = date < schoolStart;

  scheduleContainer.innerHTML = "";

  if (isVacation) {
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

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  signOut(auth).then(() => window.location.href = "index.html");
});
