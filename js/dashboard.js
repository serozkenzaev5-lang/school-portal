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

// -------------------------------------------------------------
// СЛОВАРЬ ПЕРЕВОДОВ (i18n)
// -------------------------------------------------------------
const translations = {
  ru: {
    roleTeacher: "Учитель",
    roleStudent: "Ученик",
    roleParent: "Родитель",
    navSchedule: "Расписание",
    navGrades: "Отметки",
    navTasks: "Задания",
    titleSchedule: "Расписание",
    titleGrades: "Успеваемость и отметки",
    titleTasks: "Домашние задания",
    teacherGradeTitle: "Выставить оценку / отметку",
    teacherTaskTitle: "Добавить домашнее задание",
    btnToday: "Сегодня",
    btnSaveGrade: "Сохранить отметку",
    btnPublishTask: "Опубликовать ДЗ",
    phReason: "Причина (например: Контрольная работа)",
    phTaskDesc: "Описание задания...",
    vacationTitle: "🌴 Летние каникулы",
    vacationDesc: "Учебные занятия начнутся с 1 сентября 2026 года.",
    offDay: "Выходной день",
    loadingStudents: "Загрузка учеников...",
    selectStudent: "Выберите ученика",
    noStudents: "Ученики в базе не найдены",
    loadingGrades: "Загрузка отметок...",
    noGrades: "Отметок пока нет.",
    loadingTasks: "Загрузка заданий...",
    noTasks: "Домашних заданий пока нет.",
    dueTo: "До",
    dayNames: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    monthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
    subjects: {
      "Математика": "Математика",
      "Русский язык": "Русский язык",
      "Английский язык": "Английский язык",
      "Физика": "Физика",
      "Python": "Python",
      "История": "История",
      "Информатика": "Информатика",
      "Геометрия": "Геометрия",
      "Биология": "Биология",
      "География": "География",
      "Химия": "Химия",
      "Литература": "Литература",
      "Обществознание": "Обществознание",
      "Физкультура": "Физкультура",
      "Алгебра": "Алгебра",
      "ИЗО": "ИЗО"
    }
  },
  en: {
    roleTeacher: "Teacher",
    roleStudent: "Student",
    roleParent: "Parent",
    navSchedule: "Schedule",
    navGrades: "Grades",
    navTasks: "Tasks",
    titleSchedule: "Schedule",
    titleGrades: "Academic Performance & Marks",
    titleTasks: "Homework Tasks",
    teacherGradeTitle: "Assign Grade / Mark",
    teacherTaskTitle: "Add Homework",
    btnToday: "Today",
    btnSaveGrade: "Save Mark",
    btnPublishTask: "Publish Homework",
    phReason: "Reason (e.g. Test / Exam)",
    phTaskDesc: "Task description...",
    vacationTitle: "🌴 Summer Break",
    vacationDesc: "Classes will resume on September 1, 2026.",
    offDay: "Day Off",
    loadingStudents: "Loading students...",
    selectStudent: "Select a student",
    noStudents: "No students found in database",
    loadingGrades: "Loading marks...",
    noGrades: "No marks available yet.",
    loadingTasks: "Loading tasks...",
    noTasks: "No homework assigned yet.",
    dueTo: "Due",
    dayNames: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    subjects: {
      "Математика": "Mathematics",
      "Русский язык": "Russian Language",
      "Английский язык": "English",
      "Физика": "Physics",
      "Python": "Python",
      "История": "History",
      "Информатика": "Computer Science",
      "Геометрия": "Geometry",
      "Биология": "Biology",
      "География": "Geography",
      "Химия": "Chemistry",
      "Литература": "Literature",
      "Обществознание": "Social Studies",
      "Физкультура": "PE",
      "Алгебра": "Algebra",
      "ИЗО": "Art"
    }
  },
  uz: {
    roleTeacher: "O'qituvchi",
    roleStudent: "O'quvchi",
    roleParent: "Ota-ona",
    navSchedule: "Jadval",
    navGrades: "Boholar",
    navTasks: "Vazifalar",
    titleSchedule: "Dars jadvali",
    titleGrades: "O'zlashtirish va boholar",
    titleTasks: "Uy vazifalari",
    teacherGradeTitle: "Baho / belgi qo'yish",
    teacherTaskTitle: "Uy vazifasi qo'shish",
    btnToday: "Bugun",
    btnSaveGrade: "Bahoni saqlash",
    btnPublishTask: "Vazifani e'lon qilish",
    phReason: "Sababi (masalan: Nazorat ishi)",
    phTaskDesc: "Vazifa tavsifi...",
    vacationTitle: "🌴 Yozgi ta'til",
    vacationDesc: "Darslar 2026-yil 1-sentabrdan boshlanadi.",
    offDay: "Dam olish kuni",
    loadingStudents: "O'quvchilar yuklanmoqda...",
    selectStudent: "O'quvchini tanlang",
    noStudents: "Bazada o'quvchilar topilmadi",
    loadingGrades: "Boholar yuklanmoqda...",
    noGrades: "Hozircha boholar yo'q.",
    loadingTasks: "Vazifalar yuklanmoqda...",
    noTasks: "Hozircha uy vazifalari yo'q.",
    dueTo: "Muddati",
    dayNames: ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"],
    monthNames: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"],
    subjects: {
      "Математика": "Matematika",
      "Русский язык": "Rus tili",
      "Английский язык": "Ingliz tili",
      "Физика": "Fizika",
      "Python": "Python",
      "История": "Tarix",
      "Информатика": "Informatika",
      "Геометрия": "Geometriya",
      "Биология": "Biologiya",
      "География": "Geografiya",
      "Химия": "Kimyo",
      "Литература": "Adabiyot",
      "Обществознание": "Jamiyatshunoslik",
      "Физкультура": "Jismoniy tarbiya",
      "Алгебра": "Algebra",
      "ИЗО": "Tasviriy san'at"
    }
  }
};

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

