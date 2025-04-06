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
    favoriteButton.addEventListener('click', function () {
        if (!isAuthenticated) {
            showError(errorGeneral, 'Войдите в аккаунт, чтобы добавить рецепт в избранное.');
        } else {
            alert('Рецепт добавлен в избранное!');
        }
    });

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