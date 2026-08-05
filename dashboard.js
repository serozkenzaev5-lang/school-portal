import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Проверка авторизации при загрузке страницы
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      renderDashboard(userData);
    }
  } else {
    // Если пользователь не вошел, отправляем на страницу входа
    window.location.href = "index.html";
  }
});

// Отрисовка интерфейса в зависимости от роли
function renderDashboard(userData) {
  document.getElementById("userInfo").innerText = `${userData.name} (${getRoleName(userData.role)})`;

  const contentArea = document.getElementById("dashboardContent");

  if (userData.role === "teacher") {
    contentArea.innerHTML = `
      <h3>Панель учителя</h3>
      <div class="card">
        <h4>Выставить оценку / Выдать ДЗ</h4>
        <form id="gradeForm">
          <input type="text" id="studentEmail" placeholder="Email ученика" required>
          <input type="text" id="subject" placeholder="Предмет" required>
          <input type="number" id="grade" placeholder="Оценка (1-5)" min="1" max="5" required>
          <button type="submit">Сохранить</button>
        </form>
      </div>
    `;
    initTeacherEvents();
  } else if (userData.role === "student" || userData.role === "parent") {
    contentArea.innerHTML = `
      <h3>Дневник успеваемости</h3>
      <div id="gradesList" class="card">Загрузка оценок...</div>
    `;
    loadStudentGrades(userData.email);
  }
}

// Перевод названия роли
function getRoleName(role) {
  const roles = { teacher: "Учитель", student: "Ученик", parent: "Родитель" };
  return roles[role] || role;
}

// Добавление оценки учителем в Firestore
function initTeacherEvents() {
  const form = document.getElementById("gradeForm");
  form.addEventListener("submit", async (e) => {
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

// Выход из аккаунта
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});