let selectedDate = new Date();
let currentUserData = null;
let currentLang = localStorage.getItem("appLang") || "ru";

// Инициализация при загрузке DOM
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

function initDashboard() {
  setupLanguageSelect();
  applyLanguage();
  renderCalendar();
  renderScheduleForDate(selectedDate);
  initBottomNav();
  setupThemeToggle();
  setupLogout();
  setupFormListeners();

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

      loadGrades();
      loadTasks();
    } else {
      window.location.href = "index.html";
    }
  });

  // Управление календарем
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
// 1. СМЕНА И ПРИМЕНЕНИЕ ЯЗЫКА
// -------------------------------------------------------------
function setupLanguageSelect() {
  const langSelect = document.getElementById("langSelect");
  if (!langSelect) return;

  langSelect.value = currentLang;

  langSelect.addEventListener("change", (e) => {
    currentLang = e.target.value;
    localStorage.setItem("appLang", currentLang);
    
    // Перерисовываем элементы при смене языка
    applyLanguage();
    updateUserProfileUI();
    renderCalendar();
    renderScheduleForDate(selectedDate);
    setupTeacherControls();
    loadGrades();
    loadTasks();
  });
}

function applyLanguage() {
  const t = translations[currentLang] || translations.ru;

  // Кнопки и статичный текст
  const btnToday = document.getElementById("btnToday");
  if (btnToday) btnToday.innerText = t.btnToday;

  // Навигация снизу
  const navItems = document.querySelectorAll(".bottom-nav .nav-item small");
  if (navItems.length >= 3) {
    navItems[0].innerText = t.navSchedule;
    navItems[1].innerText = t.navGrades;
    navItems[2].innerText = t.navTasks;
  }

  // Заголовки разделов
  const gradesHeader = document.querySelector("#tab-grades h3");
  if (gradesHeader) gradesHeader.innerText = t.titleGrades;

  const tasksHeader = document.querySelector("#tab-tasks h3");
  if (tasksHeader) tasksHeader.innerText = t.titleTasks;

  const teacherGradeHeader = document.querySelector("#teacherGradePanel h4");
  if (teacherGradeHeader) teacherGradeHeader.innerText = t.teacherGradeTitle;

  const teacherTaskHeader = document.querySelector("#teacherTaskPanel h4");
  if (teacherTaskHeader) teacherTaskHeader.innerText = t.teacherTaskTitle;

  // Формы и поля ввода
  const reasonInput = document.getElementById("gradeReasonInput");
  if (reasonInput) reasonInput.placeholder = t.phReason;

  const taskDescInput = document.getElementById("taskDescInput");
  if (taskDescInput) taskDescInput.placeholder = t.phTaskDesc;

  const submitGradeBtn = document.querySelector("#addGradeForm button[type='submit']");
  if (submitGradeBtn) submitGradeBtn.innerText = t.btnSaveGrade;

  const submitTaskBtn = document.querySelector("#addTaskForm button[type='submit']");
  if (submitTaskBtn) submitTaskBtn.innerText = t.btnPublishTask;
}

