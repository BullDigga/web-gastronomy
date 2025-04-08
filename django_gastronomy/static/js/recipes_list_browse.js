document.addEventListener('DOMContentLoaded', function () {
    const isAuthenticated = document.body.dataset.isAuthenticated === 'true';

    // Находим все кнопки "Добавить в избранное"
    const favoriteButtons = document.querySelectorAll('.add-to-favorites');

    favoriteButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Если пользователь не авторизован, ничего не делаем
            if (!isAuthenticated) {
                return;
            }

            const recipeId = button.dataset.recipeId;

            if (!recipeId) {
                console.error('ID рецепта не найден.');
                return;
            }

            fetch(`/favorites/${recipeId}/`, { // Отправляем запрос на новый маршрут
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    recipe_id: recipeId
                })
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Ошибка сервера: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Обновляем текст и стиль кнопки
                    if (data.action === 'added') {
                        button.textContent = 'Удалить из избранного';
                        button.classList.add('favorited');
                    } else if (data.action === 'removed') {
                        button.textContent = 'Добавить в избранное';
                        button.classList.remove('favorited');
                    }
                }
            })
            .catch(error => {
                console.error('Ошибка:', error.message);
                alert(error.message);
            });
        });
    });
});