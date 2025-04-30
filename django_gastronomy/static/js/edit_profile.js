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
    const avatarInput = document.getElementById('id_avatar');
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarPlaceholder = document.getElementById('avatar-placeholder');
    const avatarLabel = document.querySelector('label[for="id_avatar"]');

    let isServerError = false;

    // Валидация обязательных и опциональных полей
    function addValidation(input, emoji, error, minLength = 0, message = '') {
        input.addEventListener('input', function () {
            if (isServerError) return;
            const value = input.value.trim();
            if (value.length === 0) {
                clearError(emoji, error);
            } else if (value.length < minLength) {
                setError(emoji, error, '❌', message);
            } else {
                clearError(emoji, error, '✅');
            }
        });
    }

    // Валидация select (опциональное)
    function addSelectValidation(select, emoji, error) {
        select.addEventListener('change', function () {
            if (isServerError) return;
            if (select.value) {
                clearError(emoji, error, '✅');
            } else {
                clearError(emoji, error);
            }
        });
    }

    // Применение валидации к полям
    addValidation(usernameInput, usernameEmoji, usernameError, 6, 'Псевдоним должен содержать минимум 6 символов.');
    addValidation(firstNameInput, firstNameEmoji, firstNameError, 2, 'Имя должно содержать минимум 2 символа.');
    addValidation(lastNameInput, lastNameEmoji, lastNameError, 2, 'Фамилия должна содержать минимум 2 символа.');
    addValidation(middleNameInput, middleNameEmoji, middleNameError, 2, 'Отчество должно содержать минимум 2 символа.');
    addValidation(countryInput, countryEmoji, countryError, 2, 'Страна должна содержать минимум 2 символа.');

    dateOfBirthInput.addEventListener('input', function () {
        if (isServerError) return;
        if (dateOfBirthInput.value) {
            clearError(dateOfBirthEmoji, dateOfBirthError, '✅');
        } else {
            clearError(dateOfBirthEmoji, dateOfBirthError);
        }
    });

    addSelectValidation(genderSelect, genderEmoji, genderError);

    // Обработка загрузки аватара
    if (avatarInput) {
        avatarInput.addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (file) {
                if (file.size > 10 * 1024 * 1024) {
                    alert('Размер файла аватара не должен превышать 10 МБ.');
                    avatarInput.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = function (e) {
                    avatarPreview.src = e.target.result;
                    avatarPreview.style.display = 'block';
                    avatarPlaceholder.style.display = 'none';
                    avatarLabel.classList.add('has-image');
                };
                reader.readAsDataURL(file);
            } else {
                avatarPreview.style.display = 'none';
                avatarPlaceholder.style.display = 'block';
                avatarLabel.classList.remove('has-image');
            }
        });
    }

    // Отправка формы через AJAX
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        clearAllErrors();

        const formData = new FormData();
        formData.append('username', usernameInput.value.trim());
        formData.append('first_name', firstNameInput.value.trim() || "");
        formData.append('last_name', lastNameInput.value.trim() || "");
        formData.append('middle_name', middleNameInput.value.trim() || "");
        formData.append('gender', genderSelect.value || "");
        formData.append('date_of_birth', dateOfBirthInput.value || "");
        formData.append('country', countryInput.value.trim() || "");

        if (avatarInput && avatarInput.files.length > 0) {
            formData.append('avatar', avatarInput.files[0]);
        }

        const aboutInput = document.getElementById('id_about');
        if (aboutInput && aboutInput.value.trim()) {
            formData.append('about', aboutInput.value.trim());
        }

        fetch('/profile/edit/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
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
                window.location.href = data.redirect_url;
            }
        })
        .catch(error => {
            isServerError = true;
            const errorMessage = error.message.toLowerCase();
            if (errorMessage.includes('уже используется')) {
                setError(usernameEmoji, usernameError, '❌', 'Этот псевдоним уже занят.');
            } else if (errorMessage.includes('псевдоним')) {
                setError(usernameEmoji, usernameError, '❌', error.message);
            } else {
                alert(error.message);
            }
            isServerError = false;
        });
    });

    // Установка ошибки
    function setError(emojiElement, errorElement, emoji, message = '') {
        emojiElement.textContent = emoji;
        emojiElement.classList.remove('valid');
        emojiElement.classList.add('invalid');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    // Очистка ошибки
    function clearError(emojiElement, errorElement, emoji = '') {
        emojiElement.textContent = emoji;
        emojiElement.classList.remove('invalid');
        if (emoji) {
            emojiElement.classList.add('valid');
        } else {
            emojiElement.classList.remove('valid');
        }
        errorElement.style.display = 'none';
    }

    // Очистка всех ошибок
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