// -------------------------------------------------------------
// 2. ПРОФИЛЬ
// -------------------------------------------------------------
function updateUserProfileUI() {
  if (!currentUserData) return;
  const t = translations[currentLang] || translations.ru;

  const userNameEl = document.getElementById("userName");
  const userRoleEl = document.getElementById("userRole");

  if (userNameEl) userNameEl.innerText = currentUserData.name;
  if (userRoleEl) {
    const roleKey = "role" + currentUserData.role.charAt(0).toUpperCase() + currentUserData.role.slice(1);
    userRoleEl.innerText = t[roleKey] || currentUserData.role;
  }
}

// -------------------------------------------------------------
// 3. ФОРМЫ (ОЦЕНКИ И ДЗ)
// -------------------------------------------------------------
function setupFormListeners() {
  const addGradeForm = document.getElementById('addGradeForm');
  const addTaskForm = document.getElementById('addTaskForm');

  if (addGradeForm) {
    addGradeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const studentSelect = document.getElementById('gradeStudentSelect');
      const studentId = studentSelect.value;
      const studentName = studentSelect.options[studentSelect.selectedIndex].text;
      const subject = document.getElementById('gradeSubjectSelect').value;
      const value = document.getElementById('gradeValueSelect').value;
      const reason = document.getElementById('gradeReasonInput').value;

      if (!studentId) return;

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

        addGradeForm.reset();
        loadGrades();
      } catch (error) {
        console.error("Ошибка сохранения оценки:", error);
      }
    });
  }

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

        addTaskForm.reset();
        loadTasks();
      } catch (error) {
        console.error("Ошибка публикации ДЗ:", error);
      }
    });
  }
}

// -------------------------------------------------------------
// 4. ОТОБРАЖЕНИЕ ОЦЕНОК
// -------------------------------------------------------------
async function loadGrades() {
  const gradesListContainer = document.getElementById('gradesList');
  if (!gradesListContainer || !currentUserData) return;

  const t = translations[currentLang] || translations.ru;
  gradesListContainer.innerHTML = `<p>${t.loadingGrades}</p>`;

  try {
    let q;
    if (currentUserData.role === 'student') {
      q = query(collection(db, "grades"), where("studentId", "==", currentUserData.id));
    } else {
      q = query(collection(db, "grades"), orderBy("createdAt", "desc"));
    }

    const querySnapshot = await getDocs(q);
    gradesListContainer.innerHTML = "";

    if (querySnapshot.empty) {
      gradesListContainer.innerHTML = `<p>${t.noGrades}</p>`;
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const grade = docSnap.data();
      const card = document.createElement("div");
      card.className = "card grade-card";
      card.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 14px;";

      const subjectTranslated = t.subjects[grade.subject] || grade.subject;

      card.innerHTML = `
        <div>
          <h4 style="margin: 0 0 4px 0;">${subjectTranslated}</h4>
          <p style="margin: 0; font-size: 0.85rem; opacity: 0.8;">${grade.reason}</p>
          ${currentUserData.role !== 'student' ? `<small style="opacity: 0.6;">${grade.studentName}</small>` : ''}
        </div>
        <div style="text-align: right;">
          <span class="badge-value" style="font-size: 1.4rem; font-weight: bold; background: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 8px;">${grade.value}</span>
        </div>
      `;

      gradesListContainer.appendChild(card);
    });

  } catch (error) {
    console.error("Ошибка загрузки отметок:", error);
  }
}

