from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('', views.signin_view, name='signin'),
    path('signup/', views.signup_view, name='signup'),
    path('logout/', views.logout_view, name='logout'),
]
