document.addEventListener('DOMContentLoaded', function () {
    const isAuthenticated = document.body.dataset.isAuthenticated === 'true';

    // Находим все звёзды
    const stars = document.querySelectorAll('.star');
    let currentRating = 0;

    // Находим элементы для вывода ошибок
    const errorGeneral = document.getElementById('error-general'); // Общий контейнер для ошибок
    const errorComment = document.getElementById('error-comment'); // Ошибка для комментария

    // Функция для показа ошибки
    function showError(element, message) {
        element.textContent = message;
        element.classList.add('visible');

        // Если уже есть видимая ошибка, очищаем её
        if (element.classList.contains('visible')) {
            element.classList.remove('visible');
            setTimeout(() => {
                element.classList.add('visible');
            }, 50); // Небольшая задержка для анимации
        }

        // Через 5 секунд начинаем анимацию затухания
        setTimeout(() => {
            element.classList.remove('visible');
        }, 5000);
    }

    // Обработка кликов на звёзды
    stars.forEach(star => {
        star.addEventListener('click', function () {
            if (!isAuthenticated) {
                showError(errorGeneral, 'Войдите в аккаунт, чтобы оценить рецепт.');
                return;
            }

            const value = parseFloat(star.getAttribute('data-value'));
            currentRating = value;
            updateStars(value);
        });

        star.addEventListener('mouseover', function () {
            if (isAuthenticated) {
                const value = parseFloat(star.getAttribute('data-value'));
                updateStars(value);
            }
        });

        star.addEventListener('mouseout', function () {
            if (isAuthenticated) {
                updateStars(currentRating);
            }
        });
    });

    // Функция для обновления стиля звёзд
    function updateStars(value) {
        stars.forEach(star => {
            const starValue = parseFloat(star.getAttribute('data-value'));

            if (starValue <= value) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    // Обработка кликов на кнопку "Оценить"
    const rateButton = document.querySelector('.rate-button');
    rateButton.addEventListener('click', function () {
        if (!isAuthenticated) {
            showError(errorGeneral, 'Войдите в аккаунт, чтобы оценить рецепт.');
        } else {
            alert(`Рецепт успешно оценён на ${currentRating} звёзд!`);
        }
    });

    // Обработка кликов на кнопку "Добавить в избранное"
    const favoriteButton = document.querySelector('.add-to-favorites');
    if (favoriteButton) {
        favoriteButton.addEventListener('click', async function () {
            if (!isAuthenticated) {
                showError(errorGeneral, 'Войдите в аккаунт, чтобы добавить рецепт в избранное.');
                return;
            }

            const recipeId = favoriteButton.dataset.recipeId;

            if (!recipeId) {
                console.error('ID рецепта не найден.');
                return;
            }

            // Отключаем кнопку, чтобы предотвратить повторные клики
            favoriteButton.disabled = true;

            try {
                const response = await fetch(`/favorites/${recipeId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({
                        recipe_id: recipeId
                    })
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`Ошибка сервера: ${text}`);
                }

                const data = await response.json();

                if (data.success) {
                    // Обновляем текст и стиль кнопки
                    if (data.action === 'added') {
                        favoriteButton.textContent = 'Удалить из избранного';
                        favoriteButton.classList.add('favorited');
                    } else if (data.action === 'removed') {
                        favoriteButton.textContent = 'Добавить в избранное';
                        favoriteButton.classList.remove('favorited');
                    }
                }
            } catch (error) {
                console.error('Ошибка:', error.message);
                alert(error.message);
            } finally {
                // Включаем кнопку обратно
                favoriteButton.disabled = false;
            }
        });
    }

    // Обработка кликов на кнопку "Оставить комментарий"
    const commentButton = document.querySelector('.add-comment-button');
    commentButton.addEventListener('click', function () {
        if (!isAuthenticated) {
            showError(errorComment, 'Войдите в аккаунт, чтобы оставить комментарий.');
        } else {
            alert('Комментарий добавлен!');
        }
    });
});