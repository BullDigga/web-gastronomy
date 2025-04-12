document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registration-form');
    if (!form) {
        console.error('Форма с id="registration-form" не найдена.');
        return;
    }

    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const repeatPasswordInput = document.getElementById('repeat_password'); // Новое поле
    const firstNameInput = document.getElementById('first_name');
    const lastNameInput = document.getElementById('last_name');
    const middleNameInput = document.getElementById('middle_name');

    const usernameEmoji = document.getElementById('username-emoji');
    const emailEmoji = document.getElementById('email-emoji');
    const passwordEmoji = document.getElementById('password-emoji');
    const repeatPasswordEmoji = document.getElementById('repeat-password-emoji'); // Новый эмодзи
    const firstNameEmoji = document.getElementById('first_name-emoji');
    const lastNameEmoji = document.getElementById('last_name-emoji');
    const middleNameEmoji = document.getElementById('middle_name-emoji');

    const usernameError = document.getElementById('username-error');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const repeatPasswordError = document.getElementById('repeat-password-error'); // Новое сообщение об ошибке
    const firstNameError = document.getElementById('first_name-error');
    const lastNameError = document.getElementById('last_name-error');
    const middleNameError = document.getElementById('middle_name-error');

    let isServerError = false;

    // Валидация имени пользователя
    usernameInput.addEventListener('input', function () {
        if (isServerError) return;

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
        if (isServerError) return;

        const value = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Регулярное выражение для email
        const cyrillicRegex = /[а-яА-ЯЁё]/; // Регулярное выражение для кириллицы
        if (!value) {
            emailEmoji.textContent = '❌';
            emailError.textContent = 'Email обязателен для заполнения.';
            emailError.style.display = 'block';
        } else if (cyrillicRegex.test(value)) {
            emailEmoji.textContent = '❌';
            emailError.textContent = 'Некорректный email.'; // Ошибка при наличии русских символов
            emailError.style.display = 'block';
        } else if (!emailRegex.test(value)) {
            emailEmoji.textContent = '❌';
            emailError.textContent = 'Некорректный email.'; // Ошибка формата email
            emailError.style.display = 'block';
        } else {
            emailEmoji.textContent = '✅';
            emailError.style.display = 'none';
        }
    });

    // Валидация пароля
    passwordInput.addEventListener('input', function () {
        if (isServerError) return;

        const value = passwordInput.value.trim();
        if (value.length < 6) {
            passwordEmoji.textContent = '❌';
            passwordError.textContent = 'Пароль должен содержать минимум 6 символов.';
            passwordError.style.display = 'block';
        } else {
            passwordEmoji.textContent = '✅';
            passwordError.style.display = 'none';
        }

        // Проверяем совпадение паролей
        validateRepeatPassword();
    });

    // Валидация повторения пароля
    repeatPasswordInput.addEventListener('input', function () {
        validateRepeatPassword();
    });

    // Функция для проверки совпадения паролей
    function validateRepeatPassword() {
        const passwordValue = passwordInput.value.trim();
        const repeatPasswordValue = repeatPasswordInput.value.trim();

        if (repeatPasswordValue && repeatPasswordValue !== passwordValue) {
            repeatPasswordEmoji.textContent = '❌';
            repeatPasswordEmoji.classList.remove('valid');
            repeatPasswordEmoji.classList.add('invalid');
            repeatPasswordError.textContent = 'Пароли не совпадают.';
            repeatPasswordError.style.display = 'block';
        } else if (repeatPasswordValue && repeatPasswordValue === passwordValue) {
            repeatPasswordEmoji.textContent = '✅';
            repeatPasswordEmoji.classList.remove('invalid');
            repeatPasswordEmoji.classList.add('valid');
            repeatPasswordError.style.display = 'none';
        } else {
            repeatPasswordEmoji.textContent = '';
            repeatPasswordError.style.display = 'none';
        }
    }

    // Переключение видимости дополнительных полей
    const toggleOptionalFields = document.getElementById('toggle-optional-fields');
    const optionalFields = document.getElementById('optional-fields');
    if (toggleOptionalFields && optionalFields) {
        toggleOptionalFields.addEventListener('click', function (event) {
            event.preventDefault(); // Предотвращаем переход по ссылке
            const computedStyle = window.getComputedStyle(optionalFields);
            if (computedStyle.display === 'none') {
                optionalFields.style.display = 'flex'; // Показываем блок
                toggleOptionalFields.textContent = 'Скрыть дополнительные данные';
            } else {
                optionalFields.style.display = 'none'; // Скрываем блок
                toggleOptionalFields.textContent = 'Дополнительные данные (опционально)';
            }
        });
    } else {
        console.error('Элементы toggle-optional-fields или optional-fields не найдены.');
    }

    // Валидация имени (необязательное поле)
    firstNameInput.addEventListener('input', function () {
        if (isServerError) return;

        const value = firstNameInput.value.trim();
        if (value) {
            firstNameEmoji.textContent = '✅';
            firstNameEmoji.classList.remove('invalid');
            firstNameEmoji.classList.add('valid');
            firstNameError.style.display = 'none';
        } else {
            firstNameEmoji.textContent = '';
            firstNameError.style.display = 'none';
        }
    });

    // Валидация фамилии (необязательное поле)
    lastNameInput.addEventListener('input', function () {
        if (isServerError) return;

        const value = lastNameInput.value.trim();
        if (value) {
            lastNameEmoji.textContent = '✅';
            lastNameEmoji.classList.remove('invalid');
            lastNameEmoji.classList.add('valid');
            lastNameError.style.display = 'none';
        } else {
            lastNameEmoji.textContent = '';
            lastNameError.style.display = 'none';
        }
    });

    // Валидация отчества (необязательное поле)
    middleNameInput.addEventListener('input', function () {
        if (isServerError) return;

        const value = middleNameInput.value.trim();
        if (value) {
            middleNameEmoji.textContent = '✅';
            middleNameEmoji.classList.remove('invalid');
            middleNameEmoji.classList.add('valid');
            middleNameError.style.display = 'none';
        } else {
            middleNameEmoji.textContent = '';
            middleNameError.style.display = 'none';
        }
    });

    // Отправка формы через AJAX
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const usernameValue = usernameInput.value.trim();
        const emailValue = emailInput.value.trim();
        const passwordValue = passwordInput.value.trim();
        const repeatPasswordValue = repeatPasswordInput.value.trim(); // Новое значение
        const firstNameValue = firstNameInput.value.trim();
        const lastNameValue = lastNameInput.value.trim();
        const middleNameValue = middleNameInput.value.trim();

        // Проверяем совпадение паролей перед отправкой
        validateRepeatPassword();
        if (repeatPasswordError.style.display === 'block') {
            alert('Пожалуйста, исправьте ошибки в форме.');
            return;
        }

        console.log('Отправляемый JSON:', JSON.stringify({
            username: usernameValue,
            email: emailValue,
            password: passwordValue,
            first_name: firstNameValue || null,
            last_name: lastNameValue || null,
            middle_name: middleNameValue || null
        }));

        // Очищаем предыдущие ошибки
        usernameError.style.display = 'none';
        emailError.style.display = 'none';
        passwordError.style.display = 'none';
        repeatPasswordError.style.display = 'none'; // Очистка ошибок для нового поля
        firstNameError.style.display = 'none';
        lastNameError.style.display = 'none';
        middleNameError.style.display = 'none';

        // Логируем отправляемые данные
        console.log('Отправляемые данные:', {
            username: usernameValue,
            email: emailValue,
            password: passwordValue,
            first_name: firstNameValue || null,
            last_name: lastNameValue || null,
            middle_name: middleNameValue || null
        });

        // Отправляем данные на сервер
        fetch('/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                username: usernameValue,
                email: emailValue,
                password: passwordValue,
                first_name: firstNameValue || null,
                last_name: lastNameValue || null,
                middle_name: middleNameValue || null
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Произошла ошибка при обработке запроса.');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Перенаправляем пользователя на страницу профиля
                console.log('Redirect URL from server:', data.redirect_url);
                window.location.href = data.redirect_url;
            }
        })
        .catch(error => {
            isServerError = true;
            console.error('Ошибка:', error.message);

            // Убираем лишние пробелы и приводим текст к нижнему регистру
            const errorMessage = error.message.trim().toLowerCase();

            // Логируем обработанную ошибку для отладки
            console.log('Обработанная ошибка:', errorMessage);

            // Проверяем текст ошибки
            if (errorMessage.includes('уже зарегистрирован')) {
                emailError.textContent = 'Данный email уже зарегистрирован.';
                emailError.style.display = 'block';
            } else if (errorMessage.includes('email')) {
                emailError.textContent = 'Некорректный email.';
                emailError.style.display = 'block';
            } else if (errorMessage.includes('пароль')) {
                passwordError.textContent = error.message;
                passwordError.style.display = 'block';
            } else {
                alert(error.message); // Общая ошибка
            }
            isServerError = false;
        });
    });
});