from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = models.EmailField(unique=True)
    bio = models.CharField(max_length=255, blank=True, default="Hello, I'm using messenger")
    thumb = models.ImageField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.pk == None:
            super().save(*args, **kwargs)
            UserRoom.objects.create(owner=self)
        else:
            super().save(*args, **kwargs)

    @property
    def has_dp(self):
        if self.thumb == '':
            return False
        else: 
            return True

class UserRoom(models.Model):
    owner = models.OneToOneField(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.owner.username