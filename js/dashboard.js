import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Расписание по умолчанию
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

const roleTranslations = {
  teacher: "Учитель",
  student: "Ученик",
  parent: "Родитель"
};

let selectedDate = new Date();
let currentUserData = null;

// Инициализация при загрузке DOM
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

function initDashboard() {
  renderCalendar();
  renderScheduleForDate(selectedDate);
  initBottomNav();
  setupThemeToggle();
  setupLogout();
  setupFormListeners(); // Подключаем обработчики форм

  // Авторизация Firebase
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      let name = user.displayName || user.email || "Пользователь";
      let role = "student";

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          name = userData.name || userData.fullName || name;
          role = userData.role || role;
        }
      } catch (e) {
        console.error("Ошибка загрузки профиля:", e);
      }

      currentUserData = { id: user.uid, name, role };
      updateUserProfileUI();
      setupTeacherControls();

      // Загружаем оценки и домашние задания из базы
      loadGrades();
      loadTasks();
    } else {
      window.location.href = "index.html";
    }
  });

  // Кнопки переключения недели
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

// -------------------------------------------------------------
// 1. ПРОФИЛЬ И ШАПКА
// -------------------------------------------------------------
function updateUserProfileUI() {
  if (!currentUserData) return;

  const userNameEl = document.getElementById("userName");
  const userRoleEl = document.getElementById("userRole");
  const avatarEl = document.getElementById("userAvatar");

  if (userNameEl) userNameEl.innerText = currentUserData.name;
  if (userRoleEl) userRoleEl.innerText = roleTranslations[currentUserData.role] || currentUserData.role;

  if (avatarEl && currentUserData.name) {
    const initials = currentUserData.name
      .trim()
      .split(" ")
      .filter(part => part.length > 0)
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    avatarEl.innerText = initials || "ШК";
  }
}

// -------------------------------------------------------------
// 2. ВЫСТАВЛЕНИЕ ОЦЕНОК И ДОБАВЛЕНИЕ ДЗ (Формы)
// -------------------------------------------------------------
function setupFormListeners() {
  const addGradeForm = document.getElementById('addGradeForm');
  const addTaskForm = document.getElementById('addTaskForm');

  // Форма добавления оценки (для Учителя)
  if (addGradeForm) {
    addGradeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const studentSelect = document.getElementById('gradeStudentSelect');
      const studentId = studentSelect.value;
      const studentName = studentSelect.options[studentSelect.selectedIndex].text;
      const subject = document.getElementById('gradeSubjectSelect').value;
      const value = document.getElementById('gradeValueSelect').value;
      const reason = document.getElementById('gradeReasonInput').value;

      if (!studentId) {
        alert("Пожалуйста, выберите ученика!");
        return;
      }

      try {
        await addDoc(collection(db, "grades"), {
          studentId,
          studentName,
          subject,
          value,
          reason,
          teacherId: currentUserData.id,
          createdAt: serverTimestamp(),
          dateStr: new Date().toLocaleDateString('ru-RU')
        });

        alert("Отметка успешно выставлена!");
        addGradeForm.reset();
        loadGrades(); // Перезагружаем список оценок
      } catch (error) {
        console.error("Ошибка сохранения оценки:", error);
        alert("Не удалось сохранить оценку. Попробуйте еще раз.");
      }
    });
  }

  // Форма добавления домашнего задания (для Учителя)
  if (addTaskForm) {
    addTaskForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const subject = document.getElementById('taskSubjectSelect').value;
      const dueDate = document.getElementById('taskDueDate').value;
      const description = document.getElementById('taskDescInput').value;

      try {
        await addDoc(collection(db, "tasks"), {
          subject,
          dueDate,
          description,
          teacherId: currentUserData.id,
          createdAt: serverTimestamp()
        });

        alert("Домашнее задание опубликовано!");
        addTaskForm.reset();
        loadTasks(); // Перезагружаем список ДЗ
      } catch (error) {
        console.error("Ошибка публикации ДЗ:", error);
        alert("Не удалось опубликовать задание.");
      }
    });
  }
}

