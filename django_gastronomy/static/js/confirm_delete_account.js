document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('delete-account-form');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.querySelector('.error-message');
    const emoji = document.querySelector('.emoji');

    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault();

            const password = passwordInput.value;

            try {
                const response = await fetch('/delete_account/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                    },
                    body: JSON.stringify({
                        password: password
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    errorMessage.textContent = data.error || 'Произошла ошибка.';
                    errorMessage.classList.add('visible');
                    return;
                }

                const data = await response.json();

                if (data.success) {
                    // Успешное удаление аккаунта
                    window.location.href = '/'; // Перенаправление на главную страницу
                } else {
                    // Показываем ошибку
                    errorMessage.textContent = data.error || 'Неверный пароль.';
                    errorMessage.classList.add('visible');
                    emoji.classList.remove('valid');
                    emoji.classList.add('invalid');
                }
            } catch (error) {
                console.error('Ошибка:', error.message);
                errorMessage.textContent = 'Произошла ошибка. Попробуйте позже.';
                errorMessage.classList.add('visible');
            }
        });
    }

    // Очистка сообщения об ошибке при изменении поля пароля
    passwordInput.addEventListener('input', function () {
        errorMessage.classList.remove('visible');
        emoji.classList.remove('invalid');
        emoji.classList.remove('valid');
    });
});