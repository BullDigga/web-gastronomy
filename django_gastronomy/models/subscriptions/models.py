from django.db import models
from django.utils.translation import gettext_lazy as _
from models.users.models import User  # Импортируем модель User


class Subscription(models.Model):
    user_subscriber = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='subscriptions',
        verbose_name=_('подписчик')
    )
    user_author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='subscribers',
        verbose_name=_('автор')
    )
    created_at = models.DateTimeField(
        _('дата подписки'),
        auto_now_add=True,
        help_text=_('Дата и время создания подписки.')
    )

    class Meta:
        verbose_name = _('подписка')
        verbose_name_plural = _('подписки')
        db_table = 'subscriptions'
        unique_together = ('user_subscriber', 'user_author')

    def __str__(self):
        return f"{self.user_subscriber.email} подписан на {self.user_author.email}"