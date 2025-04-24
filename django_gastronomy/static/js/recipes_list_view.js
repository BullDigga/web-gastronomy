document.addEventListener('DOMContentLoaded', function () {
    const isAuthenticated = document.body.dataset.isAuthenticated === 'true';

    // ================================
    // Обработчики кнопок "Добавить в избранное"
    // ================================
    const favoriteButtons = document.querySelectorAll('.add-to-favorites');
    favoriteButtons.forEach(button => {
        button.addEventListener('click', async function () {
            if (!isAuthenticated) return;

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
                }
            } catch (error) {
                console.error('Ошибка:', error.message);
                alert(error.message);
            }
        });
    });

    // ================================
    // Модальное окно удаления рецепта
    // ================================
    const deleteRecipeButtons = document.querySelectorAll('.delete-recipe-button');
    const deleteRecipeModal = document.getElementById('delete-recipe-modal');
    const confirmDeleteButton = document.getElementById('confirm-delete-recipe');
    const cancelDeleteButton = document.getElementById('cancel-delete-recipe');
    const recipeTitleToDelete = document.getElementById('recipe-title-to-delete');

    let recipeIdToDelete = null;

    deleteRecipeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const recipeId = this.getAttribute('data-recipe-id');
            const recipeTitle = this.getAttribute('data-recipe-title');
            recipeIdToDelete = recipeId;
            recipeTitleToDelete.textContent = recipeTitle;
            deleteRecipeModal.style.display = 'flex';
        });
    });

    cancelDeleteButton.addEventListener('click', function () {
        deleteRecipeModal.style.display = 'none';
        recipeIdToDelete = null;
    });

    confirmDeleteButton.addEventListener('click', async function () {
        if (!recipeIdToDelete) return;

        try {
            const response = await fetch(`/recipes/${recipeIdToDelete}/delete/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });

            const data = await response.json();
            if (data.status === 'success') {
                const recipeCard = document.querySelector(`.recipe-card[data-recipe-id="${recipeIdToDelete}"]`);
                if (recipeCard) recipeCard.remove();
            } else {
                alert(data.message || 'Не удалось удалить рецепт.');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при удалении рецепта.');
        } finally {
            deleteRecipeModal.style.display = 'none';
        }
    });

    // ================================
    // Функция получения CSRF-токена
    // ================================
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(`${name}=`)) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // ================================
    // Сортировка и фильтрация рецептов
    // ================================
    const sortSelect = document.getElementById('sort-by');
    let currentSortBy = sortSelect?.value || 'publish_date'; // Текущий критерий сортировки
    let currentOrder = document.getElementById('toggle-order')?.dataset.currentOrder || 'desc'; // Текущий порядок сортировки

    // Обновление списка рецептов через AJAX
    async function updateRecipes(searchQuery = '') {
        let url = `/recipes_list_view/?sort_by=${currentSortBy}&order=${currentOrder}`;
        if (searchQuery) {
            url += `&q=${encodeURIComponent(searchQuery)}`;
        }

        console.log('URL запроса:', url);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки рецептов');
            }

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newRecipesContainer = doc.querySelector('.recipes-container');

            if (newRecipesContainer) {
                const oldRecipesContainer = document.querySelector('.recipes-container');
                oldRecipesContainer.innerHTML = newRecipesContainer.innerHTML;

                // Обновляем выпадающий список сортировки
                const newSortSelect = doc.querySelector('#sort-by');
                if (newSortSelect) {
                    sortSelect.value = currentSortBy;
                }

                // Обновляем кнопку переключения порядка
                const newToggleOrderButton = doc.querySelector('#toggle-order');
                if (newToggleOrderButton) {
                    const toggleOrderButton = document.getElementById('toggle-order');
                    if (toggleOrderButton) {
                        toggleOrderButton.textContent = newToggleOrderButton.textContent;
                        toggleOrderButton.dataset.currentOrder = newToggleOrderButton.dataset.currentOrder;
                        currentOrder = newToggleOrderButton.dataset.currentOrder;
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось обновить список рецептов.');
        }
    }

    // Обработчик для изменения критерия сортировки
    document.body.addEventListener('change', function (event) {
        const target = event.target;
        if (target.id === 'sort-by') {
            console.log("sortSelect changed to", target.value);
            currentSortBy = target.value; // Обновляем текущий критерий сортировки
            updateRecipes();
        }
    });

    // Обработчик для кнопки переключения порядка
    document.body.addEventListener('click', function (event) {
        const toggleOrderButton = event.target.closest('#toggle-order');
        if (toggleOrderButton) {
            console.log('Кнопка toggle-order нажата!');
            currentOrder = currentOrder === 'desc' ? 'asc' : 'desc'; // Переключаем порядок
            toggleOrderButton.textContent = currentOrder === 'desc' ? '▼' : '▲'; // Меняем символ
            updateRecipes();
        }
    });

    // Обработчик для формы поиска
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Отменяем стандартную отправку формы

            const searchQuery = document.getElementById('search-input').value.trim();
            if (!searchQuery) {
                alert('Введите текст для поиска.');
                return;
            }

            // Обновляем URL с параметром q
            currentSortBy = 'publish_date'; // Сбрасываем сортировку на начальную
            updateRecipes(searchQuery);
        });
    }

    // Инициализация при загрузке страницы
    updateRecipes();
});