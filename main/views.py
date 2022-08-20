from django.http import HttpResponse, JsonResponse
from django.db.models import Q
from django.urls import reverse
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required

import json
import uuid
from . import forms
from . import models
from accounts import models as ac_models

_200 = {'status': 200, 'message': 'Success'}
_404 = {'status': 404, 'message': 'Not Found'}
_403 = {'status': 403, 'message': 'Forbidden'}

def form_Context(user):
    password_change_form = forms.CustomPasswordChangeForm(user)
    group_create_form = forms.GroupCreationForm(initial={'bio': ''}, auto_id='id_for_%s')

    profile_update_form = forms.ProfileUpdateForm(initial={
        'username': user.username,
        'email': user.email,
        'bio': user.bio,
        'thumb': user.thumb
    })

    data = {
        'password_change_form': password_change_form,
        'group_create_form': group_create_form,
        'profile_update_form': profile_update_form
    }

    return data

def view_Context(user):
    private_rooms = models.PrivateRoom.objects.filter(Q(initiator=user)|Q(receiver=user))
    group_rooms = models.GroupRoom.objects.filter(participant__user=user)
    friends = models.Friend.objects.filter(userRoom__owner=user, is_friend=True)
    notifications = models.Notification.objects.filter(userRoom__owner=user)

    friend_requests = models.Friend.objects.filter(userRoom__owner=user, is_friend=False)
    group_invites = models.GroupInvite.objects.filter(user=user, followed=False)

    data = {
        'private_rooms': private_rooms,
        'group_rooms': group_rooms,
        'friends': friends,
        'notifications': notifications,
        'friend_requests': friend_requests,
        'group_invites': group_invites
    }

    return data

@login_required(login_url='accounts:signin')
def index_view(request):
    user = request.user
    view_context = view_Context(user)
    form_context = form_Context(user)

    group_create_form = form_context['group_create_form']
    profile_update_form = form_context['profile_update_form']
    password_change_form = form_context['password_change_form']

    if request.method == "POST":
        if request.POST.get('create-group'):
            group_create_form = forms.GroupCreationForm(request.POST, request.FILES)

            if group_create_form.is_valid():
                user = request.user
                group = group_create_form.save(commit=False)
                group.owner = user
                group.save()
                room_id = group.id
                participant = models.Participant.objects.create(group_room=group, user=user, is_admin=True)
                return redirect(reverse('main:group_chat', args=(room_id,)))

        elif request.POST.get('update-profile'):
            profile_update_form = forms.ProfileUpdateForm(request.POST, request.FILES, instance=request.user)

            if profile_update_form.is_valid():
                profile_update_form.save()
                return redirect('main:index')

        elif request.POST.get('change-password'):
            password_change_form = forms.CustomPasswordChangeForm(data=request.POST, user=request.user)

            if password_change_form.is_valid():
                password_change_form.save()
                return redirect('main:index')
    else:
        pass

    view_context.update({
        'group_create_form': group_create_form,
        'profile_update_form': profile_update_form,
        'password_change_form': password_change_form,
    })

    return render(request, 'main/home.html', view_context)

@login_required(login_url='accounts:signin')
def private_chat_view(request, slug):
    user = request.user
    view_context = view_Context(user)
    form_context = form_Context(user)
    view_context.update(form_context)

    try:
        private_room = models.PrivateRoom.objects.get(Q(initiator=user)|Q(receiver=user), id=slug)
    except models.PrivateRoom.DoesNotExist:
        return redirect('main:index')

    messages = models.PrivateMessage.objects.filter(private_room=private_room)[:50]
    view_context.update({
        'private_room': private_room,
        'messages': messages
    })

    return render(request, 'main/private_chat.html', view_context)

