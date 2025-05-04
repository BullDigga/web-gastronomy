document.addEventListener('DOMContentLoaded', function () {
    // 1. Обработка кнопки "Удалить аккаунт"
    const deleteAccountButton = document.getElementById('delete-account-button');
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', function () {
            window.location.href = '/confirm_delete_account/';
        });
    }

    // 2. Обработка кнопки "Подписаться/Отписаться"
    const subscriptionForm = document.getElementById('subscription-form');
    const isAuthenticated = document.body.dataset.isAuthenticated === 'true';

    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Если пользователь не авторизован — показываем tooltip
            if (!isAuthenticated) {
                const subscribeButton = this.querySelector('.profile-button');
                showCustomTooltip(subscribeButton, 'Войдите в аккаунт, чтобы подписаться');
                return;
            }

            // Если авторизован — отправляем запрос
            const formData = new FormData(this);
            formData.append('action', 'toggle_subscription');

            fetch(window.location.href, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
                },
            })
            .then(response => response.json())
            .then(data => {
                const button = subscriptionForm.querySelector('.profile-button');
                const img = button.querySelector('img');

                if (data.is_subscribed) {
                    button.classList.remove('subscribe');
                    button.classList.add('unsubscribe');
                    img.src = "/static/icons/subscribed.png";
                    img.alt = "Отписаться";
                } else {
                    button.classList.remove('unsubscribe');
                    button.classList.add('subscribe');
                    img.src = "/static/icons/subscribe.png";
                    img.alt = "Подписаться";
                }
            })
            .catch(error => console.error('Ошибка:', error));
        });
    }

    // 3. Обработка кнопки "Добавить в избранное"
    document.addEventListener('click', async function (event) {
        const button = event.target.closest('.add-to-favorites');
        if (!button) return;

        if (!isAuthenticated) {
            showCustomTooltip(button, 'Войдите в аккаунт, чтобы иметь возможность добавить рецепт в избранное');
            return;
        }

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

                // Обновляем счётчик избранного
                const favoritesCountElement = document.querySelector(
                    `.recipe-card[data-recipe-id="${recipeId}"] .favorites-count`
                );
                if (favoritesCountElement) {
                    favoritesCountElement.textContent = data.favorites_count;
                    console.log("Счётчик обновлён");
                } else {
                    console.log("Элемент с количеством не найден");
                }
            }
        } catch (error) {
            console.error('Ошибка:', error.message);
            alert(error.message);
        }
    });

    // ================================
    // Функция для показа кастомного tooltip
    // ================================
    let tooltip = null;
    let tooltipTargetElement = null;
    let tooltipMessage = '';
    let isTooltipActive = false;

    function showCustomTooltip(element, message) {
        tooltipMessage = message;
        tooltipTargetElement = element;
        isTooltipActive = true;

        if (!tooltip) {
            tooltip = document.getElementById('custom-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'custom-tooltip';
                tooltip.style.position = 'fixed';
                tooltip.style.color = '#4a4a4a';
                tooltip.style.fontSize = '14px';
                tooltip.style.fontFamily = 'sans-serif';
                tooltip.style.zIndex = '99999';
                tooltip.style.pointerEvents = 'none';
                tooltip.style.whiteSpace = 'normal';
                tooltip.style.maxWidth = '200px';
                tooltip.style.wordBreak = 'break-word';
                tooltip.style.padding = '8px 12px';
                tooltip.style.background = 'none';
                tooltip.style.opacity = '0';
                tooltip.style.transition = 'opacity 0.3s ease-in-out';
                document.body.appendChild(tooltip);
            }
        }

        tooltip.textContent = message;

        positionTooltip(element, tooltip);

        // Анимация появления
        tooltip.style.opacity = '1';

        // Автоматическое скрытие через 3 секунды
        setTimeout(() => {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                tooltip.textContent = '';
                isTooltipActive = false;
            }, 300);
        }, 3000);
    }

    function positionTooltip(element, tooltip) {
        const rect = element.getBoundingClientRect();
        tooltip.style.top = `${rect.top + window.scrollY}px`;
        tooltip.style.left = `${rect.left + window.scrollX - tooltip.offsetWidth - 10}px`;
    }

    // Обновление позиции при скролле
    window.addEventListener('scroll', () => {
        if (isTooltipActive && tooltip && tooltipTargetElement) {
            positionTooltip(tooltipTargetElement, tooltip);
        }
    });
});