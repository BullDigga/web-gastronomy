document.addEventListener('DOMContentLoaded', function() {
    // Находим все кнопки "Добавить в избранное"
    const favoriteButtons = document.querySelectorAll('.add-to-favorites');

    favoriteButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Проверяем, есть ли у пользователя доступ (пока что просто пример)
            const isAuthenticated = {{ user.is_authenticated|yesno:'true,false' }}; // Передаем статус аутентификации из Django

            if (!isAuthenticated) {
                // Показываем подсказку
                const tooltip = this.querySelector('.tooltip');
                tooltip.classList.add('show');

                // Скрываем подсказку при следующем клике или обновлении страницы
                // (пока что она будет оставаться видимой до обновления)
            }
        });
    });
});