@login_required(login_url='accounts:signin')
def group_chat_view(request, slug, invite_token=None):
    user = request.user
    view_context = view_Context(user)
    form_context = form_Context(user)
    view_context.update(form_context)

    try:
        group_room = models.GroupRoom.objects.get(id=slug)

        if invite_token:
            try:
                invite = models.GroupInvite.objects.get(user=user, group_room=group_room, invite_token=invite_token)
                try:
                    models.Participant.objects.get(user=user, group_room=group_room)
                except models.Participant.DoesNotExist:
                    models.Participant.objects.create(user=user, group_room=group_room)
                try:
                    group_request = models.GroupRequest.objects.get(user=user, group_room=group_room)
                    group_request.delete()
                except models.GroupRequest.DoesNotExist:
                    pass
                invite.delete()
            except models.GroupInvite.DoesNotExist:
                return redirect(reverse('main:group_chat', args=(group_room.id,)))

        try:
            participant = models.Participant.objects.get(group_room=group_room, user=user)
        except models.Participant.DoesNotExist:
            return redirect('main:index')

    except models.GroupRoom.DoesNotExist:
        return redirect('main:index')

    if participant.is_admin:
        group_update_form = forms.GroupCreationForm(initial={
            'name': group_room.name,
            'bio': group_room.bio,
            'room_type': group_room.room_type,
            'thumb': group_room.thumb
        }, auto_id='id_update_%s')
    else:
        group_update_form = None

    if request.method == 'POST':
        if request.POST.get('add-members'):
            if participant.is_admin:
                new_participants = request.POST.getlist('new_participant')
                for new_participant in new_participants:
                    try:
                        new_participant_user = ac_models.User.objects.get(username=new_participant)
                    except ac_models.User.DoesNotExist:
                        continue
                    try:
                        models.GroupInvite.objects.get(user=new_participant_user, group_room=group_room)
                        continue
                    except models.GroupInvite.DoesNotExist:
                        models.GroupInvite.objects.create(user=new_participant_user, group_room=group_room, initiator=user)

        elif request.POST.get('update-group'):
            group_update_form = forms.GroupCreationForm(request.POST, request.FILES, instance=group_room)
            if group_update_form.is_valid():
                group_update_form.save()
                return redirect(reverse('main:group_chat', args=(group_room.id,)))

    participants = models.Participant.objects.filter(group_room=group_room)[0:30]
    participants_usernames = list(ac_models.User.objects.filter(participant__group_room=group_room).values_list('username', flat=True))
    group_requests = models.GroupRequest.objects.filter(group_room=group_room, approved=False)
    messages = models.GroupMessage.objects.filter(group_room=group_room)[:50]

    view_context.update({
        'group_room': group_room,
        'participant': participant,
        'participants': participants,
        'group_requests': group_requests,
        'participants_usernames': participants_usernames,
        'group_update_form': group_update_form,
        'messages': messages
    })

    return render(request, 'main/group_chat.html', view_context)

@login_required(login_url='accounts:signin')
def rooms_view(request):
    context = request.GET['context']
    friend_username = request.GET['username']

    user = request.user
    friend = ac_models.User.objects.get(username=friend_username)

    if (context == 'create'):
        try:
            private_room = models.PrivateRoom.objects.get(initiator=user, receiver=friend)
            return redirect(reverse('main:private_chat', args=(private_room.id,)))

        except models.PrivateRoom.DoesNotExist:
            private_room = models.PrivateRoom.objects.create(initiator=user, receiver=friend)
            return redirect(reverse('main:private_chat', args=(private_room.id,)))

@login_required(login_url='accounts:signin')
def groups_view(request):
    context = request.GET['context']
    group_id = request.GET['group']
    user = request.user
    try:
        group_room = models.GroupRoom.objects.get(id=group_id)
    except:
        return JsonResponse(_404)

    if (context == 'join'):
        try:
            request = models.GroupRequest.objects.get(user=user, group_room=group_room)
            return JsonResponse(_200)

        except models.GroupRequest.DoesNotExist:
            models.GroupRequest.objects.create(user=user, group_room=group_room)
            return JsonResponse(_200)

    elif (context == 'cancel'):
        request = models.GroupRequest.objects.get(user=user, group_room=group_room)
        request.delete()

        return JsonResponse(_200)

    elif (context == 'leave'):
        participant = models.Participant.objects.get(user=user, group_room=group_room)
        participant.delete()

        no_participants = models.Participant.objects.filter(group_room=group_room).count()
        if no_participants == 1:
            group_room.delete()

        return JsonResponse(_200)

    elif (context == 'block'):
        participant = models.Participant.objects.get(user=user, group_room=group_room)
        participant.has_blocked_group = True
        participant.save()

        return JsonResponse(_200)

    elif (context == 'unblock'):
        participant = models.Participant.objects.get(user=user, group_room=group_room)
        participant.has_blocked_group = False
        participant.save()

        return JsonResponse(_200)

    elif (context == 'delete-participant'):
        participant_username = request.GET['username']
        participant = models.Participant.objects.get(user__username=participant_username)
        admin_participant = models.Participant.objects.get(user=user)

        if admin_participant.is_admin:
            participant.delete()

            return JsonResponse(_200)
        else:
            return JsonResponse(_403)

    elif (context == 'confirm-request'):
        username = request.GET['username']
        group_id = request.GET['group']

        participant = models.Participant.objects.get(user=user, group_room=group_room)
        new_participant_user = ac_models.User.objects.get(username=username)
        group_request = models.GroupRequest.objects.get(user=new_participant_user, group_room=group_room)

        if participant.is_admin:
            try:
                models.Participant.objects.get(user=new_participant_user, group_room=group_room)
            except models.Participant.DoesNotExist:
                models.Participant.objects.create(user=new_participant_user, group_room=group_room)
            try:
                group_invite = models.GroupInvite.objects.get(user=new_participant_user, group_room=group_room)
                group_invite.delete()
            except models.GroupInvite.DoesNotExist:
                pass
            group_request.delete()

            return JsonResponse(_200)
        else:
            return JsonResponse(_403)

    elif (context == 'reject-request'):
        username = request.GET['username']
        group_id = request.GET['group']

        participant = models.Participant.objects.get(user=user, group_room=group_room)
        new_participant_user = ac_models.User.objects.get(username=username)
        group_request = models.GroupRequest.objects.get(user=new_participant_user, group_room=group_room)

        if participant.is_admin:
            group_request.delete()
            return JsonResponse(_200)
        else:
            return JsonResponse(_403)

