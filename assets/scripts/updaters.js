import {dispModel, handleProfile, handleGroup} from './app.js';

const friendsCtn = $('#friends-nav div[section="friends"]');
const groupsCtn = $('#groups-nav div[section="groups"]');
const groupAddFriendsCtn = $('#main-right #add-members form .list-group-1');

let group;
groupAddFriendsCtn ? group = JSON.parse($('#js_room').innerText) : null;

function updateFriendsCtn() {
    //The added 1 is to account for the template
    if (Array.from($$(friendsCtn, '.contact')).length <= 30 + 1) {
        fetch('/channels/lookup/?context=friends').then((response)=>{
            return response.json();
        }).then((data)=>{
            Array.from($$(friendsCtn, '.contact:not(.contact:first-of-type)')).forEach(contact=>contact.remove());
            let template = $(friendsCtn, '.contact:first-of-type');
            
            for (let friend_data of data) {  
                let newFriend = template.cloneNode(true);
                if (friend_data.thumb) {
                    $(newFriend, '.avatar').innerHTML = `<img src=${friend_data.thumb} alt=thumb>`;
                } else {
                    $(newFriend, '.avatar').innerText = friend_data.username.slice(0,1).toUpperCase();
                }
                newFriend.style.display = '';
                $(newFriend, '.name').innerText = friend_data.username;
                let actionBtn = $(newFriend, 'button.expand-model');
                actionBtn.setAttribute('user', friend_data.username);
                actionBtn.addEventListener('click', dispModel);
                actionBtn.addEventListener('click', handleProfile);

                friendsCtn.appendChild(newFriend);
            }

            if (groupAddFriendsCtn) {
                updateGroupAddFriendsCtn(data);
            }
        });
    }
}

function updateGroupAddFriendsCtn(data) {

    if (!data) {
        fetch(`/channels/lookup?context=friends`).then((response)=>{
            return response.json();
        }).then((data)=>{
            updateCtn(data);
        });
    } else {
        updateCtn(data);
    }

    function updateCtn(data) {
        fetch(`/channels/lookup/?context=participants&group=${group}`).then((response)=>{
            return response.json();
        }).then((participants_data)=>{
            let group_participants = participants_data.participants.map((value)=>value.username)
            let gp_friend_template = $(groupAddFriendsCtn, '.list-item:first-of-type');
            $$(groupAddFriendsCtn, '.list-item:not(.list-item:first-of-type)').forEach(item=>item.remove());
            for (let friend_data of data) {
                if (group_participants.indexOf(friend_data.username) == -1) {
                    let new_friend = gp_friend_template.cloneNode(true);
                    new_friend.style.display = '';
    
                    if (friend_data.thumb) {
                        $(new_friend, '.avatar').innerHTML = `<img src=${friend_data.thumb} alt=thumb>`;
                    } else {
                        $(new_friend, '.avatar').innerText = friend_data.username.slice(0,1).toUpperCase();
                    }
                    $(new_friend, '.info h5').innerText = friend_data.username;
                    $(new_friend, 'input[type="checkbox"]').value = friend_data.username;
    
                    groupAddFriendsCtn.appendChild(new_friend);
                }
            }
        });
    }
}

function updateGroupsCtn() {
    if ($$(groupsCtn, '.contact').length <= 30 + 1) {
        fetch('/channels/lookup/?context=groups').then((response)=>{
            return response.json();
        }).then((data)=>{
            $$(groupsCtn, '.contact:not(.contact:first-of-type)').forEach(item=>item.remove());
            let template = $(groupsCtn, '.contact:first-of-type');
            for (let group_data of data) {
                let newGroup = template.cloneNode(true);
                newGroup.style.display = '';

                if (group_data.thumb) {
                    $(newGroup, '.avatar').innerHTML = `<img src=${group_data.thumb} alt=thumb>`;
                } else {
                    $(newGroup, '.avatar').innerText = group_data.name.slice(0,1).toUpperCase(); 
                }

                $(newGroup, '.name').innerText = group_data.name;
                let actionBtn = $(newGroup, 'button.expand-model')
                actionBtn.setAttribute('id', group_data.id);
                actionBtn.addEventListener('click', dispModel);
                actionBtn.addEventListener('click', handleGroup);

                groupsCtn.appendChild(newGroup);
            }
        });
    }
}

export {updateFriendsCtn, updateGroupsCtn, updateGroupAddFriendsCtn};