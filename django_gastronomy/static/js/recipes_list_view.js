document.addEventListener('DOMContentLoaded', function () {
    const isAuthenticated = document.body.dataset.isAuthenticated === 'true';

    document.addEventListener('click', async function (event) {
        // Проверяем, был ли клик совершен на кнопке "Добавить в избранное"
        const button = event.target.closest('.add-to-favorites');
        if (!button) return;

        // Проверяем, авторизован ли пользователь
        if (!isAuthenticated) {
            alert('Войдите в аккаунт, чтобы добавить рецепт в избранное.');
            return;
        }

        // Получаем ID рецепта из атрибута data-recipe-id
        const recipeId = button.dataset.recipeId;
        if (!recipeId) {
            console.error('ID рецепта не найден.');
            return;
        }

        try {
            // Отправляем запрос на сервер
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
                // Обновляем изображение и стиль кнопки
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

    // ================================
    // Модальное окно удаления рецепта
    // ================================
    const deleteRecipeButtons = document.querySelectorAll('.delete-recipe-button');
    const deleteRecipeModal = document.getElementById('delete-recipe-modal');
    const confirmDeleteButton = document.getElementById('confirm-delete-recipe');
    const cancelDeleteButton = document.getElementById('cancel-delete-recipe');
    const recipeTitleToDelete = document.getElementById('recipe-title-to-delete');



    let recipeIdToDelete = null;

    document.addEventListener('click', function (event) {
        const button = event.target.closest('.delete-recipe-button');
        if (button) {
            console.log("Clicked to delete btn");
            const recipeId = button.getAttribute('data-recipe-id');
            const recipeTitle = button.getAttribute('data-recipe-title');
            recipeIdToDelete = recipeId;
            recipeTitleToDelete.textContent = recipeTitle;
            deleteRecipeModal.style.display = 'flex';
        }
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
    let currentSearchQuery = '';

    const { q, sort_by, order } = getUrlParams();
    // Устанавливаем начальные значения
    currentSortBy = sort_by;
    currentOrder = order;
    currentSearchQuery = q; // Сохраняем текущий поисковый запрос
    // Инициализируем список рецептов
    updateRecipes(q);

    function getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            q: urlParams.get('q') || '', // Поисковый запрос
            sort_by: urlParams.get('sort_by') || 'publish_date', // Критерий сортировки
            order: urlParams.get('order') || 'desc' // Порядок сортировки
        };
    }

    // Обновление списка рецептов через AJAX
    async function updateRecipes(searchQuery = '') {
        let url;

        if (searchQuery) {
            currentSearchQuery = searchQuery;
        }

        // Проверяем, находится ли пользователь на странице рецептов автора
        const isUserRecipesPage = document.body.dataset.isUserRecipes === 'true';
        if (isUserRecipesPage) {
            const userId = document.body.dataset.userId;
            if (userId) {
                url = `/user/${userId}/recipes/?sort_by=${currentSortBy}&order=${currentOrder}`;
            }
        } else {
            // Общий URL для других страниц
            url = `/recipes_list_view/?sort_by=${currentSortBy}&order=${currentOrder}`;
        }

        // Проверяем, находится ли пользователь на странице избранных рецептов
        const isFavoritesPage = document.body.dataset.isFavorites === 'true';
        if (isFavoritesPage) {
            url += '&favorites=true'; // Добавляем параметр для избранных рецептов
        }

        console.log('Формируемый URL:', url);

        if (searchQuery) {
            url += `&q=${encodeURIComponent(searchQuery)}`;
        }

        console.log('Формируемый URL:', url);

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
        console.log('Страница избранных рецептов:', isFavoritesPage);
        console.log('Страница рецептов автора:', isUserRecipesPage);
        console.log('ID автора:', document.body.dataset.userId);
        console.log('Формируемый URL:', url);
    }

    // Инициализация при загрузке страницы
    document.addEventListener('DOMContentLoaded', function () {
        // Извлекаем параметры из URL
        const { q, sort_by, order } = getUrlParams();

        // Устанавливаем начальные значения
        currentSortBy = sort_by;
        currentOrder = order;
        currentSearchQuery = q;

        // Инициализируем список рецептов
        updateRecipes(q);
    });

    // Обработчик для изменения критерия сортировки
    document.body.addEventListener('change', function (event) {
        const target = event.target;
        if (target.id === 'sort-by') {
            console.log("sortSelect changed to", target.value);
            currentSortBy = target.value; // Обновляем текущий критерий сортировки
            updateRecipes(q);
        }
    });

    // Обработчик для кнопки переключения порядка
    document.body.addEventListener('click', function (event) {
        const toggleOrderButton = event.target.closest('#toggle-order');
        if (toggleOrderButton) {
            console.log('Кнопка toggle-order нажата!');
            currentOrder = currentOrder === 'desc' ? 'asc' : 'desc'; // Переключаем порядок
            toggleOrderButton.textContent = currentOrder === 'desc' ? '▼' : '▲'; // Меняем символ
            updateRecipes(q);
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
            currentOrder = 'desc'; // Сбрасываем порядок на начальный
            updateRecipes(searchQuery);
        });
    }

    // Инициализация при загрузке страницы
    updateRecipes(q);
});