@login_required(login_url='accounts:signin')
def friends_view(request):
    context = request.GET['context']
    friend_username = request.GET['username']

    user = request.user
    friend = ac_models.User.objects.get(username=friend_username)
    user_userRoom = models.UserRoom.objects.get(owner=user)
    friend_userRoom = models.UserRoom.objects.get(owner=friend)

    if (context == 'create'):
        try:
            models.Friend.objects.get(userRoom__owner=user, user=friend)
            return JsonResponse(_200)

        except models.Friend.DoesNotExist:
            uu_id = uuid.uuid4()
            models.Friend.objects.create(
                uu_id=uu_id,
                user=friend,
                initiator=user,
                userRoom=user_userRoom,
            )
            models.Friend.objects.create(
                uu_id=uu_id,
                user=user,
                initiator=user,
                userRoom=friend_userRoom,
            )

            return JsonResponse(_200)

    try:
        relation = models.Friend.objects.get(userRoom=user_userRoom, user=friend)
    except models.Friend.DoesNotExist:
        return JsonResponse(_404)

    if (context == 'confirm'):

        if relation.userRoom.owner.username == user.username:
            friends = models.Friend.objects.filter(uu_id=relation.uu_id)
            friends.update(is_friend=True)

            models.Notification.objects.create(
                userRoom=friend_userRoom,
                initiator=user,
                _type='general',
                headline='%s'%(user.username),
                message='Accepted your friend request',
            )

            return JsonResponse(_200)
        else:
            return JsonResponse(_403)

    elif (context == 'cancel'):

        if relation.initiator.username == user.username:
            friends = models.Friend.objects.filter(uu_id=relation.uu_id)
            friends.delete()
            return JsonResponse(_200)
        else:
            return JsonResponse(_403)

    elif (context == 'reject'):
        friends = models.Friend.objects.filter(uu_id=relation.uu_id)
        friends.delete()

        return JsonResponse(_200)

    elif (context == 'terminate'):
        friends = models.Friend.objects.filter(uu_id=relation.uu_id)
        friends.delete()

        return JsonResponse(_200)

    elif (context == 'block'):
        relation.is_blocked = True
        relation.save()

        return JsonResponse(_200)

    elif (context == 'unblock'):
        relation.is_blocked = False
        relation.save()

        return JsonResponse(_200)

