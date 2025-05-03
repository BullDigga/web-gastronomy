document.addEventListener('DOMContentLoaded', function () {
    // 1. Обработка кнопки "Удалить аккаунт"
    const deleteAccountButton = document.getElementById('delete-account-button');
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', function () {
            window.location.href = '/confirm_delete_account/';
        });
    }

    // 2. Обработка кнопки "Подписаться/Отписаться"
    const subscriptionForm = document.getElementById('subscription-form');
    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData(this);
            formData.append('action', 'toggle_subscription');

            fetch(window.location.href, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
                },
            })
            .then(response => response.json())
            .then(data => {
                const button = subscriptionForm.querySelector('.profile-button');
                const img = button.querySelector('img');

                if (data.is_subscribed) {
                    button.classList.remove('subscribe');
                    button.classList.add('unsubscribe');
                    img.src = "/static/icons/subscribed.png";
                    img.alt = "Отписаться";
                } else {
                    button.classList.remove('unsubscribe');
                    button.classList.add('subscribe');
                    img.src = "/static/icons/subscribe.png";
                    img.alt = "Подписаться";
                }
            })
            .catch(error => console.error('Ошибка:', error));
        });
    }

    // 3. Обработка кнопки "Добавить в избранное"
    const isAuthenticated = document.body.dataset.isAuthenticated === 'true';

    document.addEventListener('click', async function (event) {
        const button = event.target.closest('.add-to-favorites');
        if (!button) return;

        if (!isAuthenticated) {
            alert('Войдите в аккаунт, чтобы добавить рецепт в избранное.');
            return;
        }

        const recipeId = button.dataset.recipeId;
        if (!recipeId) {
            console.error('ID рецепта не найден.');
            return;
        }

        try {
            const response = await fetch(`/favorites/toggle_favorite/${recipeId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ recipe_id: recipeId })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка сервера: ${errorText}`);
            }

            const data = await response.json();
            if (data.success) {
                const img = button.querySelector('.favorite-icon');
                if (data.action === 'added') {
                    img.src = "/static/icons/favorited.png";
                    button.classList.add('favorited');
                } else if (data.action === 'removed') {
                    img.src = "/static/icons/add_to_favorited.png";
                    button.classList.remove('favorited');
                }

                // Обновляем счётчик избранного
                const favoritesCountElement = document.querySelector(
                    `.recipe-card[data-recipe-id="${recipeId}"] .favorites-count`
                );
                if (favoritesCountElement) {
                    favoritesCountElement.textContent = data.favorites_count;
                    console.log("Счётчик обновлён");
                } else {
                    console.log("Элемент с количеством не найден");
                }
            }
        } catch (error) {
            console.error('Ошибка:', error.message);
            alert(error.message);
        }
    });
});