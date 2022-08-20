from django.urls import reverse
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from . import forms

def signup_view(request):
    if request.method == 'POST':
        form = forms.CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('main:index')
    else:
        form = forms.CustomUserCreationForm()

    return render(request, 'accounts/signup.html', {'form': form})

def signin_view(request):
    if request.method == 'POST':
        form = forms.CustomAuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('main:index')
    else:
        form = forms.CustomAuthenticationForm()

    return render(request, 'accounts/signin.html', {'form': form})

def logout_view(request):
    if request.method == 'POST':
        logout(request)
        return redirect('accounts:signin')