@login_required(login_url='accounts:signin')
def lookup_view(request):

    context = request.GET['context']

    if (context == 'userl'):
        username = request.GET['username']
        users = list(ac_models.User.objects.filter(username__icontains=username)[:20])

        if request.user in users:
            users.remove(request.user)

        data = []
        for user in users:
            if user.has_dp:
                data.append({'username': user.username, 'thumb': user.thumb.url})
            else:
                data.append({'username': user.username, 'thumb': None})
        return JsonResponse(data, safe=False)

    elif (context == 'userld'):
        username = request.GET['username']
        try:
            user = ac_models.User.objects.get(username=username)
            data = {
                'status': 200,
                'username': user.username,
                'thumb': user.thumb.url if user.has_dp else None
            }
            return JsonResponse(data)

        except ac_models.User.DoesNotExist:
            return JsonResponse(_404)

    elif (context == 'userdl'):
        username = request.GET['username']
        try:
            user = ac_models.User.objects.get(username=username)
            friend = models.Friend.objects.get(userRoom__owner=request.user, user=user)

            data = {
                'status': 200,
                'username': user.username,
                'email': user.email,
                'bio': user.bio,
                'initiator': friend.initiator.username,
                'is_friend': friend.is_friend,
                'is_blocked': friend.is_blocked,
                'thumb': user.thumb.url if user.has_dp else None
            }
            return JsonResponse(data)

        except models.Friend.DoesNotExist:
            data  = {
                'status': 200,
                'username': user.username,
                'email': user.email,
                'bio': user.bio,
                'initiator': None,
                'is_friend': None,
                'thumb': user.thumb.url if user.has_dp else None
            }
            return JsonResponse(data)

    elif (context == 'groupl'):
        group_name = request.GET['group']
        groups = models.GroupRoom.objects.filter(name__icontains=group_name)[:20]

        data = []
        for group in groups:
            if group.has_dp:
                data.append({'id': group.id, 'name': group.name, 'thumb': group.thumb.url})
            else:
                data.append({'id': group.id, 'name': group.name, 'thumb': None})

        return JsonResponse(data, safe=False)

    elif (context == 'groupdl'):
        group_id = request.GET['group']
        group = models.GroupRoom.objects.get(id=group_id)
        no_participants = models.Participant.objects.filter(group_room=group).count()

        try:
            participant = models.Participant.objects.get(user=request.user, group_room=group)
        except models.Participant.DoesNotExist:
            participant = None
        try:
            group_request = models.GroupRequest.objects.get(user=request.user, group_room=group)
        except models.GroupRequest.DoesNotExist:
            group_request = None

        if participant:
            if participant.has_blocked_group == False:
                has_blocked_group = False
            elif participant.has_blocked_group == True:
                has_blocked_group = True
        else:
            has_blocked_group = None

        data = {
            'status': 200,
            'id': group.id,
            'name': group.name,
            'owner': group.owner.username,
            'bio': group.bio,
            'thumb': group.thumb.url if group.has_dp else None,
            'is_participant': True if participant else False,
            'has_blocked_group': has_blocked_group,
            'group_request': True if group_request else False,
            'no_participants': no_participants
        }

        return JsonResponse(data)

    elif (context == 'friends'):
        friends = models.Friend.objects.filter(userRoom__owner=request.user, is_friend=True)[:30]

        data = []
        for friend in friends:
            if friend.user.has_dp:
                data.append({'username': friend.user.username, 'thumb': friend.user.thumb.url})
            else:
                data.append({'username': friend.user.username, 'thumb': None})

        return JsonResponse(data, safe=False)

    elif (context == 'groups'):
        groups = models.GroupRoom.objects.filter(participant__user=request.user)[:30]

        data = []
        for group in groups:
            if group.has_dp:
                data.append({'id': group.id, 'name': group.name, 'thumb': group.thumb.url})
            else:
                data.append({'id': group.id, 'name': group.name, 'thumb': None})

        return JsonResponse(data, safe=False)

    elif (context == 'participants'):
        group_id = request.GET['group']
        
        if request.GET.get('next'):
            next_page = int(request.GET['next'])
        else:
            next_page = None
        if request.GET.get('all'):
            participants = models.Participant.objects.filter(group_room__id=group_id)
        else:
            if next_page:
                participants = models.Participant.objects.filter(group_room__id=group_id)[next_page*5:(next_page*5)+5]
            else:
                participants = models.Participant.objects.filter(group_room__id=group_id)[0:5]

        user_participant = models.Participant.objects.get(user=request.user, group_room__id=group_id)
        data = {
            'user_participant': {'username': user_participant.user.username, 'is_admin': user_participant.is_admin},
            'participants': [],
            'total_participants': models.Participant.objects.filter(group_room__id=group_id).count()
        }

        for participant in participants:
            if participant.user.has_dp:
                data['participants'].append({'username': participant.user.username, 'thumb': participant.user.thumb.url, 'is_admin': participant.is_admin})
            else:
                data['participants'].append({'username': participant.user.username, 'thumb': None, 'is_admin': participant.is_admin})

        return JsonResponse(data, safe=False)
