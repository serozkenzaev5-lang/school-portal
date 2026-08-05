import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, addDoc, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
let currentUserData = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      currentUserData = { id: user.uid, ...userDoc.data() };
    } else {
      currentUserData = { id: user.uid, name: "Пользователь", role: "student" };
    }
  } else {
    currentUserData = { id: "demo", name: "Учитель", role: "teacher" };
  }
  initDashboard();
});

function initDashboard() {
  const userNameEl = document.getElementById("userName");
  const userRoleEl = document.getElementById("userRole");
  
  if (userNameEl) userNameEl.innerText = currentUserData.name;
  if (userRoleEl) userRoleEl.innerText = currentUserData.role === 'teacher' ? 'Учитель' : 'Ученик';

  renderCalendar();
  renderScheduleForDate(selectedDate);
  initBottomNav();
  setupTeacherControls();
  loadGrades();
  loadTasks();

  // Переключение по стрелкам
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

    // Красный цвет в августе или на выходных (Сб, Вс)
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

// ---------------- ПОДДЕРЖКА УЧИТЕЛЯ ----------------

function setupTeacherControls() {
  if (currentUserData.role === 'teacher') {
    document.getElementById('teacherGradePanel')?.classList.remove('hidden');
    document.getElementById('teacherTaskPanel')?.classList.remove('hidden');
    loadStudentsList();
  }
}

async function loadStudentsList() {
  const select = document.getElementById('gradeStudentSelect');
  if (!select) return;
  select.innerHTML = `<option value="" disabled selected>Выберите ученика</option>`;
  
  try {
    const q = query(collection(db, "users"), where("role", "==", "student"));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((docSnap) => {
      const student = docSnap.data();
      const opt = document.createElement('option');
      opt.value = docSnap.id;
      opt.textContent = student.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.log("Загрузка списка учеников");
  }
}

document.getElementById('addGradeForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const studentId = document.getElementById('gradeStudentSelect').value;
  const subject = document.getElementById('gradeSubjectSelect').value;
  const value = document.getElementById('gradeValueSelect').value;
  const reason = document.getElementById('gradeReasonInput').value;

  try {
    await addDoc(collection(db, "grades"), {
      studentId,
      subject,
      value,
      reason,
      date: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp()
    });
    alert("Отметка успешно выставлена!");
    document.getElementById('addGradeForm').reset();
    loadGrades();
  } catch (err) {
    alert("Ошибка при сохранении отметки.");
  }
});

document.getElementById('addTaskForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const subject = document.getElementById('taskSubjectSelect').value;
  const dueDate = document.getElementById('taskDueDate').value;
  const description = document.getElementById('taskDescInput').value;

  try {
    await addDoc(collection(db, "tasks"), {
      subject,
      dueDate,
      description,
      createdAt: serverTimestamp()
    });
    alert("Домашнее задание опубликовано!");
    document.getElementById('addTaskForm').reset();
    loadTasks();
  } catch (err) {
    alert("Ошибка при добавлении задания.");
  }
});

async function loadGrades() {
  const container = document.getElementById('gradesList');
  if (!container) return;
  container.innerHTML = "";

  try {
    const querySnapshot = await getDocs(collection(db, "grades"));
    if (querySnapshot.empty) {
      container.innerHTML = `<div class="card"><p>Оценок пока нет.</p></div>`;
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const g = docSnap.data();
      let badgeClass = "";
      if (g.value === "Б") badgeClass = "status-b";
      if (g.value === "П") badgeClass = "status-p";

      const card = document.createElement("div");
      card.className = "card grade-card";
      card.innerHTML = `
        <div class="grade-badge ${badgeClass}">${g.value}</div>
        <div class="grade-details">
          <h4>${g.subject}</h4>
          <p class="grade-reason">Причина: ${g.reason}</p>
          <small class="grade-date">Дата: ${g.date}</small>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<div class="card"><p>Оценок пока нет.</p></div>`;
  }
}

async function loadTasks() {
  const container = document.getElementById('tasksList');
  if (!container) return;
  container.innerHTML = "";

  try {
    const querySnapshot = await getDocs(collection(db, "tasks"));
    if (querySnapshot.empty) {
      container.innerHTML = `<div class="card"><p>Заданий пока нет.</p></div>`;
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const task = docSnap.data();
      const card = document.createElement("div");
      card.className = "card task-card";
      card.innerHTML = `
        <h4>${task.subject}</h4>
        <p>${task.description}</p>
        <small style="color:var(--text-muted)">Сдать до: ${task.dueDate}</small>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<div class="card"><p>Заданий пока нет.</p></div>`;
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

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  signOut(auth).then(() => window.location.href = "index.html");
});
