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
                const response = await fetch(`/ratings/rate_recipe/${recipeId}/`, {
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
                    const deleteRatingButton = document.getElementById('delete-rating-button');
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
    const deleteRatingButton = document.getElementById('delete-rating-button');
    if (deleteRatingButton) {
        deleteRatingButton.addEventListener('click', async function () {
            if (!isAuthenticated) {
                showError(errorGeneral, 'Войдите в аккаунт, чтобы удалить оценку.');
                return;
            }
            try {
                const response = await fetch(`/ratings/delete_rating/${recipeId}/`, {
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
                const response = await fetch(`/favorites/toggle_favorite/${recipeId}/`, {
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
                    // Получаем изображение внутри кнопки
                    const img = favoriteButton.querySelector('.favorite-icon');

                    // Обновляем изображение и стиль кнопки
                    if (data.action === 'added') {
                        img.src = "/static/icons/favorited.png"; // Изменяем на "icons/favorited.png"
                        favoriteButton.classList.add('favorited');
                    } else if (data.action === 'removed') {
                        img.src = "/static/icons/add_to_favorited.png"; // Изменяем на "icons/add_to_favorited.png"
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
    const commentEditor = document.querySelector('.comment-editor');
    if (commentButton) {
        commentButton.addEventListener('click', function () {
            if (!isAuthenticated) {
                showError(errorComment, 'Войдите в аккаунт, чтобы оставить комментарий.');
            } else {
                // Скрываем кнопку "Оставить комментарий"
                commentButton.style.display = 'none';

                // Показываем редактор комментария
                if (commentEditor) {
                    commentEditor.style.display = 'block';

                    // Фокусируем поле ввода
                    const commentTextarea = document.getElementById('comment-text');
                    if (commentTextarea) {
                        commentTextarea.focus();
                    }
                }
            }
        });
    }

    function showErrorNearButton(button, message) {
        // Находим родительский контейнер кнопки
        const container = button.closest('.reply-button-container');
        if (!container) {
            console.error('Контейнер для кнопки не найден.');
            return;
        }

        // Находим контейнер для ошибки внутри родительского контейнера
        const errorContainer = container.querySelector('.reply-error');
        if (!errorContainer) {
            console.error('Контейнер для ошибки не найден.');
            return;
        }

        // Устанавливаем текст ошибки и показываем её
        errorContainer.textContent = message;
        errorContainer.classList.add('visible');

        // Через 5 секунд скрываем сообщение
        setTimeout(() => {
            errorContainer.classList.remove('visible');
        }, 5000);
    }

    const closeCommentEditorButton = commentEditor.querySelector('.close-editor-button');
    if (closeCommentEditorButton) {
        closeCommentEditorButton.addEventListener('click', function () {
            // Скрываем редактор комментария
            commentEditor.style.display = 'none';
            // Показываем кнопку "Оставить комментарий"
            commentButton.style.display = 'inline-block';
        });
    }

    // Функция для отображения миниатюры
    function handleImageUpload(inputId, previewId, placeholderId) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        const placeholder = document.getElementById(placeholderId);
        const label = document.querySelector(`label[for="${inputId}"]`);

        input.addEventListener('change', function (event) {
            const file = event.target.files[0];

            if (file) {
                // Проверяем размер файла (не более 10 МБ)
                if (file.size > 10 * 1024 * 1024) {
                    alert('Размер файла не должен превышать 10 МБ.');
                    input.value = ''; // Очищаем поле выбора файла
                    return;
                }

                // Создаем URL для предварительного просмотра изображения
                const reader = new FileReader();
                reader.onload = function (e) {
                    preview.src = e.target.result; // Устанавливаем источник изображения
                    preview.style.display = 'block'; // Показываем изображение
                    placeholder.style.display = 'none'; // Скрываем placeholder

                    label.classList.add('has-image');
                };
                reader.readAsDataURL(file); // Читаем файл как Data URL
            } else {
                // Если файл не выбран, возвращаем placeholder
                preview.style.display = 'none';
                placeholder.style.display = 'block';

                label.classList.remove('has-image');
            }
        });
    }

    // Инициализация обработчиков для обоих изображений
    handleImageUpload('comment-image1', 'comment-image1-preview', 'comment-image1-placeholder');
    handleImageUpload('comment-image2', 'comment-image2-preview', 'comment-image2-placeholder');


    const commentForm = document.getElementById('comment-form');
    if (!commentForm) {
        console.error('Форма комментария не найдена.');
        return;
    }

    commentForm.addEventListener('submit', async function (event) {
        event.preventDefault(); // Предотвращаем стандартную отправку формы

        // Собираем данные из формы
        const formData = new FormData();
        const text = document.getElementById('comment-text').value.trim();
        const image1 = document.getElementById('comment-image1').files[0];
        const image2 = document.getElementById('comment-image2').files[0];

        // Проверяем, что текст комментария не пустой
        if (!text) {
            alert('Текст комментария не может быть пустым.');
            return;
        }

        // Добавляем данные в FormData
        formData.append('recipe_id', recipeId);
        formData.append('text', text);
        if (image1) formData.append('image1', image1);
        if (image2) formData.append('image2', image2);

        try {
            // Отправляем данные на сервер через AJAX
            const response = await fetch('/comments/comments/create/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
            });

            const data = await response.json();

            if (response.ok) {
                // Если комментарий успешно добавлен, очищаем форму
                commentForm.reset();
                document.getElementById('comment-image1-preview').style.display = 'none';
                document.getElementById('comment-image2-preview').style.display = 'none';
                document.getElementById('comment-image1-placeholder').style.display = 'block';
                document.getElementById('comment-image2-placeholder').style.display = 'block';

                location.reload();
            } else {
                // Выводим ошибку, если что-то пошло не так
                alert(`Ошибка: ${data.error || 'Не удалось опубликовать комментарий.'}`);
            }
        } catch (error) {
            console.error('Ошибка:', error.message);
            alert('Произошла ошибка. Попробуйте позже.');
        }
    });


    let currentCommentId;

    // Находим все кнопки удаления комментариев
    const deleteButtons = document.querySelectorAll('.delete-comment-button');
    const modal = document.getElementById('delete-comment-modal');
    const confirmButton = document.getElementById('confirm-delete-comment');
    const cancelButton = document.getElementById('cancel-delete-comment');

    // Обработка клика на кнопку удаления
    deleteButtons.forEach(button => {
        button.addEventListener('click', function () {
            const commentContainer = button.closest('.comment-container');
            currentCommentId = commentContainer.dataset.commentId;
            modal.style.display = 'flex'; // Показываем модальное окно
        });
    });

    // Обработка клика на кнопку "Да" (подтверждение удаления)
    confirmButton.addEventListener('click', async function () {
        try {
            const response = await fetch(`/comments/delete/${currentCommentId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении комментария.');
            }

            const data = await response.json();
            if (data.success) {
                // Удаляем комментарий из DOM
                const commentContainer = document.querySelector(`.comment[data-comment-id="${currentCommentId}"]`);
                if (commentContainer) {
                    commentContainer.remove();
                }
                location.reload();
            } else {
                alert(data.error || 'Произошла ошибка при удалении.');
            }
        } catch (error) {
            console.error('Ошибка:', error.message);
            alert('Не удалось удалить комментарий. Попробуйте позже.');
        } finally {
            modal.style.display = 'none'; // Скрываем модальное окно
        }
    });

    // Обработка клика на кнопку "Отмена"
    cancelButton.addEventListener('click', function () {
        modal.style.display = 'none'; // Скрываем модальное окно
    });

    // Закрытие модального окна при клике вне его области
    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
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
            .then(response => {
                if (response.ok) {
                    window.location.href = '/'; // Перенаправляем на главную страницу
                } else {
                    alert('Ошибка при удалении рецепта.');
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


    // Находим все кнопки "Ответить"
    const replyButtons = document.querySelectorAll('.reply-button');

    // Функция для создания редактора комментариев
    function createCommentEditor(parentCommentId, level) {
        // Создаем контейнер для редактора комментариев
        const editorContainer = document.createElement('div');
        editorContainer.classList.add('comment-editor', 'reply-editor');
        editorContainer.setAttribute('data-parent-comment-id', parentCommentId);
        console.log("level: ", level)
        editorContainer.style.marginLeft = `${level * 20}px`;

        // HTML-структура редактора комментариев
        editorContainer.innerHTML = `
            <form class="reply-form" enctype="multipart/form-data">
                <div class="comment-container">
                    <div class="close-editor-button">
                        <img src="/static/icons/cross.png" alt="Закрыть редактор" class="close-icon">
                    </div>
                    <!-- Текстовое поле -->
                    <textarea id="reply-text-${parentCommentId}" name="text" placeholder="Введите ваш ответ..."></textarea>
                    <!-- Контейнер для загрузки изображений -->
                    <div class="image-upload-container">
                        <div class="photo-upload">
                            <label for="reply-image1-${parentCommentId}" class="photo-label">
                                <img id="reply-image1-preview-${parentCommentId}" src="#" alt="Изображение 1" style="display: none;" />
                                <span id="reply-image1-placeholder-${parentCommentId}">+</span>
                            </label>
                            <input type="file" id="reply-image1-${parentCommentId}" name="image1" accept="image/*" style="display: none;" />
                        </div>
                        <div class="photo-upload">
                            <label for="reply-image2-${parentCommentId}" class="photo-label">
                                <img id="reply-image2-preview-${parentCommentId}" src="#" alt="Изображение 2" style="display: none;" />
                                <span id="reply-image2-placeholder-${parentCommentId}">+</span>
                            </label>
                            <input type="file" id="reply-image2-${parentCommentId}" name="image2" accept="image/*" style="display: none;" />
                        </div>
                    </div>
                    <!-- Кнопка "Опубликовать" -->
                    <button type="submit" class="publish-button">Опубликовать</button>
                </div>
            </form>
        `;

        return editorContainer;
    }

    // Обработчик для кнопок "Ответить"
    replyButtons.forEach(button => {
        button.addEventListener('click', function () {
            if (!isAuthenticated) {
                // Показываем ошибку рядом с кнопкой
                showErrorNearButton(button, 'Войдите в аккаунт, чтобы оставить комментарий.');
                return;
            }

            const commentContainer = button.closest('.comment-container');
            const parentCommentId = commentContainer.dataset.commentId;
            const level = parseInt(commentContainer.dataset.level || 0)

            // Проверяем, есть ли уже открытый редактор для этого комментария
            const existingEditor = commentContainer.querySelector('.reply-editor');
            if (existingEditor) {
                existingEditor.remove(); // Удаляем, если уже открыт
                button.style.display = 'inline-block'; // Показываем кнопку "Ответить"
                return;
            }

            // Создаем новый редактор комментариев
            const editor = createCommentEditor(parentCommentId, level);
            console.log('Созданный редактор:', editor); // Отладочный вывод

            // Добавляем редактор после контейнера комментария
            commentContainer.after(editor);

            // Скрываем кнопку "Ответить"
            button.style.display = 'none';

            const closeButton = editor.querySelector('.close-editor-button');
            if (closeButton) {
                closeButton.addEventListener('click', function () {
                    editor.remove(); // Удаляем редактор
                    button.style.display = 'inline-block'; // Показываем кнопку "Ответить"
                });
            }

            // Инициализация обработчиков для изображений
            handleImageUpload(`reply-image1-${parentCommentId}`, `reply-image1-preview-${parentCommentId}`, `reply-image1-placeholder-${parentCommentId}`);
            handleImageUpload(`reply-image2-${parentCommentId}`, `reply-image2-preview-${parentCommentId}`, `reply-image2-placeholder-${parentCommentId}`);

            // Обработка отправки формы
            const replyForm = editor.querySelector('.reply-form');
            replyForm.addEventListener('submit', async function (event) {
                event.preventDefault();

                // Собираем данные из формы
                const formData = new FormData();
                const text = editor.querySelector(`#reply-text-${parentCommentId}`).value.trim();
                const image1 = editor.querySelector(`#reply-image1-${parentCommentId}`).files[0];
                const image2 = editor.querySelector(`#reply-image2-${parentCommentId}`).files[0];

                // Проверяем, что текст комментария не пустой
                if (!text) {
                    alert('Текст комментария не может быть пустым.');
                    return;
                }

                // Добавляем данные в FormData
                formData.append('recipe_id', recipeId);
                formData.append('text', text);
                formData.append('parent_comment_id', parentCommentId); // ID родительского комментария
                if (image1) formData.append('image1', image1);
                if (image2) formData.append('image2', image2);

                try {
                    // Отправляем данные на сервер через AJAX
                    const response = await fetch('/comments/comments/create/', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                        },
                    });

                    const data = await response.json();
                    if (response.ok) {
                        // Если комментарий успешно добавлен, очищаем форму
                        replyForm.reset();
                        editor.remove(); // Удаляем редактор
                        location.reload(); // Перезагружаем страницу для обновления комментариев
                    } else {
                        alert(`Ошибка: ${data.error || 'Не удалось опубликовать комментарий.'}`);
                    }
                } catch (error) {
                    console.error('Ошибка:', error.message);
                    alert('Произошла ошибка. Попробуйте позже.');
                }
            });
        });
    });
});