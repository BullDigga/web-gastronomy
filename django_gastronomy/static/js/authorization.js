document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('authorization-form');
    if (!form) {
        console.error('Форма с id="authorization-form" не найдена.');
        return;
    }

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const emailEmoji = document.getElementById('email-emoji');
    const passwordEmoji = document.getElementById('password-emoji');

    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');

    let isServerError = false;

    // Валидация email
    emailInput.addEventListener('input', function () {
        if (isServerError) return;

        const value = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!value) {
            emailEmoji.textContent = '❌';
            emailEmoji.classList.remove('valid');
            emailEmoji.classList.add('invalid');
            emailError.textContent = 'Не введён Email.';
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
        if (isServerError) return;

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

    // Отправка формы через AJAX
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const emailValue = emailInput.value.trim();
        const passwordValue = passwordInput.value.trim();

        // Очищаем предыдущие ошибки
        emailError.style.display = 'none';
        passwordError.style.display = 'none';

        // Логируем отправляемые данные
        console.log('Отправляемые данные:', { email: emailValue, password: passwordValue });

        // Отправляем данные на сервер
        fetch('/authorization/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                email: emailValue,
                password: passwordValue
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
                window.location.href = '/';
            }
        })
        .catch(error => {
            isServerError = true;

            console.error('Ошибка:', error.message);

            // Очищаем предыдущие ошибки
            emailError.style.display = 'none';
            passwordError.style.display = 'none';

            // Проверяем текст ошибки
            if (error.message.includes('email')) {
                emailError.textContent = error.message;
                emailError.style.display = 'block';
            } else if (error.message.includes('пароль')) {
                passwordError.textContent = error.message;
                passwordError.style.display = 'block';
            } else {
                alert(error.message); // Общая ошибка
            }

            isServerError = false;
        });
    });
});