// -------------------------------------------------------------
// 3. ЗАГРУЗКА И ОТОБРАЖЕНИЕ ОЦЕНОК
// -------------------------------------------------------------
async function loadGrades() {
  const gradesListContainer = document.getElementById('gradesList');
  if (!gradesListContainer || !currentUserData) return;

  gradesListContainer.innerHTML = "<p>Загрузка отметок...</p>";

  try {
    let q;
    // Если текущий пользователь — ученик, подтягиваем только ЕГО оценки
    if (currentUserData.role === 'student') {
      q = query(
        collection(db, "grades"), 
        where("studentId", "==", currentUserData.id)
      );
    } else {
      // Учителю/Родителю показываем все выставленные оценки
      q = query(collection(db, "grades"), orderBy("createdAt", "desc"));
    }

    const querySnapshot = await getDocs(q);
    gradesListContainer.innerHTML = "";

    if (querySnapshot.empty) {
      gradesListContainer.innerHTML = "<p>Отметок пока нет.</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const grade = docSnap.data();
      const card = document.createElement("div");
      card.className = "card grade-card";
      card.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 14px;";

      // Форматируем дату выставления
      const dateText = grade.dateStr || "Недавно";

      card.innerHTML = `
        <div>
          <h4 style="margin: 0 0 4px 0;">${grade.subject}</h4>
          <p style="margin: 0; font-size: 0.85rem; opacity: 0.8;">${grade.reason}</p>
          ${currentUserData.role !== 'student' ? `<small style="opacity: 0.6;">Ученик: ${grade.studentName}</small>` : ''}
        </div>
        <div style="text-align: right;">
          <span class="badge-value" style="font-size: 1.4rem; font-weight: bold; background: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 8px;">${grade.value}</span>
          <div style="font-size: 0.75rem; margin-top: 4px; opacity: 0.6;">${dateText}</div>
        </div>
      `;

      gradesListContainer.appendChild(card);
    });

  } catch (error) {
    console.error("Ошибка загрузки отметок:", error);
    gradesListContainer.innerHTML = "<p>Ошибка загрузки отметок из базы.</p>";
  }
}

// -------------------------------------------------------------
// 4. ЗАГРУЗКА И ОТОБРАЖЕНИЕ ДОМАШНИХ ЗАДАНИЙ
// -------------------------------------------------------------
async function loadTasks() {
  const tasksListContainer = document.getElementById('tasksList');
  if (!tasksListContainer) return;

  tasksListContainer.innerHTML = "<p>Загрузка заданий...</p>";

  try {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    tasksListContainer.innerHTML = "";

    if (querySnapshot.empty) {
      tasksListContainer.innerHTML = "<p>Домашних заданий пока нет.</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const task = docSnap.data();
      const card = document.createElement("div");
      card.className = "card task-card";
      card.style.cssText = "margin-bottom: 12px; padding: 14px;";

      // Преобразуем красивую дату сдачи
      const formatDueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : 'Не указана';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="margin: 0;">${task.subject}</h4>
          <span style="font-size: 0.8rem; background: rgba(255,200,0,0.2); padding: 2px 8px; border-radius: 4px;">До: ${formatDueDate}</span>
        </div>
        <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">${task.description}</p>
      `;

      tasksListContainer.appendChild(card);
    });

  } catch (error) {
    console.error("Ошибка загрузки ДЗ:", error);
    tasksListContainer.innerHTML = "<p>Ошибка загрузки заданий из базы.</p>";
  }
}

// -------------------------------------------------------------
// 5. ДОПОЛНИТЕЛЬНЫЕ ЭЛЕМЕНТЫ И ИНТЕРФЕЙС
// -------------------------------------------------------------
function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }
  });
}

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

    try {
      const q = query(collection(db, "users"), where("role", "==", "student"));
      const querySnapshot = await getDocs(q);

      select.innerHTML = '<option value="" disabled selected>Выберите ученика</option>';

      if (querySnapshot.empty) {
        select.innerHTML += '<option value="" disabled>Ученики в базе не найдены</option>';
        return;
      }

      querySnapshot.forEach((docSnap) => {
        const student = docSnap.data();
        const option = document.createElement('option');
        option.value = docSnap.id;
        option.textContent = student.name || student.fullName || "Ученик";
        select.appendChild(option);
      });
    } catch (error) {
      console.error("Ошибка загрузки учеников из Firestore:", error);
      select.innerHTML = '<option value="" disabled selected>Ошибка загрузки списка</option>';
    }
  } else {
    teacherGradePanel?.classList.add('hidden');
    teacherTaskPanel?.classList.add('hidden');
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
