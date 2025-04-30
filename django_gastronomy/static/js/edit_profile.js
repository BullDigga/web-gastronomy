document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('edit-profile-form');
    if (!form) {
        console.error('Форма с id="edit-profile-form" не найдена.');
        return;
    }

    // Получаем элементы формы
    const usernameInput = document.getElementById('id_username');
    const firstNameInput = document.getElementById('id_first_name');
    const lastNameInput = document.getElementById('id_last_name');
    const middleNameInput = document.getElementById('id_middle_name');
    const genderSelect = document.getElementById('id_gender');
    const dateOfBirthInput = document.getElementById('id_date_of_birth');
    const countryInput = document.getElementById('id_country');

    // Элементы для отображения эмодзи
    const usernameEmoji = document.getElementById('username-emoji');
    const firstNameEmoji = document.getElementById('first_name-emoji');
    const lastNameEmoji = document.getElementById('last_name-emoji');
    const middleNameEmoji = document.getElementById('middle_name-emoji');
    const genderEmoji = document.getElementById('gender-emoji');
    const dateOfBirthEmoji = document.getElementById('date_of_birth-emoji');
    const countryEmoji = document.getElementById('country-emoji');

    // Элементы для отображения ошибок
    const usernameError = document.getElementById('username-error');
    const firstNameError = document.getElementById('first_name-error');
    const lastNameError = document.getElementById('last_name-error');
    const middleNameError = document.getElementById('middle_name-error');
    const genderError = document.getElementById('gender-error');
    const dateOfBirthError = document.getElementById('date_of_birth-error');
    const countryError = document.getElementById('country-error');

    // Элементы для аватара
    const avatarInput = document.getElementById('id_avatar'); // Поле загрузки аватара
    const avatarPreview = document.getElementById('avatar-preview'); // Миниатюра аватара
    const avatarPlaceholder = document.getElementById('avatar-placeholder'); // Placeholder
    const avatarLabel = document.querySelector('label[for="id_avatar"]'); // Label для аватара

    let isServerError = false;

    // Валидация имени пользователя
    usernameInput.addEventListener('input', function () {
        if (isServerError) return;
        validateField(usernameInput, usernameEmoji, usernameError, 6, 'Псевдоним должен содержать минимум 6 символов.');
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

    // Валидация пола (необязательное поле)
    genderSelect.addEventListener('change', function () {
        if (isServerError) return;
        validateOptionalSelect(genderSelect, genderEmoji, genderError);
    });

    // Валидация даты рождения (необязательное поле)
    dateOfBirthInput.addEventListener('input', function () {
        if (isServerError) return;
        validateOptionalField(dateOfBirthInput, dateOfBirthEmoji, dateOfBirthError);
    });

    // Валидация страны проживания (необязательное поле)
    countryInput.addEventListener('input', function () {
        if (isServerError) return;
        validateOptionalField(countryInput, countryEmoji, countryError, 2, 'Страна должна содержать минимум 2 символа.');
    });

    // Обработка загрузки аватара
    if (avatarInput) {
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
                    avatarLabel.classList.add('has-image'); // Добавляем класс для убирания границы
                };
                reader.readAsDataURL(file); // Читаем файл как Data URL
            } else {
                // Если файл не выбран, возвращаем placeholder
                avatarPreview.style.display = 'none';
                avatarPlaceholder.style.display = 'block';
                avatarLabel.classList.remove('has-image'); // Удаляем класс для возврата границы
            }
        });
    }

    // Отправка формы через AJAX
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        // Собираем данные из формы
        const formData = new FormData(); // Используем FormData для отправки файлов
        formData.append('username', usernameInput.value.trim());
        formData.append('first_name', firstNameInput.value.trim() || "");
        formData.append('last_name', lastNameInput.value.trim() || "");
        formData.append('middle_name', middleNameInput.value.trim() || "");
        formData.append('gender', genderSelect.value || "");
        formData.append('date_of_birth', dateOfBirthInput.value || "");
        formData.append('country', countryInput.value.trim() || "");

        // Добавляем аватар, если он выбран
        if (avatarInput && avatarInput.files.length > 0) {
            formData.append('avatar', avatarInput.files[0]);
            console.log("formData:", avatarInput.files[0]);
        }

        // Логируем отправляемые данные
        console.log('Отправляемые данные:', formData);

        // Очищаем предыдущие ошибки
        clearAllErrors();

        // Отправляем данные на сервер
        fetch('/profile/edit/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData // Отправляем FormData
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
                console.log('Redirect URL from server:', data.redirect_url);
                window.location.href = data.redirect_url;
            }
        })
        .catch(error => {
            isServerError = true;
            console.error('Ошибка:', error.message);

            const errorMessage = error.message.trim().toLowerCase();
            console.log('Обработанная ошибка:', errorMessage);

            if (errorMessage.includes('уже используется')) {
                setError(usernameEmoji, usernameError, '❌', 'Этот псевдоним уже занят.');
            } else if (errorMessage.includes('псевдоним')) {
                setError(usernameEmoji, usernameError, '❌', error.message);
            } else {
                alert(error.message); // Общая ошибка
            }
            isServerError = false;
        });
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

    // Вспомогательная функция для валидации необязательных select
    function validateOptionalSelect(select, emojiElement, errorElement) {
        const value = select.value;
        if (value) {
            clearError(emojiElement, errorElement, '✅');
        } else {
            clearError(emojiElement, errorElement);
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
        clearError(firstNameEmoji, firstNameError);
        clearError(lastNameEmoji, lastNameError);
        clearError(middleNameEmoji, middleNameError);
        clearError(genderEmoji, genderError);
        clearError(dateOfBirthEmoji, dateOfBirthError);
        clearError(countryEmoji, countryError);
    }
});