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
                        img.src = "/static/icons/favorited.png";
                        button.classList.add('favorited');
                    } else if (data.action === 'removed') {
                        img.src = "/static/icons/add_to_favorited.png";
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

    const deleteRecipeButtons = document.querySelectorAll('.delete-recipe-button');
    const deleteRecipeModal = document.getElementById('delete-recipe-modal');
    const confirmDeleteButton = document.getElementById('confirm-delete-recipe');
    const cancelDeleteButton = document.getElementById('cancel-delete-recipe');
    const recipeTitleToDelete = document.getElementById('recipe-title-to-delete');

    let recipeIdToDelete = null;

    // Открытие модального окна при клике на кнопку "Удалить рецепт"
    deleteRecipeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const recipeId = this.getAttribute('data-recipe-id');
            const recipeTitle = this.getAttribute('data-recipe-title');
            recipeIdToDelete = recipeId;
            recipeTitleToDelete.textContent = recipeTitle;
            deleteRecipeModal.style.display = 'flex';
        });
    });

    // Закрытие модального окна при нажатии "Отмена"
    cancelDeleteButton.addEventListener('click', function () {
        deleteRecipeModal.style.display = 'none';
        recipeIdToDelete = null;
    });

    // Удаление рецепта при нажатии "Да"
    confirmDeleteButton.addEventListener('click', function () {
        if (recipeIdToDelete) {
            fetch(`/recipes/${recipeIdToDelete}/delete/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken') // Получаем CSRF-токен
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Удаляем карточку рецепта из DOM
                    const recipeCard = document.querySelector(`.recipe-card[data-recipe-id="${recipeIdToDelete}"]`);
                    if (recipeCard) {
                        recipeCard.remove();
                    }
                } else {
                    alert(data.message); // Показываем сообщение об ошибке
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при удалении рецепта.');
            });
        }
        deleteRecipeModal.style.display = 'none';
    });

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});