document.addEventListener('DOMContentLoaded', function () {
    // 1. Обработка кнопки "Удалить аккаунт"
    const deleteAccountButton = document.getElementById('delete-account-button');
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', function () {
            // Перенаправляем пользователя на страницу подтверждения удаления аккаунта
            window.location.href = '/confirm_delete_account/';
        });
    }

    // 2. Обработка кнопки "Подписаться/Отписаться"
    const subscriptionForm = document.getElementById('subscription-form');
    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Предотвращаем стандартную отправку формы

            const formData = new FormData(this);
            formData.append('action', 'toggle_subscription');

            fetch(window.location.href, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': formData.get('csrfmiddlewaretoken'), // CSRF-токен для безопасности
                },
            })
            .then(response => response.json())
            .then(data => {
                const button = subscriptionForm.querySelector('.profile-button');
                const img = button.querySelector('img');

                if (data.is_subscribed) {
                    // Если подписка активна, меняем кнопку на "Отписаться"
                    button.classList.remove('subscribe');
                    button.classList.add('unsubscribe');
                    img.src = "/static/icons/subscribed.png";
                    img.alt = "Отписаться";
                } else {
                    // Если подписка отменена, меняем кнопку на "Подписаться"
                    button.classList.remove('unsubscribe');
                    button.classList.add('subscribe');
                    img.src = "/static/icons/subscribe.png";
                    img.alt = "Подписаться";
                }
            })
            .catch(error => console.error('Ошибка:', error));
        });
    }
});