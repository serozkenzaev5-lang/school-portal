import { loginUser, registerUser } from './auth.js';

// Ждем полной загрузки HTML-дерева
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Находим элементы формы входа и регистрации
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');

    // 2. Переключение между окнами Входа и Регистрации
    if (showRegisterBtn && showLoginBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        });

        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });
    }

    // 3. Обработка отправки формы ВХОДА
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Предотвращаем перезагрузку страницы
            
            const email = loginForm.querySelector('#loginEmail').value;
            const password = loginForm.querySelector('#loginPassword').value;

            // Вызываем функцию из auth.js
            await loginUser(email, password);
        });
    }

    // 4. Обработка отправки формы РЕГИСТРАЦИИ
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = registerForm.querySelector('#regName').value;
            const email = registerForm.querySelector('#regEmail').value;
            const password = registerForm.querySelector('#regPassword').value;
            const role = registerForm.querySelector('#regRole').value;

            // Вызываем функцию из auth.js
            await registerUser(email, password, role, name);
        });
    }
});