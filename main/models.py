from django.db import models
from django.core.exceptions import ValidationError
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _

import uuid
from accounts.models import User, UserRoom

class Client(models.Model):
    channel_name = models.CharField(max_length=255)
    time_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.channel_name
            
class PrivateRoom(models.Model):
    initiator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='private_room')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE)
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (f'{self.initiator.username} -> {self.receiver.username}')

class PrivateMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    private_room = models.ForeignKey(PrivateRoom, on_delete=models.CASCADE)
    message = models.TextField()
    time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.message

class GroupRoom(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    thumb = models.ImageField(blank=True, null=True, default=None)
    name = models.CharField(max_length=255, blank=False, null=False)
    room_type = models.BooleanField(default=False)
    bio = models.CharField(max_length=255, blank=True, default='Messenger Group')
    date_created = models.DateTimeField(auto_now_add=True)

    @property
    def has_dp(self):
        if self.thumb == '':
            return False
        else:
            return True

    def __str__(self):
        return self.name

class GroupMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group_room = models.ForeignKey(GroupRoom, on_delete=models.CASCADE)
    message = models.TextField()
    time = models.DateTimeField(default=now)

    def __str__(self):
        return self.message

class GroupInvite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group_room = models.ForeignKey(GroupRoom, on_delete=models.CASCADE)
    invite_token = models.UUIDField(default=uuid.uuid4)
    initiator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_invite')
    followed = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username

class GroupRequest(models.Model):
    group_room = models.ForeignKey(GroupRoom, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    approved = models.BooleanField(default=False)
    date_sent = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (f'{self.user} -> {self.group_room}')

class Participant(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group_room = models.ForeignKey(GroupRoom, on_delete=models.CASCADE)
    is_admin = models.BooleanField(default=False)
    has_blocked_group = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (f'{self.user} -> {self.group_room}')

class Friend(models.Model):
    uu_id = models.UUIDField(default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    initiator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friend_bk')
    userRoom = models.ForeignKey(UserRoom, on_delete=models.CASCADE)
    is_friend = models.BooleanField(default=False)
    is_blocked = models.BooleanField(default=False)

    def __str__(self):
        return (f'{self.user} -> {self.userRoom}')

class Notification(models.Model):
    uu_id = models.UUIDField(default=uuid.uuid4)
    userRoom = models.ForeignKey(UserRoom, on_delete=models.CASCADE)
    initiator = models.ForeignKey(User, on_delete=models.CASCADE)
    _type = models.CharField(max_length=255)
    headline = models.CharField(max_length=255)
    message = models.CharField(max_length=255)
    viewed = models.BooleanField(default=False)

    def __str__(self):
        return self._type