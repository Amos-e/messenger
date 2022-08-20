import { updateFriendsCtn, updateGroupsCtn } from "./updaters.js";

// document.body.style.width = `${screen.width}px`;
const js_user = JSON.parse($('#js_user').textContent);
const gpImgField = $('#group-add-model input.dcsic_file_input');
let gpImgBtn = $('#group-add-model label[role="img-upload"]');
gpImgBtn.addEventListener('click', ()=>{
    gpImgField.click();
});

const profileImgField = $('#settings-nav input.dcsic_file_input');
const profileImgBtn = $('#settings-nav label[role="img-upload"]');
profileImgBtn.addEventListener('click', ()=>{
    profileImgField.click();
});

const friendNavToggler = Array.from($$('#friends-nav .toggle button'));
const friendNavSections = Array.from($$('#friends-nav .body'));

friendNavToggler.forEach((toggler) => {
    toggler.addEventListener('click', () => {
        let index = friendNavToggler.indexOf(toggler);
        friendNavToggler.forEach(btn=>btn.classList.remove('active-btn'));
        friendNavSections.forEach(section=>section.classList.remove('active-section'));
        toggler.classList.add('active-btn');
        friendNavSections[index].classList.add('active-section');
    });
});

const groupsNavToggler = Array.from($$('#groups-nav .toggle button'));
const groupsNavSections = Array.from($$('#groups-nav .body'));

groupsNavToggler.forEach(function(toggler){
    toggler.addEventListener('click', () => {
        let index = groupsNavToggler.indexOf(toggler);
        groupsNavToggler.forEach(btn=>btn.classList.remove('active-btn'));
        groupsNavSections.forEach(section=>section.classList.remove('active-section'));
        toggler.classList.add('active-btn');
        groupsNavSections[index].classList.add('active-section');
    });
});

const nav1Links = Array.from($$('#nav1 .navigation a'));
const nav2Sections = Array.from($$('#navs-container > nav'));

nav1Links.forEach(function(navLink){
    navLink.addEventListener('click', () => {
        $('#main').style.display = 'none';
        $('#navs-container').style.display = 'block';
        Array.from($$('#nav1 .navigation a')).forEach(item=>item.classList.remove('active'));
        navLink.classList.add('active');
        let ref = navLink.getAttribute('ref');
        nav2Sections.forEach(section=>section.style.cssText = "display: none !important;");

        if ($(`#${ref}`)) {
            $(`#${ref}`).style.cssText = 'display: block !important;';
        }
        
        if (ref == 'friends-nav') {
            updateFriendsCtn();
        } else if (ref == 'groups-nav') {
            updateGroupsCtn();
        }
    });
});

function updateFriendCtn() {
    fetch('/channels/lookup/?context=friends-nav').then((response)=>{
        return response.json();
    }).then((data)=>{
        let friendCtn = $('#friends-nav div[section="friends"]');
        let friends = Array.from($$('#friends-nav div[section="friends"] .contact .name'));
        localFriends = friends.map((friend)=>{return friend.textContent});
        //Removing the first element since it's always the template
        localFriends.splice(0,1);
        let remoteFriends = data.map((value, index, array)=>{return [value.username, index]});
        
        //Updates local friends list with the remote list - adds new friends
        remoteFriends.forEach(function(friend){
            if (localFriends.indexOf(friend[0]) == -1) {
                let contact_template = $('#friends-nav div[section="friends"] .contact');
                let contactParent = contact_template.parentElement;

                let newFriend = contact_template.cloneNode(true);
                newFriend.style.display = '';
                let friend_data = data[friend[1]];

                if (friend_data.thumb != null) {
                    $(newFriend, '.avatar').innerHTML = `<img src=${friend_data.thumb} alt=thumb>`;
                } else {
                    $(newFriend, '.avatar').innerText = friend_data.username.slice(0,1).toUpperCase();
                }

                $(newFriend, '.name').innerText = friend_data.username;
                let actionBtn = $(newFriend, 'button.expand-model');
                actionBtn.setAttribute('user', friend_data.username);
                actionBtn.addEventListener('click', dispModel);
                actionBtn.addEventListener('click', handleProfile); 

                contactParent.appendChild(newFriend);
            }
            
            let index = localFriends.indexOf(friend[0]);
            localFriends.splice(index, 1);
        });
        //Removes unfriended users
        localFriends.forEach((localFriend)=>{
            $(friendCtn, `button[user=${localFriend}]`).parentElement.parentElement.remove();
        });
    })
}

