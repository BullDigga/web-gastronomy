document.addEventListener('DOMContentLoaded', function () {
    // Обработка клика по кнопке "Удалить аккаунт"
    const deleteAccountButton = document.getElementById('delete-account-button');
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', function () {
            // Перенаправляем пользователя на страницу подтверждения удаления аккаунта
            window.location.href = '/confirm_delete_account/';
        });
    }
});