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

            console.log("Я здесь!");
            fetch(`/favorites/toggle_favorite/${recipeId}/`, { // Отправляем запрос на новый маршрут
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
                    // Получаем изображение внутри кнопки
                    const img = button.querySelector('.favorite-icon');

                    // Обновляем изображение и стиль кнопки
                    if (data.action === 'added') {
                        img.src = "/static/favorited.png";
                        button.classList.add('favorited');
                    } else if (data.action === 'removed') {
                        img.src = "/static/add_to_favorited.png";
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