//MODEL HANDLING
const modelCtn = $('#models');
const closeModalBtns = $$('#models button[role="close-modal"]');
let expandModelBtns = Array.from($$('button.expand-model'));

expandModelBtns.forEach((btn)=>{
    btn.addEventListener('click', dispModel);
});

closeModalBtns.forEach((btn)=>{
    btn.addEventListener('click', hideModel);
});

modelCtn.addEventListener('click', (event) => {
    if (event.target == modelCtn) {
        closeModalBtns.forEach(btn=>btn.click());
    }
});

function dispModel() {
    let model = $(`#${this.getAttribute('model')}`);

    model.onanimationend = null;
    modelCtn.style.cssText = 'display: block';
    model.style.cssText = 'display: block';

    modelCtn.classList.remove('fade-out')
    model.classList.remove('float-out');

    modelCtn.classList.add('fade-in')
    model.classList.add('float-in');
}

function hideModel() {
    let modelId = this.getAttribute('model');
    let model = $(`#${modelId}`);

    modelCtn.classList.remove('fade-in')
    model.classList.remove('float-in');

    modelCtn.classList.add('fade-out')
    model.classList.add('float-out');

    model.onanimationend = function() {
        modelCtn.style.cssText = 'display: none';
        model.style.cssText = 'display: none';

        if (modelId == 'group-add-model') {
            $(model, '.dcsic_wrapper input[type="hidden"]').value = '';
            $(model, '.dcsic_wrapper img').src = '';
            $(model, '.dcsic_wrapper img').style.display = 'none';
            $('.file-field .icon').style.display = '';
        }
        else if (modelId == 'group-model') {
            $(model, '.info .avatar').innerHTML = '';
            $(model, '.info .username').innerHTML = '';
            $(model, '.info .bio').innerHTML = '';
        }
    }
}

//FIND FRIEND DETAILS
const profileCtn = $('#models #profile-model');
let openProfileBtns = Array.from($$('button[role="view-profile"]'));

openProfileBtns.forEach((btn)=>{
    btn.addEventListener('click', handleProfile);
});

