document.addEventListener('DOMContentLoaded', () => {
    // Получаем блоки и кнопки
    const loginBlock = document.getElementById('loginBlock');
    const registerBlock = document.getElementById('registerBlock');
    
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotLink = document.querySelector('.forgot-link');

    // 1. Переключение на форму РЕГИСТРАЦИИ
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Отменяем стандартный переход по ссылке
            loginBlock.classList.add('hidden');
            registerBlock.classList.remove('hidden');
        });
    }

    // 2. Переключение на форму ВХОДА
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerBlock.classList.add('hidden');
            loginBlock.classList.remove('hidden');
        });
    }

    // 3. Кнопка «Забыли пароль?»
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            if (email) {
                alert(`Инструкция по сбросу пароля отправлена на почту: ${email}`);
            } else {
                alert('Пожалуйста, сначала введите ваш Email в поле выше.');
            }
        });
    }

    // 4. Нажатие на кнопку «Войти»
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Чтобы страница не перезагружалась
            const email = document.getElementById('loginEmail').value;
            alert(`Успешный вход! Добро пожаловать, ${email}`);
            // Здесь в дальнейшем будет редирект на главный дашборд
        });
    }

    // 5. Нажатие на кнопку «Зарегистрироваться»
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Регистрация прошла успешно! Теперь вы можете войти.');
            
            // Переключаем обратно на вход
            registerBlock.classList.add('hidden');
            loginBlock.classList.remove('hidden');
        });
    }
});
