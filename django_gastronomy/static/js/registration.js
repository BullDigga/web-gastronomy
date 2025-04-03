document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registration-form');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const usernameEmoji = document.getElementById('username-emoji');
    const emailEmoji = document.getElementById('email-emoji');
    const passwordEmoji = document.getElementById('password-emoji');

    const usernameError = document.getElementById('username-error');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');

    // Валидация имени пользователя
    usernameInput.addEventListener('input', function () {
        const value = usernameInput.value.trim();
        if (value.length < 6) {
            usernameEmoji.textContent = '❌';
            usernameEmoji.classList.remove('valid');
            usernameEmoji.classList.add('invalid');
            usernameError.textContent = 'Псевдоним должен содержать минимум 6 символов.';
            usernameError.style.display = 'block';
        } else {
            usernameEmoji.textContent = '✅';
            usernameEmoji.classList.remove('invalid');
            usernameEmoji.classList.add('valid');
            usernameError.style.display = 'none';
        }
    });

    // Валидация email
    emailInput.addEventListener('input', function () {
        const value = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            emailEmoji.textContent = '❌';
            emailEmoji.classList.remove('valid');
            emailEmoji.classList.add('invalid');
            emailError.textContent = 'Email обязателен для заполнения.';
            emailError.style.display = 'block';
        } else if (!emailRegex.test(value)) {
            emailEmoji.textContent = '❌';
            emailEmoji.classList.remove('valid');
            emailEmoji.classList.add('invalid');
            emailError.textContent = 'Некорректный email.';
            emailError.style.display = 'block';
        } else {
            emailEmoji.textContent = '✅';
            emailEmoji.classList.remove('invalid');
            emailEmoji.classList.add('valid');
            emailError.style.display = 'none';
        }
    });

    // Валидация пароля
    passwordInput.addEventListener('input', function () {
        const value = passwordInput.value.trim();
        if (value.length < 6) {
            passwordEmoji.textContent = '❌';
            passwordEmoji.classList.remove('valid');
            passwordEmoji.classList.add('invalid');
            passwordError.textContent = 'Пароль должен содержать минимум 6 символов.';
            passwordError.style.display = 'block';
        } else {
            passwordEmoji.textContent = '✅';
            passwordEmoji.classList.remove('invalid');
            passwordEmoji.classList.add('valid');
            passwordError.style.display = 'none';
        }
    });

    // Отправка формы только при успешной валидации
    form.addEventListener('submit', function (event) {
        let isValid = true;

        // Проверка имени пользователя
        if (usernameInput.value.trim().length < 6) {
            isValid = false;
        }

        // Проверка email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
            isValid = false;
        }

        // Проверка пароля
        if (passwordInput.value.trim().length < 6) {
            isValid = false;
        }

        if (!isValid) {
            event.preventDefault(); // Предотвращаем отправку формы
        }
    });
});