from client_side_image_cropping import ClientsideCroppingWidget
from django.contrib.auth.forms import PasswordChangeForm
from django.core.exceptions import ValidationError
from django import forms
from accounts.models import User
from .models import GroupRoom

class CustomPasswordChangeForm(PasswordChangeForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['old_password'].widget.attrs.update({'placeholder': 'Old Password'})
        self.fields['new_password1'].widget.attrs.update({'placeholder': 'New Password'})
        self.fields['new_password2'].widget.attrs.update({'placeholder': 'Confirm Password'})

class ProfileUpdateForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['thumb', 'username', 'email', 'bio']

        widgets = {
            'thumb': ClientsideCroppingWidget(
                width=400,
                height=400,
                preview_width=50,
                preview_height=50,
                format='jpeg',
                quality=100,
            ),
            'username': forms.TextInput(attrs={'placeholder': 'Username'}),
            'email': forms.EmailInput(attrs={'placeholder': 'Email'}),
            'bio': forms.Textarea(attrs={'placeholder': 'Bio'}),
        }

class GroupCreationForm(forms.ModelForm):
    class Meta:
        model = GroupRoom
        fields = ['thumb', 'name', 'room_type', 'bio']
        labels = {
            'name': ('Group Name')
        }
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'Group Name'}),
            'bio': forms.Textarea(attrs={'placeholder': 'Group Bio', 'required': False, 'cols': 0, 'rows': 0}),
            'thumb': ClientsideCroppingWidget(
                width=400,
                height=400,
                preview_width=50,
                preview_height=50,
                format='jpeg',
                quality=100,
            ),
        }

class AdminGroupCreationForm(forms.ModelForm):
    class Meta:
        model = GroupRoom
        fields = '__all__'
        widgets = {
            'thumb': ClientsideCroppingWidget(
                width=400,
                height=400,
                preview_width=50,
                preview_height=50,
                format='jpeg',
                quality=100,
            ),
        }
