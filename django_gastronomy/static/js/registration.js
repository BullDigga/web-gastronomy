document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registration-form');
    if (!form) {
        console.error('Форма с id="registration-form" не найдена.');
        return;
    }

    // Получаем все элементы формы
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const repeatPasswordInput = document.getElementById('repeat_password'); // Поле подтверждения пароля
    const firstNameInput = document.getElementById('first_name');
    const lastNameInput = document.getElementById('last_name');
    const middleNameInput = document.getElementById('middle_name');
    const genderSelect = document.getElementById('gender'); // Пол
    const dateOfBirthInput = document.getElementById('date_of_birth'); // Дата рождения
    const countryInput = document.getElementById('country'); // Страна

    // Элементы для отображения эмодзи
    const usernameEmoji = document.getElementById('username-emoji');
    const emailEmoji = document.getElementById('email-emoji');
    const passwordEmoji = document.getElementById('password-emoji');
    const repeatPasswordEmoji = document.getElementById('repeat-password-emoji'); // Эмодзи для подтверждения пароля
    const firstNameEmoji = document.getElementById('first_name-emoji');
    const lastNameEmoji = document.getElementById('last_name-emoji');
    const middleNameEmoji = document.getElementById('middle_name-emoji');

    // Элементы для отображения ошибок
    const usernameError = document.getElementById('username-error');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const repeatPasswordError = document.getElementById('repeat-password-error'); // Ошибки для подтверждения пароля
    const firstNameError = document.getElementById('first_name-error');
    const lastNameError = document.getElementById('last_name-error');
    const middleNameError = document.getElementById('middle_name-error');

    let isServerError = false;

    // Валидация имени пользователя
    usernameInput.addEventListener('input', function () {
        if (isServerError) return;
        const value = usernameInput.value.trim();
        if (value.length < 6) {
            setError(usernameEmoji, usernameError, '❌', 'Псевдоним должен содержать минимум 6 символов.');
        } else {
            clearError(usernameEmoji, usernameError, '✅');
        }
    });

    // Валидация email
    emailInput.addEventListener('input', function () {
        if (isServerError) return;
        const value = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Регулярное выражение для email
        const cyrillicRegex = /[а-яА-ЯЁё]/; // Регулярное выражение для кириллицы
        if (!value) {
            setError(emailEmoji, emailError, '❌', 'Email обязателен для заполнения.');
        } else if (cyrillicRegex.test(value)) {
            setError(emailEmoji, emailError, '❌', 'Некорректный email.');
        } else if (!emailRegex.test(value)) {
            setError(emailEmoji, emailError, '❌', 'Некорректный email.');
        } else {
            clearError(emailEmoji, emailError, '✅');
        }
    });

    // Валидация пароля
    passwordInput.addEventListener('input', function () {
        if (isServerError) return;
        const value = passwordInput.value.trim();
        if (value.length < 6) {
            setError(passwordEmoji, passwordError, '❌', 'Пароль должен содержать минимум 6 символов.');
        } else {
            clearError(passwordEmoji, passwordError, '✅');
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
            setError(repeatPasswordEmoji, repeatPasswordError, '❌', 'Пароли не совпадают.');
        } else if (repeatPasswordValue && repeatPasswordValue === passwordValue) {
            clearError(repeatPasswordEmoji, repeatPasswordError, '✅');
        } else {
            clearError(repeatPasswordEmoji, repeatPasswordError);
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
            clearError(firstNameEmoji, firstNameError, '✅');
        } else {
            clearError(firstNameEmoji, firstNameError);
        }
    });

    // Валидация фамилии (необязательное поле)
    lastNameInput.addEventListener('input', function () {
        if (isServerError) return;
        const value = lastNameInput.value.trim();
        if (value) {
            clearError(lastNameEmoji, lastNameError, '✅');
        } else {
            clearError(lastNameEmoji, lastNameError);
        }
    });

    // Валидация отчества (необязательное поле)
    middleNameInput.addEventListener('input', function () {
        if (isServerError) return;
        const value = middleNameInput.value.trim();
        if (value) {
            clearError(middleNameEmoji, middleNameError, '✅');
        } else {
            clearError(middleNameEmoji, middleNameError);
        }
    });

    // Отправка формы через AJAX
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const usernameValue = usernameInput.value.trim();
        const emailValue = emailInput.value.trim();
        const passwordValue = passwordInput.value.trim();
        const repeatPasswordValue = repeatPasswordInput.value.trim();
        const firstNameValue = firstNameInput.value.trim();
        const lastNameValue = lastNameInput.value.trim();
        const middleNameValue = middleNameInput.value.trim();
        const genderValue = genderSelect.value; // Значение поля "Пол"
        const dateOfBirthValue = dateOfBirthInput.value; // Значение поля "Дата рождения"
        const countryValue = countryInput.value.trim(); // Значение поля "Страна"

        // Проверяем совпадение паролей перед отправкой
        validateRepeatPassword();
        if (repeatPasswordError.style.display === 'block') {
            alert('Пожалуйста, исправьте ошибки в форме.');
            return;
        }

        // Логируем отправляемые данные
        console.log('Отправляемые данные:', {
            username: usernameValue,
            email: emailValue,
            password: passwordValue,
            first_name: firstNameValue || null,
            last_name: lastNameValue || null,
            middle_name: middleNameValue || null,
            gender: genderValue || null,
            date_of_birth: dateOfBirthValue || null,
            country: countryValue || null
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
                middle_name: middleNameValue || null,
                gender: genderValue || null,
                date_of_birth: dateOfBirthValue || null,
                country: countryValue || null
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
                setError(emailEmoji, emailError, '❌', 'Данный email уже зарегистрирован.');
            } else if (errorMessage.includes('email')) {
                setError(emailEmoji, emailError, '❌', 'Некорректный email.');
            } else if (errorMessage.includes('пароль')) {
                setError(passwordEmoji, passwordError, '❌', error.message);
            } else {
                alert(error.message); // Общая ошибка
            }
            isServerError = false;
        });
    });

    // Вспомогательная функция для установки ошибки
    function setError(emojiElement, errorElement, emoji, message = '') {
        emojiElement.textContent = emoji;
        emojiElement.classList.remove('valid');
        emojiElement.classList.add('invalid');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    // Вспомогательная функция для очистки ошибки
    function clearError(emojiElement, errorElement, emoji = '') {
        emojiElement.textContent = emoji;
        emojiElement.classList.remove('invalid');
        if (emoji) {
            emojiElement.classList.add('valid');
        }
        errorElement.style.display = 'none';
    }

    // Функция для очистки всех ошибок
    function clearAllErrors() {
        clearError(usernameEmoji, usernameError);
        clearError(emailEmoji, emailError);
        clearError(passwordEmoji, passwordError);
        clearError(repeatPasswordEmoji, repeatPasswordError);
        clearError(firstNameEmoji, firstNameError);
        clearError(lastNameEmoji, lastNameError);
        clearError(middleNameEmoji, middleNameError);
    }
});