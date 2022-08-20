from django.urls import path
from . import views

app_name = 'main'

urlpatterns = [
    path('', views.index_view, name='index'),
    path('lookup/', views.lookup_view, name='lookup'),
    path('friends/', views.friends_view, name='friends'),
    path('rooms/', views.rooms_view, name='rooms'),
    path('chat/<int:slug>/', views.private_chat_view, name='private_chat'),
    path('groups/', views.groups_view, name='groups_view'),
    path('group/<int:slug>/', views.group_chat_view, name="group_chat"),
    path('group/<int:slug>/<str:invite_token>', views.group_chat_view, name="group_chat")
]
