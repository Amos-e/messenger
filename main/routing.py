from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/channels/group/(?P<room_id>\w+)/$',consumers.GroupChatConsumer.as_asgi()),
    re_path(r'ws/channels/private/(?P<room_id>\w+)/$',consumers.PrivateChatConsumer.as_asgi()),
    re_path(r'ws/channels/global/(?P<room_id>\w+)/$',consumers.GlobalConsumer.as_asgi()),
]