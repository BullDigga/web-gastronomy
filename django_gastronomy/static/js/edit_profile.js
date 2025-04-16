document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('edit-profile-form');
    if (!form) {
        console.error('Форма с id="edit-profile-form" не найдена.');
        return;
    }

    // Получаем все элементы формы
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

    // Валидация имени (необязательное поле)
    firstNameInput.addEventListener('input', function () {
        if (isServerError) return;
        const value = firstNameInput.value.trim();
        if (value && value.length < 2) {
            setError(firstNameEmoji, firstNameError, '❌', 'Имя должно содержать минимум 2 символа.');
        } else if (value) {
            clearError(firstNameEmoji, firstNameError, '✅');
        } else {
            clearError(firstNameEmoji, firstNameError);
        }
    });

    // Валидация фамилии (необязательное поле)
    lastNameInput.addEventListener('input', function () {
        if (isServerError) return;
        const value = lastNameInput.value.trim();
        if (value && value.length < 2) {
            setError(lastNameEmoji, lastNameError, '❌', 'Фамилия должна содержать минимум 2 символа.');
        } else if (value) {
            clearError(lastNameEmoji, lastNameError, '✅');
        } else {
            clearError(lastNameEmoji, lastNameError);
        }
    });

    // Валидация отчества (необязательное поле)
    middleNameInput.addEventListener('input', function () {
        if (isServerError) return;
        const value = middleNameInput.value.trim();
        if (value && value.length < 2) {
            setError(middleNameEmoji, middleNameError, '❌', 'Отчество должно содержать минимум 2 символа.');
        } else if (value) {
            clearError(middleNameEmoji, middleNameError, '✅');
        } else {
            clearError(middleNameEmoji, middleNameError);
        }
    });

    // Валидация пола (необязательное поле)
    genderSelect.addEventListener('change', function () {
        if (isServerError) return;
        const value = genderSelect.value;
        if (value) {
            clearError(genderEmoji, genderError, '✅');
        } else {
            clearError(genderEmoji, genderError);
        }
    });

    // Валидация даты рождения (необязательное поле)
    dateOfBirthInput.addEventListener('input', function () {
        if (isServerError) return;
        const value = dateOfBirthInput.value;
        if (value) {
            clearError(dateOfBirthEmoji, dateOfBirthError, '✅');
        } else {
            clearError(dateOfBirthEmoji, dateOfBirthError);
        }
    });

    // Валидация страны проживания (необязательное поле)
    countryInput.addEventListener('input', function () {
        if (isServerError) return;
        const value = countryInput.value.trim();
        if (value && value.length < 2) {
            setError(countryEmoji, countryError, '❌', 'Страна должна содержать минимум 2 символа.');
        } else if (value) {
            clearError(countryEmoji, countryError, '✅');
        } else {
            clearError(countryEmoji, countryError);
        }
    });

    // Отправка формы через AJAX
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        // Собираем данные из формы
        const usernameValue = usernameInput.value.trim();
        const firstNameValue = firstNameInput.value.trim() || null;
        const lastNameValue = lastNameInput.value.trim() || null;
        const middleNameValue = middleNameInput.value.trim() || null;
        const genderValue = genderSelect.value || null;
        const dateOfBirthValue = dateOfBirthInput.value || null;
        const countryValue = countryInput.value.trim() || null;

        // Очищаем предыдущие ошибки
        clearAllErrors();

        // Логируем отправляемые данные
        console.log('Отправляемые данные:', {
            username: usernameValue,
            first_name: firstNameValue,
            last_name: lastNameValue,
            middle_name: middleNameValue,
            gender: genderValue,
            date_of_birth: dateOfBirthValue,
            country: countryValue
        });

        // Отправляем данные на сервер
        fetch('/profile/edit/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                username: usernameValue,
                first_name: firstNameValue,
                last_name: lastNameValue,
                middle_name: middleNameValue,
                gender: genderValue,
                date_of_birth: dateOfBirthValue,
                country: countryValue
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
                // Перенаправляем пользователя на страницу просмотра профиля
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