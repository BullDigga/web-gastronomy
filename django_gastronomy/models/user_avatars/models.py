from django.db import models
from django.conf import settings
from django.core.files.base import ContentFile
from PIL import Image
from io import BytesIO
from django.utils.translation import gettext_lazy as _

class UserAvatar(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_avatar',
        primary_key=True,
        verbose_name=_('user')
    )

    avatar = models.ImageField(_('avatar'), upload_to='user_avatars/', max_length=500, blank=True, null=True)
    avatar_compressed = models.ImageField(_('compressed avatar'), upload_to='user_avatars/compressed/', max_length=500, blank=True, null=True)
    thumbnail = models.ImageField(_('thumbnail'), upload_to='user_thumbnails/', max_length=500, blank=True, null=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    def save(self, *args, **kwargs):
        needs_save = False

        if self.avatar and not self.avatar_compressed:
            try:
                img = Image.open(self.avatar)

                if img.mode != 'RGB':
                    img = img.convert('RGB')

                # Сжатый аватар
                output_size_avatar = (300, 300)
                img.thumbnail(output_size_avatar, Image.Resampling.LANCZOS)

                thumb_io = BytesIO()
                img.save(thumb_io, format='JPEG', quality=85)

                compressed_filename = f'compressed_{self.avatar.name.split("/")[-1]}'
                self.avatar_compressed.save(compressed_filename, ContentFile(thumb_io.getvalue()), save=False)
                needs_save = True

            except Exception as e:
                print(f"Ошибка при создании сжатого аватара: {e}")

        if self.avatar and not self.thumbnail:
            try:
                img = Image.open(self.avatar)

                if img.mode != 'RGB':
                    img = img.convert('RGB')

                # Миниатюра
                output_size_thumbnail = (700, 700)
                img.thumbnail(output_size_thumbnail, Image.Resampling.LANCZOS)

                thumb_io = BytesIO()
                img.save(thumb_io, format='JPEG', quality=10)

                thumbnail_filename = f'thumbnail_{self.avatar.name.split("/")[-1]}'
                self.thumbnail.save(thumbnail_filename, ContentFile(thumb_io.getvalue()), save=False)
                needs_save = True

            except Exception as e:
                print(f"Ошибка при создании миниатюры: {e}")

        super().save(*args, **kwargs)

    class Meta:
        db_table = 'user_avatars'