function handleProfile() {
    let username = this.getAttribute('user');
    
    fetch(`/channels/lookup/?context=userdl&username=${username}`).then((response)=>{
        return response.json();
    }).then((data)=>{
        if (data.status == 200 ) {
            
            if (data.thumb != null) {
                $(profileCtn, '.avatar').innerHTML = `<img src=${data.thumb} alt=thumb>`;
            } else {
                $(profileCtn, '.avatar').textContent = data.username.slice(0,1).toUpperCase();
            }

            $(profileCtn, '.username').innerText = data.username;
            $(profileCtn, '.bio').innerText = data.bio;
            $(profileCtn, '.user-detail .email').innerText = data.email;

            let oldRequestBtn = $(profileCtn, '#send-friend-request');
            let requestBtn = oldRequestBtn.cloneNode(true);
            oldRequestBtn.replaceWith(requestBtn);
            requestBtn.href = 'javascript:void(0)';

            if ($(profileCtn, '#reject-friend-request')) {
                $(profileCtn, '#reject-friend-request').remove();
            }

            function sendFriendRequest() {
                fetch(`/channels/friends/?context=create&username=${data.username}`).then((response)=>{
                    return response.json()
                }).then((data)=>{
                    if (data.status == 200) {
                        requestBtn.innerText = 'Cancel Request';
                        requestBtn.removeEventListener('click', sendFriendRequest);
                        requestBtn.addEventListener('click', cancelFriendRequest);
                    }
                });
            }
            function cancelFriendRequest() {
                fetch(`/channels/friends/?context=cancel&username=${data.username}`).then((response)=>{
                    return response.json()
                }).then((data)=>{
                    if (data.status == 200) {
                        requestBtn.innerText = 'Send Request';
                        requestBtn.removeEventListener('click', cancelFriendRequest);
                        requestBtn.addEventListener('click', sendFriendRequest);
                    }
                });
            }
            function confirmFriendRequest() {
                fetch(`/channels/friends/?context=confirm&username=${data.username}`).then((response)=>{
                    return response.json();
                }).then((data)=>{
                    if (data.status == 200) {
                        rejectBtn.remove();
                        requestBtn.innerText = 'Unfriend';
                        requestBtn.removeEventListener('click', confirmFriendRequest);
                        requestBtn.addEventListener('click', terminateFriendShip);
                        updateFriendsCtn();
                    }
                });
            }
            function rejectFriendRequest() {
                fetch(`/channels/friends/?context=reject&username=${data.username}`).then((response)=>{
                    return response.json();
                }).then((data)=>{
                    if (data.status == 200) {
                        if (rejectBtn) {
                            rejectBtn.remove();
                        }
                        requestBtn.innerText = 'Send Request';
                        requestBtn.removeEventListener('click', confirmFriendRequest);
                        requestBtn.addEventListener('click', sendFriendRequest);
                    }
                });
            }
            function terminateFriendShip() {
                fetch(`/channels/friends/?context=terminate&username=${data.username}`).then((response)=>{
                    return response.json();
                }).then((data)=>{
                    if (data.status == 200) {
                        requestBtn.innerText = 'Send Request';
                        requestBtn.removeEventListener('click', terminateFriendShip);
                        requestBtn.addEventListener('click', sendFriendRequest);
                        updateFriendsCtn();
                    }
                });
            }

            if (data.is_friend == null) {
                requestBtn.innerText = 'Send Request';
                requestBtn.addEventListener('click', sendFriendRequest);
            } 
            else if (data.is_friend == true) {
                requestBtn.innerText = 'Unfriend';
                requestBtn.addEventListener('click', terminateFriendShip);
            } 
            else if (data.is_friend == false) {
                if (js_user == data.initiator) {
                    requestBtn.innerText = 'Cancel Request';
                    requestBtn.addEventListener('click', cancelFriendRequest);
                } 
                else {
                    var rejectBtn = requestBtn.cloneNode(true);
                    rejectBtn.setAttribute('id', 'reject-friend-request');
                    requestBtn.innerText = 'Confirm Request';
                    rejectBtn.innerText = 'Reject Request';

                    requestBtn.addEventListener('click', confirmFriendRequest);
                    rejectBtn.addEventListener('click', rejectFriendRequest);

                    requestBtn.parentElement.insertBefore(
                        rejectBtn,
                        requestBtn.nextElementSibling
                    );
                }
            }
        
            $(profileCtn, '#message-user').href = `/channels/rooms/?context=create&username=${data.username}`;
            let oldBlockBtn = $(profileCtn, '#block-user');
            let blockBtnClone = oldBlockBtn.cloneNode(true);
            let blockBtn = blockBtnClone;
            oldBlockBtn.replaceWith(blockBtn);

            function blockUser() {
                fetch(`/channels/friends/?context=block&username=${data.username}`).then((response)=>{
                    return response.json();
                }).then((data)=>{
                    if (data.status == 200) {
                        blockBtn.innerText = 'Unblock';
                        blockBtn.removeEventListener('click', blockUser);
                        blockBtn.addEventListener('click', unBlockUser);
                    }
                })
            }

            function unBlockUser() {
                fetch(`/channels/friends/?context=unblock&username=${data.username}`).then((response)=>{
                    return response.json();
                }).then((data)=>{
                    if (data.status == 200) {
                        blockBtn.innerText = 'Block';
                        blockBtn.removeEventListener('click', unBlockUser);
                        blockBtn.addEventListener('click', blockUser);
                    }
                })
            }

            if (data.is_blocked == false) {
                blockBtn.innerText = 'Block';
                blockBtn.addEventListener('click', blockUser);
            } 
            else if (data.is_blocked == true) {
                blockBtn.innerText = 'Unblock';
                blockBtn.addEventListener('click', unBlockUser);
            }
            else {
                blockBtn.classList.add('hidden');
            }
        }
    });
}

