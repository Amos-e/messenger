import json
import datetime
from . import models
from django.utils import timezone
from channels.db import database_sync_to_async
from django.db.models import Q
from channels.generic.websocket import AsyncWebsocketConsumer

class GroupChatConsumer(AsyncWebsocketConsumer):
    @database_sync_to_async
    def is_participant(self, group_id, username):
        return models.Participant.objects.get(group_room__id=group_id, user__username=username).id

    @database_sync_to_async
    def save_message(self, user, group_room_id, message):
        group_room = models.GroupRoom.objects.get(id=group_room_id)
        models.GroupMessage.objects.create(user=user, group_room=group_room, message=message)

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = 'group_chat_%s' % self.room_id
        self.user = str(self.scope['user'])

        if self.scope['user'].is_authenticated:
            try:
                await self.is_participant(int(self.room_id), self.user)
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                await self.accept()
            except models.Participant.DoesNotExist:
               pass

    async def disconnect(self, close_code):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_signal',
                'user': self.user,
                'status': False
            }
        )
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        context = data['context']

        if context == "message":
            message = data['message']
            user = self.user

            date_time = timezone.now()
            date = str(date_time.strftime("%x"))
            time = str(date_time.strftime("%X"))

            await self.save_message(self.scope['user'], self.room_id, message)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'user': user,
                    'thumb': self.scope['user'].thumb.url if self.scope['user'].has_dp else None,
                    'date': date,
                    'time': time
                }
            )

        if context == 'signal':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_signal',
                    'user': self.user,
                    'status': True
                }
            )

        if context == 'echo':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_echo',
                    'user': self.user,
                    'status': True
                }
            )

        if context == 'update':
            username = data['username']
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_update',
                    'user': self.user,
                    'new_participant': username, 
                    'status': True
                }
            )

    async def chat_message(self, event):
        message = event['message']
        user = event['user']
        thumb = event['thumb']
        date = event['date']
        time = event['time']

        await self.send(
            text_data = json.dumps({
                'context': 'message',
                'message': message,
                'user': user,
                'thumb': thumb,
                'date': date,
                'time': time
            })
        )

    async def chat_signal(self, event):
        user = event['user']
        status = event['status']

        await self.send(
            text_data = json.dumps({
                'context': 'signal',
                'user': user,
                'status': status
            })
        )
        if status == False:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_echo',
                    'user': user,
                    'status': status
                }
            )

    async def chat_echo(self, event):
        user = event['user']
        status = event['status']

        await self.send(
            text_data = json.dumps({
                'context': "echo",
                'user': user,
                'status': status
            })
        )

    async def chat_update(self, event):
        user = event['user']
        status = event['status']
        new_participant = event['new_participant']

        await self.send(
            text_data = json.dumps({
                'context': 'update',
                'user': user,
                'new_participant': new_participant,
                'status': status
            })
        )

class PrivateChatConsumer(AsyncWebsocketConsumer):
    @database_sync_to_async
    def is_participant(self, private_id, username):
        return models.PrivateRoom.objects.get(Q(initiator__username=username)|Q(receiver__username=username), id=private_id)

    @database_sync_to_async
    def save_message(self, user, private_room_id, message):
        private_room = models.PrivateRoom.objects.get(id=private_room_id)
        models.PrivateMessage.objects.create(user=user, private_room=private_room, message=message)

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = 'private_chat_%s' % self.room_id
        self.user = str(self.scope['user'])

        if self.scope['user'].is_authenticated:
            try:
                await self.is_participant(int(self.room_id), self.user)
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                await self.accept()
            except models.PrivateRoom.DoesNotExist:
                pass

    async def disconnect(self, close_code):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_signal',
                'user': self.user,
                'status': False
            }
        )

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)

        if data['context'] == 'message':
            message = data['message']
            user = self.user

            time = datetime.datetime.now()
            time = str(time.strftime("%x"))

            await self.save_message(self.scope['user'], int(self.room_id), message)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'user': user,
                    'time': time
                }
            )

        if data['context'] == 'signal':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_signal',
                    'user': self.user,
                    'status': True
                }
            )

        if data['context'] == 'echo':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_echo',
                    'user': self.user,
                    'status': True
                }
            )


    async def chat_message(self, event):
        message = event['message']
        user = event['user']
        time = event['time']
        await self.send(
            text_data = json.dumps({
                'context': 'message',
                'message': message,
                'user': user,
                'time': time
            })
        )

    async def chat_signal(self, event):
        user = event['user']
        status = event['status']
        await self.send(
            text_data = json.dumps({
                'context': 'signal',
                'user': user,
                'status': status
            })
        )
        if status == False:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_echo',
                    'user': user,
                    'status': status
                }
            )

    async def chat_echo(self, event):
        user = event['user']
        status = event['status']
        await self.send(
            text_data = json.dumps({
                'context': 'echo',
                'user': user,
                'status': status
            })
        )

class GlobalConsumer(AsyncWebsocketConsumer):
    @database_sync_to_async
    def save_client(self, channel_name):
        models.Client.objects.create(channel_name=channel_name)

    @database_sync_to_async
    def discard_client(self, channel_name):
        models.Client.objects.get(channel_name=channel_name).delete()

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = 'global_%s' % self.room_id
        self.user = self.scope['user']

        if self.scope['user'].is_authenticated:
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.save_client(self.channel_name)
            await self.accept()

    async def disconect(self, close_code):
        await self.discard_client(self.channel_name)
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        username = data['username']

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'global_message',
                'username': username
            }
        )

    async def global_message(self, event):
        username = event['username']
        await self.send(
            text_data = json.dumps({
                'username': username
            })
        )