// -------------------------------------------------------------
// 5. ОТОБРАЖЕНИЕ ДОМАШНИХ ЗАДАНИЙ
// -------------------------------------------------------------
async function loadTasks() {
  const tasksListContainer = document.getElementById('tasksList');
  if (!tasksListContainer) return;

  const t = translations[currentLang] || translations.ru;
  tasksListContainer.innerHTML = `<p>${t.loadingTasks}</p>`;

  try {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    tasksListContainer.innerHTML = "";

    if (querySnapshot.empty) {
      tasksListContainer.innerHTML = `<p>${t.noTasks}</p>`;
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const task = docSnap.data();
      const card = document.createElement("div");
      card.className = "card task-card";
      card.style.cssText = "margin-bottom: 12px; padding: 14px;";

      const subjectTranslated = t.subjects[task.subject] || task.subject;
      const formatDueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString(currentLang === 'uz' ? 'uz-UZ' : currentLang === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'long' }) : '-';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="margin: 0;">${subjectTranslated}</h4>
          <span style="font-size: 0.8rem; background: rgba(255,200,0,0.2); padding: 2px 8px; border-radius: 4px;">${t.dueTo}: ${formatDueDate}</span>
        </div>
        <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">${task.description}</p>
      `;

      tasksListContainer.appendChild(card);
    });

  } catch (error) {
    console.error("Ошибка загрузки ДЗ:", error);
  }
}

// -------------------------------------------------------------
// 6. КАЛЕНДАРЬ И РАСПИСАНИЕ
// -------------------------------------------------------------
function renderCalendar() {
  const container = document.getElementById("calendarDays");
  const monthYearHeader = document.getElementById("currentMonthYear");
  if (!container) return;

  const t = translations[currentLang] || translations.ru;
  container.innerHTML = "";

  const startOfWeek = new Date(selectedDate);
  const dayIndex = startOfWeek.getDay();
  const diffToMon = startOfWeek.getDate() - dayIndex + (dayIndex === 0 ? -6 : 1);
  startOfWeek.setDate(diffToMon);

  if (monthYearHeader) {
    monthYearHeader.innerText = `${t.monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
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
      <span class="day-name">${t.dayNames[i]}</span>
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

  const t = translations[currentLang] || translations.ru;
  const dayOfWeek = date.getDay();
  const locale = currentLang === 'uz' ? 'uz-UZ' : currentLang === 'en' ? 'en-US' : 'ru-RU';
  
  if (dateTitle) dateTitle.innerText = `${t.titleSchedule}: ${date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const schoolStart = new Date(2026, 8, 1);
  scheduleContainer.innerHTML = "";

  if (date < schoolStart) {
    scheduleContainer.innerHTML = `
      <div class="card vacation-card">
        <h4>${t.vacationTitle}</h4>
        <p>${t.vacationDesc}</p>
      </div>`;
    return;
  }

  const lessons = defaultSchedule[dayOfWeek] || [t.offDay];

  lessons.forEach((lesson, index) => {
    const translatedLesson = t.subjects[lesson] || (lesson === "Выходной день" ? t.offDay : lesson);
    const card = document.createElement("div");
    card.className = "card lesson-card";
    card.innerHTML = `
      <div class="lesson-num">${index + 1}</div>
      <div class="lesson-info">
        <h4 class="lesson-title active-term-text">${translatedLesson}</h4>
      </div>
    `;
    scheduleContainer.appendChild(card);
  });
}

// -------------------------------------------------------------
// 7. ВСПОМОГАТЕЛЬНЫЕ ЭЛЕМЕНТЫ
// -------------------------------------------------------------
async function setupTeacherControls() {
  if (!currentUserData) return;
  const t = translations[currentLang] || translations.ru;

  const teacherGradePanel = document.getElementById('teacherGradePanel');
  const teacherTaskPanel = document.getElementById('teacherTaskPanel');

  if (currentUserData.role === 'teacher') {
    teacherGradePanel?.classList.remove('hidden');
    teacherTaskPanel?.classList.remove('hidden');

    const select = document.getElementById('gradeStudentSelect');
    if (!select) return;

    select.innerHTML = `<option value="" disabled selected>${t.loadingStudents}</option>`;

    try {
      const q = query(collection(db, "users"), where("role", "==", "student"));
      const querySnapshot = await getDocs(q);

      select.innerHTML = `<option value="" disabled selected>${t.selectStudent}</option>`;

      if (querySnapshot.empty) {
        select.innerHTML += `<option value="" disabled>${t.noStudents}</option>`;
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
      console.error("Ошибка загрузки учеников:", error);
    }
  } else {
    teacherGradePanel?.classList.add('hidden');
    teacherTaskPanel?.classList.add('hidden');
  }
}

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
