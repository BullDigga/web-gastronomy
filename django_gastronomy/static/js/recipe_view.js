document.addEventListener('DOMContentLoaded', function () {
    const isAuthenticated = document.body.dataset.isAuthenticated === 'true';

    // Глобальная переменная для ID рецепта
    let recipeId;

    // Находим кнопку "Добавить в избранное"
    const favoriteButton = document.querySelector('.add-to-favorites');
    if (!favoriteButton) {
        console.error('Кнопка .add-to-favorites не найдена.');
        return;
    }

    // Инициализируем ID рецепта
    recipeId = favoriteButton.dataset.recipeId;
    if (!recipeId) {
        console.error('ID рецепта не найден.');
        return;
    }
    console.log('ID рецепта:', recipeId); // Для отладки

    // Находим все звёзды
    const stars = document.querySelectorAll('.star');
    let currentRating = 0;
    let initialRating = 0; // Исходная оценка пользователя

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

    // Инициализация текущей оценки
    const starsContainer = document.querySelector('.stars-slider');
    currentRating = parseFloat(starsContainer.dataset.currentRating) || 0;
    initialRating = currentRating; // Устанавливаем исходную оценку
    updateStars(currentRating);

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

            // Показываем или скрываем кнопку "Оценить"
            const rateButton = document.querySelector('.rate-button');
            if (rateButton) {
                if (currentRating === initialRating) {
                    rateButton.style.display = 'none'; // Скрываем, если оценка совпадает с исходной
                } else {
                    rateButton.style.display = 'inline-block'; // Показываем, если оценка изменилась
                }
            }
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
    if (rateButton) {
        rateButton.addEventListener('click', async function () {
            if (!isAuthenticated) {
                showError(errorGeneral, 'Войдите в аккаунт, чтобы оценить рецепт.');
                return;
            }

            if (!currentRating) {
                showError(errorGeneral, 'Выберите количество звёзд для оценки.');
                return;
            }

            try {
                const response = await fetch(`/rate_recipe/${recipeId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                    },
                    body: JSON.stringify({ rating: currentRating }),
                });

                const data = await response.json();

                if (data.success) {
                    // Округляем среднюю оценку до одного знака после запятой
                    const roundedAverageRating = parseFloat(data.average_rating).toFixed(1);
                    const ratingsCount = data.ratings_count; // Количество оценок
                    const favoritesCount = data.favorites_count; // Количество добавлений в избранное

                    // Обновляем среднюю оценку
                    document.querySelector('.average-rating').innerHTML =
                        `<strong>Средняя оценка:</strong> ${roundedAverageRating}/5`;

                    // Обновляем количество оценок
                    document.querySelector('.ratings-count').innerHTML =
                        `<strong>Количество оценок:</strong> ${ratingsCount}`;

                    // Обновляем количество добавлений в избранное
                    document.querySelector('.favorites-count').innerHTML =
                        `<strong>Добавили в избранное:</strong> ${favoritesCount}`;

                    // Обновляем исходную оценку
                    initialRating = currentRating;

                    // Скрываем кнопку "Оценить"
                    rateButton.style.display = 'none';

                    // Показываем кнопку "Удалить оценку"
                    const deleteRatingButton = document.querySelector('.delete-rating-button');
                    if (deleteRatingButton) {
                        deleteRatingButton.style.display = 'inline-block';
                    }
                } else {
                    showError(errorGeneral, data.error || 'Произошла ошибка при оценке.');
                }
            } catch (error) {
                console.error('Ошибка:', error.message);
                showError(errorGeneral, 'Произошла ошибка. Попробуйте позже.');
            }
        });
    }

    // Обработка кликов на кнопку "Удалить оценку"
    const deleteRatingButton = document.querySelector('.delete-rating-button');
    if (deleteRatingButton) {
        deleteRatingButton.addEventListener('click', async function () {
            if (!isAuthenticated) {
                showError(errorGeneral, 'Войдите в аккаунт, чтобы удалить оценку.');
                return;
            }

            try {
                const response = await fetch(`/delete_rating/${recipeId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                    },
                });

                const data = await response.json();

                if (data.success) {
                    // Округляем среднюю оценку до одного знака после запятой
                    const roundedAverageRating = parseFloat(data.average_rating).toFixed(1);
                    const ratingsCount = data.ratings_count; // Количество оценок
                    const favoritesCount = data.favorites_count; // Количество добавлений в избранное

                    // Обновляем среднюю оценку
                    document.querySelector('.average-rating').innerHTML =
                        `<strong>Средняя оценка:</strong> ${roundedAverageRating}/5`;

                    // Обновляем количество оценок
                    document.querySelector('.ratings-count').innerHTML =
                        `<strong>Количество оценок:</strong> ${ratingsCount}`;

                    // Обновляем количество добавлений в избранное
                    document.querySelector('.favorites-count').innerHTML =
                        `<strong>Добавили в избранное:</strong> ${favoritesCount}`;

                    // Сбрасываем текущую и исходную оценку
                    currentRating = 0;
                    initialRating = 0;
                    updateStars(currentRating);

                    // Скрываем кнопку "Удалить оценку" и показываем кнопку "Оценить"
                    deleteRatingButton.style.display = 'none';
                    const rateButton = document.querySelector('.rate-button');
                    if (rateButton) {
                        rateButton.style.display = 'inline-block';
                    }
                } else {
                    showError(errorGeneral, data.error || 'Произошла ошибка при удалении оценки.');
                }
            } catch (error) {
                console.error('Ошибка:', error.message);
                showError(errorGeneral, 'Произошла ошибка. Попробуйте позже.');
            }
        });
    }

    // Обработка кликов на кнопку "Добавить в избранное"
    if (favoriteButton) {
        favoriteButton.addEventListener('click', async function () {
            if (!isAuthenticated) {
                showError(errorGeneral, 'Войдите в аккаунт, чтобы добавить рецепт в избранное.');
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

                    // Обновляем количество добавлений в избранное
                    const favoritesCount = data.favorites_count;
                    document.querySelector('.favorites-count').innerHTML =
                        `<strong>Добавили в избранное:</strong> ${favoritesCount}`;
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
    if (commentButton) {
        commentButton.addEventListener('click', function () {
            if (!isAuthenticated) {
                showError(errorComment, 'Войдите в аккаунт, чтобы оставить комментарий.');
            } else {
                alert('Комментарий добавлен!');
            }
        });
    }
});