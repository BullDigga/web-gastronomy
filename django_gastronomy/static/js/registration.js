document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registration-form');
    if (!form) {
        console.error('Форма с id="registration-form" не найдена.');
        return;
    }

    // Получаем элементы формы
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const repeatPasswordInput = document.getElementById('repeat_password');
    const firstNameInput = document.getElementById('first_name');
    const lastNameInput = document.getElementById('last_name');
    const middleNameInput = document.getElementById('middle_name');
    const genderSelect = document.getElementById('gender');
    const dateOfBirthInput = document.getElementById('date_of_birth');
    const countryInput = document.getElementById('country');
    const avatarInput = document.getElementById('id_avatar');

    // Элементы для отображения эмодзи
    const usernameEmoji = document.getElementById('username-emoji');
    const emailEmoji = document.getElementById('email-emoji');
    const passwordEmoji = document.getElementById('password-emoji');
    const repeatPasswordEmoji = document.getElementById('repeat-password-emoji');
    const firstNameEmoji = document.getElementById('first_name-emoji');
    const lastNameEmoji = document.getElementById('last_name-emoji');
    const middleNameEmoji = document.getElementById('middle_name-emoji');

    // Элементы для отображения ошибок
    const usernameError = document.getElementById('username-error');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const repeatPasswordError = document.getElementById('repeat-password-error');
    const firstNameError = document.getElementById('first_name-error');
    const lastNameError = document.getElementById('last_name-error');
    const middleNameError = document.getElementById('middle_name-error');

    let isServerError = false;

    // Валидация псевдонима
    usernameInput.addEventListener('input', function () {
        if (isServerError) return;
        validateField(usernameInput, usernameEmoji, usernameError, 6, 'Псевдоним должен содержать минимум 6 символов.');
    });

    // Валидация email
    emailInput.addEventListener('input', function () {
        if (isServerError) return;
        const value = emailInput.value.trim();
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!isValid) {
            setError(emailEmoji, emailError, '❌', 'Введите корректный email.');
        } else {
            clearError(emailEmoji, emailError, '✅');
        }
    });

    // Валидация пароля
    passwordInput.addEventListener('input', function () {
        if (isServerError) return;
        validateField(passwordInput, passwordEmoji, passwordError, 6, 'Пароль должен содержать минимум 6 символов.');
    });

    // Валидация повторного пароля
    repeatPasswordInput.addEventListener('input', function () {
        if (isServerError) return;
        const passwordValue = passwordInput.value.trim();
        const repeatPasswordValue = repeatPasswordInput.value.trim();
        if (repeatPasswordValue !== passwordValue) {
            setError(repeatPasswordEmoji, repeatPasswordError, '❌', 'Пароли не совпадают.');
        } else {
            clearError(repeatPasswordEmoji, repeatPasswordError, '✅');
        }
    });

    // Валидация имени (необязательное поле)
    firstNameInput.addEventListener('input', function () {
        if (isServerError) return;
        validateOptionalField(firstNameInput, firstNameEmoji, firstNameError, 2, 'Имя должно содержать минимум 2 символа.');
    });

    // Валидация фамилии (необязательное поле)
    lastNameInput.addEventListener('input', function () {
        if (isServerError) return;
        validateOptionalField(lastNameInput, lastNameEmoji, lastNameError, 2, 'Фамилия должна содержать минимум 2 символа.');
    });

    // Валидация отчества (необязательное поле)
    middleNameInput.addEventListener('input', function () {
        if (isServerError) return;
        validateOptionalField(middleNameInput, middleNameEmoji, middleNameError, 2, 'Отчество должно содержать минимум 2 символа.');
    });

    const avatarPreview = document.getElementById('avatar-preview');
    const avatarPlaceholder = document.getElementById('avatar-placeholder');
    const photoUpload = document.querySelector('.photo-upload');

    if (avatarInput && photoUpload) {
        // Делаем весь блок .photo-upload кликабельным
        photoUpload.addEventListener('click', function () {
            avatarInput.click(); // Триггерим клик на скрытом input[type="file"]
        });

        // Обработка выбора файла
        avatarInput.addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (file) {
                // Проверяем размер файла (не более 10 МБ)
                if (file.size > 10 * 1024 * 1024) {
                    alert('Размер файла аватара не должен превышать 10 МБ.');
                    avatarInput.value = ''; // Очищаем поле выбора файла
                    return;
                }

                // Создаем URL для предварительного просмотра изображения
                const reader = new FileReader();
                reader.onload = function (e) {
                    avatarPreview.src = e.target.result; // Устанавливаем источник изображения
                    avatarPreview.style.display = 'block'; // Показываем изображение
                    avatarPlaceholder.style.display = 'none'; // Скрываем placeholder
                    photoUpload.classList.add('has-image'); // Убираем пунктирную границу
                };
                reader.readAsDataURL(file); // Читаем файл как Data URL
            } else {
                // Если файл не выбран, возвращаем placeholder
                avatarPreview.style.display = 'none';
                avatarPlaceholder.style.display = 'block';
                photoUpload.classList.remove('has-image'); // Возвращаем пунктирную границу
            }
        });
    }

    // Отправка формы через AJAX
    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Проверяем совпадение паролей перед отправкой
        validateRepeatPassword();
        if (repeatPasswordError.style.display === 'block') {
            alert('Пожалуйста, исправьте ошибки в форме.');
            return;
        }

        // Собираем данные из формы
        const formData = new FormData();
        formData.append('username', usernameInput.value.trim());
        formData.append('email', emailInput.value.trim());
        formData.append('password', passwordInput.value.trim());

        // Добавляем необязательные поля, только если они заполнены
        if (firstNameInput.value.trim()) formData.append('first_name', firstNameInput.value.trim());
        if (lastNameInput.value.trim()) formData.append('last_name', lastNameInput.value.trim());
        if (middleNameInput.value.trim()) formData.append('middle_name', middleNameInput.value.trim());
        if (genderSelect.value) formData.append('gender', genderSelect.value);
        if (dateOfBirthInput.value) formData.append('date_of_birth', dateOfBirthInput.value);
        if (countryInput.value.trim()) formData.append('country', countryInput.value.trim());
        const aboutInput = document.getElementById('about');
        if (aboutInput && aboutInput.value.trim()) {
            formData.append('about', aboutInput.value.trim());
        }

        // Добавляем аватар, если он выбран
        if (avatarInput && avatarInput.files.length > 0) {
            formData.append('avatar', avatarInput.files[0]);
        }

        // Логируем отправляемые данные
        console.log('Отправляемые данные:', Object.fromEntries(formData.entries()));

        try {
            // Отправляем данные на сервер через AJAX
            const response = await fetch('/register/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Произошла ошибка при обработке запроса.');
            }

            const data = await response.json();
            if (data.success) {
                // Перенаправляем пользователя на страницу профиля
                console.log('Redirect URL from server:', data.redirect_url);
                window.location.href = data.redirect_url;
            }
        } catch (error) {
            isServerError = true;
            console.error('Ошибка:', error.message);

            // Убираем лишние пробелы и приводим текст к нижнему регистру
            const errorMessage = error.message.trim().toLowerCase();

            // Логируем обработанную ошибку для отладки
            console.log('Обработанная ошибка:', errorMessage);

            // Проверяем текст ошибки
            if (errorMessage.includes('уже используется')) {
                setError(usernameEmoji, usernameError, '❌', 'Этот псевдоним уже занят.');
            } else if (errorMessage.includes('email')) {
                setError(emailEmoji, emailError, '❌', 'Некорректный email.');
            } else {
                alert(error.message); // Общая ошибка
            }
            isServerError = false;
        }
    });

    // Вспомогательная функция для валидации обязательных полей
    function validateField(input, emojiElement, errorElement, minLength, errorMessage) {
        const value = input.value.trim();
        if (value.length < minLength) {
            setError(emojiElement, errorElement, '❌', errorMessage);
        } else {
            clearError(emojiElement, errorElement, '✅');
        }
    }

    // Вспомогательная функция для валидации необязательных полей
    function validateOptionalField(input, emojiElement, errorElement, minLength = 0, errorMessage = '') {
        const value = input.value.trim();
        if (value && value.length < minLength) {
            setError(emojiElement, errorElement, '❌', errorMessage);
        } else if (value) {
            clearError(emojiElement, errorElement, '✅');
        } else {
            clearError(emojiElement, errorElement);
        }
    }

    // Вспомогательная функция для проверки совпадения паролей
    function validateRepeatPassword() {
        const passwordValue = passwordInput.value.trim();
        const repeatPasswordValue = repeatPasswordInput.value.trim();
        if (repeatPasswordValue !== passwordValue) {
            setError(repeatPasswordEmoji, repeatPasswordError, '❌', 'Пароли не совпадают.');
        } else {
            clearError(repeatPasswordEmoji, repeatPasswordError, '✅');
        }
    }

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

});