// FIND FRIENDS
(function findFriends() {
    const section=$('#navs-container #friends-nav .body[section="find-friends"]');
    const input = $(section, 'input[role="find-friends"]');

    input.addEventListener('keyup', (event) => {
        if (event.keyCode == 13) {
            fetch(`/channels/lookup/?context=userl&username=${input.value}`).then((response)=>{
                return response.json();
            }).then((data)=>{    
                input.value = '';
                Array.from($$(section, '.contact')).forEach(item=>item.remove());
                for (let user of data) {
                    let div = document.createElement('div');
                    let button = document.createElement('button');

                    div.classList.add('contact');
                    button.classList.add('expand-model');
                    button.setAttribute('role', 'view-profile');
                    button.setAttribute('user', user.username);
                    button.setAttribute('model', 'profile-model');

                    button.innerHTML = button_template;
                    div.innerHTML = contact_template;

                    if (user.thumb != null) {
                        $(div, '.avatar').innerHTML = `<img src=${user.thumb}> alt=thumb`;
                    } else {
                        $(div, '.avatar').textContent = user.username.slice(0,1).toUpperCase();
                    }
        
                    $(div, '.name').textContent = user.username;
                    $(div, 'div:nth-child(3)').appendChild(button);

                    section.appendChild(div);
                    button.addEventListener('click', dispModel);
                    button.addEventListener('click', handleProfile);
                }
            });
        }
    });
})()



//FIND GROUPS
const groupCtn = $('#models #group-model');
let openGroupBtns = $$('button[role="view-group"]');

openGroupBtns.forEach((btn)=>{
    btn.addEventListener('click', handleGroup);
});

function handleGroup() {
    let group_id = this.getAttribute('id');
    fetch(`/channels/lookup/?context=groupdl&group=${group_id}`).then((response)=>{
        return response.json();
    }).then((data)=>{
        if (data.thumb == null) {
            $(groupCtn, '.avatar').innerText = data.name.slice(0,1).toUpperCase();

        } else {
            $(groupCtn, '.avatar').innerHTML = `<img src="${data.thumb}" alt="thumb">`;
        }

        $(groupCtn, '.username').innerText = data.name;
        $(groupCtn, '.bio').innerText = data.bio;
        $(groupCtn, 'p[data="owner"]').innerText = data.owner;
        $(groupCtn, 'p[data="participants-no"]').innerText = data.no_participants;

        let oldJoinBtn = $(groupCtn, '#join-group');
        let joinBtn = oldJoinBtn.cloneNode(true);
        joinBtn.href = 'javascript:void(0)';
        oldJoinBtn.replaceWith(joinBtn);

        let oldBlockBtn = $(groupCtn, '#block-group');
        if (!oldBlockBtn) {
            oldBlockBtn = document.createElement('a');
            oldBlockBtn.classList.add('block');
            oldBlockBtn.setAttribute('id', 'block-group');
            oldBlockBtn.innerText = 'Block';
            joinBtn.insertAdjacentElement('afterEnd', oldBlockBtn);
        }
        let blockBtn = oldBlockBtn.cloneNode(true);
        blockBtn.href = 'javascript:void(0)';
        oldBlockBtn.replaceWith(blockBtn);

        if (data.is_participant) {
            joinBtn.innerText = 'Leave Group';
            joinBtn.addEventListener('click', leaveGroup);
        } 
        else if (!data.is_participant && !data.group_request) {
            joinBtn.innerText = 'Join Group';
            joinBtn.addEventListener('click', joinGroup);
            if (blockBtn) {
                blockBtn.remove();
            }
        }

        if (data.group_request) {
            joinBtn.innerText = 'Cancel Request';
            joinBtn.addEventListener('click', cancelRequest);
            if (blockBtn) {
                blockBtn.remove();
            }
        }

        if (data.has_blocked_group == true) {
            blockBtn.innerText = 'Unblock';
            blockBtn.addEventListener('click', unBlockGroup);
        } 
        else if (data.has_blocked_group == false) {
            blockBtn.innerText = 'Block';
            blockBtn.addEventListener('click', blockGroup);
        }

        function joinGroup() {
            fetch(`/channels/groups/?context=join&group=${group_id}`).then((response)=>{
                return response.json();
            }).then((data)=>{
                if (data.status == 200) {
                    joinBtn.innerText = 'Cancel Request';
                    joinBtn.removeEventListener('click', joinGroup);
                    joinBtn.addEventListener('click', cancelRequest);
                }
            });
        }
        function cancelRequest() {
            fetch(`/channels/groups/?context=cancel&group=${group_id}`).then((response)=>{
                return response.json();
            }).then((data)=>{
                if (data.status == 200) {
                    joinBtn.innerText = 'Join Group';
                    joinBtn.removeEventListener('click', cancelRequest);
                    joinBtn.addEventListener('click', joinGroup);
                }
            });
        }
        function leaveGroup() {
            fetch(`/channels/groups/?context=leave&group=${group_id}`).then((response)=>{
                return response.json();
            }).then((data)=>{
                if (data.status == 200) {
                    joinBtn.innerText = 'Join Group';
                    blockBtn.remove();
                    joinBtn.removeEventListener('click', leaveGroup);
                    joinBtn.addEventListener('click', joinGroup);
                }
            });
        }
        function blockGroup() {
            fetch(`/channels/groups/?context=block&group=${group_id}`).then((response)=>{
                return response.json();
            }).then((data)=>{
                if (data.status == 200) {
                    blockBtn.innerText = 'Unblock';
                    blockBtn.removeEventListener('click', blockGroup);
                    blockBtn.addEventListener('click', unBlockGroup);
                }
            });
        }
        function unBlockGroup() {
            fetch(`/channels/groups/?context=unblock&group=${group_id}`).then((response)=>{
                return response.json();
            }).then((data)=>{
                if (data.status == 200) {
                    blockBtn.innerText = 'Block';
                    blockBtn.removeEventListener('click', unBlockGroup);
                    blockBtn.addEventListener('click', blockGroup);
                }
            });
        }
    });
}



