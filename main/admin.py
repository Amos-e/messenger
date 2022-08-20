from django.contrib import admin
from .forms import AdminGroupCreationForm
from .models import (
    Client,
    PrivateRoom,
    GroupRoom,
    GroupMessage,
    PrivateMessage,
    Participant,
    Friend,
    Notification,
    GroupInvite,
    GroupRequest)
from client_side_image_cropping import DcsicAdminMixin

class GroupRoomAdmin(DcsicAdminMixin, admin.ModelAdmin):
    form = AdminGroupCreationForm

admin.site.register(Client)
admin.site.register(PrivateRoom)
admin.site.register(GroupRoom, GroupRoomAdmin)
admin.site.register(GroupMessage)
admin.site.register(PrivateMessage)
admin.site.register(Participant)
admin.site.register(Friend)
admin.site.register(Notification)
admin.site.register(GroupInvite)
admin.site.register(GroupRequest)