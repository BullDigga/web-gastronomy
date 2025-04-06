document.addEventListener('DOMContentLoaded', function () {
    // Получаем статус аутентификации из атрибута data-is-authenticated
    const isAuthenticated = document.body.dataset.isAuthenticated === 'true';

    // Находим все кнопки "Добавить в избранное"
    const favoriteButtons = document.querySelectorAll('.add-to-favorites');
    const viewRecipeButtons = document.querySelectorAll('.view-recipe');

    viewRecipeButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Получаем ID рецепта из атрибута data-recipe-id
            const recipeId = this.dataset.recipeId;

            if (!recipeId) {
                console.error('ID рецепта не найден.');
                return;
            }

            // Формируем URL для страницы просмотра рецепта
            const recipeUrl = `/recipes/${recipeId}/`;

            // Перенаправляем пользователя на страницу рецепта
            window.location.href = recipeUrl;
        });
    });

    favoriteButtons.forEach(button => {
        button.addEventListener('click', function () {
            if (!isAuthenticated) {
                // Находим подсказку внутри кнопки
                const tooltip = this.querySelector('.tooltip');
                if (tooltip) {
                    console.log('Подсказка найдена:', tooltip);
                    tooltip.classList.add('show'); // Показываем подсказку
                } else {
                    console.error('Подсказка не найдена');
                }
            } else {
                // Для авторизованных пользователей — AJAX-запрос
                const recipeId = this.closest('.recipe-card').dataset.recipeId;
                console.log('Добавляем рецепт в избранное:', recipeId);

                fetch('/add-to-favorites/', {
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
                        return response.json().then(data => {
                            throw new Error(data.error || 'Произошла ошибка при обработке запроса.');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        alert('Рецепт успешно добавлен в избранное!');
                    }
                })
                .catch(error => {
                    console.error('Ошибка:', error.message);
                    alert(error.message);
                });
            }
        });
    });
});