(function findGroups(){
    const section=$('#navs-container #groups-nav .body[section="find-groups"]');
    const input = $(section, 'input[role="find-groups"]');

    input.addEventListener('keyup', (event) => {
        if (event.keyCode == 13) {
            fetch(`/channels/lookup/?context=groupl&group=${input.value}`).then((response)=>{
                return response.json();
            }).then((data)=>{
                input.value = '';
                Array.from($$(section, '.contact')).forEach(item=>item.remove());
                for (let group of data) {
                    let div = document.createElement('div');
                    let button = document.createElement('button');

                    div.classList.add('contact');
                    button.classList.add('expand-model');
                    button.setAttribute('role', 'view-group');
                    button.setAttribute('id', group.id);
                    button.setAttribute('model', 'group-model');

                    button.innerHTML = button_template;
                    div.innerHTML = contact_template;

                    if (group.thumb == null) {
                        $(div, '.avatar').innerText = group.name.slice(0,1).toUpperCase();
                    } else {
                        $(div, '.avatar').innerHTML = `<img src="${group.thumb}" alt="thumb">`;
                    }

                    $(div, '.name').textContent = group.name;
                    $(div, 'div:nth-child(3)').appendChild(button);

                    section.appendChild(div);
                    button.addEventListener('click', dispModel);
                    button.addEventListener('click', handleGroup);
                }
            });
        }
    });
})()

// FRIEND REQUESTS
if ($('button[role="request-confirm"]')) {
    const rejectRequests = Array.from($$('button[role="request-reject"]'));
    const confirmRequests = Array.from($$('button[role="request-confirm"]'));

    confirmRequests.forEach(function(confirmRequest){
        confirmRequest.addEventListener('click', function() {
            let username = this.getAttribute('user');
            let btn = this;
            fetch(`/channels/friends/?context=confirm&username=${username}`).then((response)=>{
                return response.json();
            }).then((data)=>{
                if (data.status == 200) {
                    btn.parentElement.remove();
                }
            });
        });
    });





    rejectRequests.forEach(function(rejectRequest){
        rejectRequest.addEventListener('click', function() {
            let username = this.getAttribute('user');
            let btn = this;
            fetch(`/channels/friends/?context=reject&username=${username}`).then((response)=>{
                return response.json();
            }).then((data)=>{
                if (data.status == 200) {
                    btn.parentElement.remove();
                }
            });
        });
    });
}

export {dispModel, handleProfile, handleGroup}