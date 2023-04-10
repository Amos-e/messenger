import { dispModel, handleProfile } from "./app.js";
import { updateGroupAddFriendsCtn } from "./updaters.js";

$('#main').style.display = 'block';
$('#navs-container').style.display = 'none';

const roomID = $('#js_room').innerText;
const chatSocket = new WebSocket('ws://'+window.location.host+':8001/ws/channels/group/'+roomID+'/');
const js_user = JSON.parse($('#js_user').textContent);

const msgCtn = $('#msg-section');
const main = $('#main');
const mainRight = $('#main-right');
const onlineSpan = $('#main-left span[role="online"]');
const onlineArr = [];

chatSocket.onopen = function() {
    chatSocket.send(
        JSON.stringify({context: 'signal', status: 'true'})
    );
}

chatSocket.onclose = function() {
    console.error('Chat socket closed unexpectedly');
}

chatSocket.onmessage = function(event) {
    let data = JSON.parse(event.data);
   
    if (data.context == 'signal') {
        chatSocket.send(
            JSON.stringify({context: "echo", status: true})
        );
    }

    if (data.context == 'update') {
        let newParticipantUsername = data.new_participant;

        fetch(`/channels/lookup/?context=userld&username=${newParticipantUsername}`).then((response)=>{
            return response.json();
        }).then((data)=>{
            if (data.status == 200) {
                let participantsCtn = $(mainRight, 'section[for="group-participants"] .list-group');
                newParticipant = participantsCtn.children[0];
                newParticipant.style.display = '';
                $(newParticipant, '.info h4').innerText = data.username;
                if (data.thumb) {    
                    $(newParticipant, '.avatar').innerHTML = `<img src=${data.thumb} alt=thumb>`;
                } else {
                    $(newParticipant, '.avatar').innerText = data.username.slice(0,1).toUpperCase();
                }
                participantsCtn.appendChild(newParticipant);
            }
        });
    }

    if (data.context == 'message') {
        let message = msgCtn.children[0].cloneNode(true);
        console.log(data);
        message.style.display = '';
        if (data.user == js_user) {
            message.classList.add('msg-out');
        }

        if ($(msgCtn, '.msg-container:last-child .username')) {
            let lastUsername = $('.msg-container:last-child .username').innerText;
            if (lastUsername == data.user) {
                message.classList.add('prg-msg');
            }
        }

        data.thumb ? $(message, '.avatar').innerHTML = `<img src=${data.thumb} alt=thumb>` : $(message, '.avatar').innerText = data.user.slice(0,1).toUpperCase(); 
        $(message, '.username').innerText = data.user;
        $(message, '.msg').innerText = data.message;
        $(message, '.time').innerText = data.time.slice(0,data.time.length-3);
        msgCtn.appendChild(message);

        currPosition = checkScroll(msgCtn);
        if (currPosition) {
            handleScroll(msgCtn);
        }
    }

    if (data.context == 'echo') {
        if (onlineArr.indexOf(data.user) < 0 && data.status == true) {
            onlineArr.push(data.user);
            onlineSpan.innerText = onlineArr.length;
        }
        if (data.status == false) {
            onlineArr.splice(onlineArr.indexOf(data.user),1);
            onlineSpan.innerText = onlineArr.length;
        }
    }
}


let input = $('textarea[id="message-input"]');
input.addEventListener('keyup', (event) => {
    if (event.keyCode==13 && input.value != '') {

        chatSocket.send(JSON.stringify({
            "context": "message",
            "message": input.value
        }));

        input.value = '';
    }
});

function checkScroll(element) {
    let fullHeight = element.scrollHeight;
    let currHeight = element.offsetHeight;

    let bottom = fullHeight - currHeight;
    if (element.scrollTop != bottom) {
        // Sometimes, given that the height is a decimal, forexample 529.89, the number is rounded up to its nearest integer resulting into different results for scrollTop and (scrollHeight - offsetHeight) with a difference of 1.
        if ((element.scrollTop + 1) == bottom) {
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }
}

function handleScroll(element) {
    let fullHeight = element.scrollHeight;
    let currHeight = element.offsetHeight;

    let bottom = fullHeight - currHeight;
    element.scrollTop = bottom;
}

let currPosition = checkScroll(msgCtn);
if (currPosition) {
    handleScroll(msgCtn);
}

(function () {
    let dispRightBtn = $('button[role="toggle-main-right"]');
    let dispAddMembers = $('button[role="toggle-add-members"]');
    let closeRightBtn = $('button[role="close-main-right"]');
    let btnList = [dispAddMembers, dispRightBtn, closeRightBtn];
    dispAddMembers.addEventListener('click', function(){updateGroupAddFriendsCtn()});
    dispRightBtn.addEventListener('click', function(){updateGroupParticipants(roomID)});

    let active = false;
    let prev;

    function toggleRight() {
        
        if ((prev == this && active == true) || this == closeRightBtn) {
            main.style.display = '';
            mainRight.style.display = 'none';
            active = false;

            $('#main-left').style.display = 'grid';
            $('#main-right').style.display = 'none';
        }
        
        else if  (active == false) {
            mainRight.style.display = 'grid';   
            active = true;
        }

        prev = this;
    }

    function showGroupInfo() {
        $(mainRight, '#group-info').classList = 'js-block';
        $(mainRight, '#add-members').classList = 'js-none';
        groupInfoInit();

        $('#main-left').style.display = 'none';
        $('#main-right').style.display = 'grid';
    }

    function showAddMembers() {
        $(mainRight, '#add-members').classList = 'js-block';
        $(mainRight, '#group-info').classList = 'js-none';

        $('#main-left').style.display = 'none';
        $('#main-right').style.display = 'grid';
    }

    dispRightBtn.addEventListener('click', showGroupInfo);
    dispAddMembers.addEventListener('click', showAddMembers);

    btnList.forEach(function(btn){
        btn.addEventListener('click', toggleRight);
    });
    
})();

(function() {
    let rejectGroupBtns = Array.from($$('button[role="reject-group-request"]'));
    let confirmGroupBtns = Array.from($$('button[role="confirm-group-request"]'));

    rejectGroupBtns.forEach((btn)=>{
        btn.addEventListener('click', rejectGroupRequest);
    });
    confirmGroupBtns.forEach((btn)=>{
        btn.addEventListener('click', confirmGroupRequest);
    });

    function rejectGroupRequest() {
        let username = this.getAttribute('user');
        let group = this.getAttribute('group');
        fetch(`/channels/groups/?context=reject-request&username=${username}&group=${group}`).then((response)=>{
            return response.json();
        }).then((data)=>{
            if (data.status == 200) {
                this.parentElement.parentElement.remove();
            }
        });
    }

    function confirmGroupRequest() {
        let username = this.getAttribute('user');
        let group = this.getAttribute('group');
        fetch(`/channels/groups/?context=confirm-request&username=${username}&group=${group}`).then((response)=>{
            return response.json();
        }).then((data)=>{
            if (data.status == 200) {
                this.parentElement.parentElement.remove();
                chatSocket.send(
                    JSON.stringify({context: 'update', username: username})
                );
            }
        });
    }
})();

let deleteParticipantBtns = Array.from($$(mainRight, 'button[role="block-participant"]'));
deleteParticipantBtns.forEach((btn)=>{
    btn.addEventListener('click', deleteGroupParticipant);
});

function deleteGroupParticipant() {
    let username = this.getAttribute('user');
    let group = this.getAttribute('group');
    let parent = this.parentElement.parentElement.parentElement;
    
    fetch(`/channels/groups/?context=delete-participant&username=${username}&group=${group}`).then((response)=>{
        return response.json();
    }).then((data)=>{
        if (data.status == 200) {
            parent.remove();
        }
    });
}

const mRToggler = Array.from($$('#main-right #group-info .toggler button'));
const mRSections = Array.from($$('#main-right #group-info .body'));

mRToggler.forEach((toggler) => {
    toggler.addEventListener('click', () => {
        let index = mRToggler.indexOf(toggler);
        mRToggler.forEach(btn=>btn.classList.remove('active'));
        mRSections.forEach(section=>section.classList.remove('active'));
        toggler.classList.add('active');
        mRSections[index].classList.add('active');
    });
});

const addMemberToggler = Array.from($$('#main-right #add-members .toggler button'));
const addMemberSections = Array.from($$('#main-right #add-members .body'));

addMemberToggler.forEach(function(toggler){
    toggler.addEventListener('click', ()=>{
        let index = addMemberToggler.indexOf(toggler);
        addMemberToggler.forEach(btn=>btn.classList.remove('active'));
        addMemberSections.forEach(section=>section.classList.remove('active'));
        toggler.classList.add('active');
        addMemberSections[index].classList.add('active');
    });
});

if ($('#group-update-model input.dcsic_file_input')) {
    const groupUpdateImgField = $('#group-update-model input.dcsic_file_input');
    const groupUpdateImgBtn = $('#group-update-model label[role="img-upload"]');
    groupUpdateImgBtn.addEventListener('click', ()=>{
        groupUpdateImgField.click();
    });
}

(function(){
    let groupActionsBtns = Array.from($$(mainRight, 'button[role="toggle-actions"]'));

    groupActionsBtns.forEach((btn)=>{
        btn.addEventListener('click', toggleContactActions);
    });
})();

let prevTGA;
function toggleContactActions () {
    if (this.nextElementSibling.classList.contains('hidden')) {
        this.nextElementSibling.classList.replace('hidden', 'block');
    } else {
        this.nextElementSibling.classList.replace('block', 'hidden');
    }
    if (prevTGA) {
        if (prevTGA != this) {
            prevTGA.nextElementSibling.classList.replace('block', 'hidden');
        }
    }

    prevTGA = this;

}

const groupMembersCtn = $('#main-right #group-info .list-group');
function updateGroupParticipants(group, next) {
    let loader = document.createElement('p');
    loader.classList.add('text-white','text-center','p-2','bg-slate-400', 'loader');
    loader.innerText = 'loading';
    groupMembersCtn.appendChild(loader);
    let request;
    if (next) {
        request = `/channels/lookup/?context=participants&group=${group}&next=${next}`;
    } else {
        request = `/channels/lookup/?context=participants&group=${group}`;
    }
    fetch(request).then((response)=>{
        return response.json();
    }).then((data)=>{
        $(groupMembersCtn, '.loader').remove();
        console.log(data);
        participantCount += data.participants.length;
        totalParticipants = data.total_participants;
        
        let template = $(groupMembersCtn, '.contact:first-of-type');
        for (let participant of data.participants) {
            let newParticipant = template.cloneNode(true);
            newParticipant.style.display = '';
            if (participant.thumb) {
                $(newParticipant, '.avatar').innerHTML = `<img src=${participant.thumb}> alt=thumb`;
            } else {
                $(newParticipant, '.avatar').innerText = participant.username.slice(0,1).toUpperCase();
            }

            $(newParticipant, '.info h4').innerText = participant.username;
            $(newParticipant, 'button[role=toggle-actions]').addEventListener('click', toggleContactActions);
            let profileBtn = $(newParticipant, '.actions-container .expand-model');
            profileBtn.setAttribute('user', participant.username) 
            profileBtn.addEventListener('click', dispModel);
            profileBtn.addEventListener('click', handleProfile);

            profileBtn.addEventListener('click', function(){
                this.parentElement.classList.replace('block', 'hidden');
            });

            if (data.user_participant.is_admin) {
                let delParticipantBtn = $(newParticipant, '.actions-container button[role=block-participant]')
                delParticipantBtn.setAttribute('user', participant.username)
                delParticipantBtn.setAttribute('group', group);
                delParticipantBtn.addEventListener('click', deleteGroupParticipant);

                profileBtn.addEventListener('click', function(){
                    this.parentElement.classList.replace('block', 'hidden');
                });
            }

            groupMembersCtn.appendChild(newParticipant);
            
        }
    }).then(()=>{
        groupInfo.addEventListener('scroll', groupInfoListener);
    });
}

const groupInfo = $(mainRight, '#group-info #mt-body');
let groupInfoNext, participantCount, totalParticipants, endBool;
function groupInfoInit() {
    groupInfoNext = 0;
    participantCount = 0;
    endBool = true;
    $$(groupMembersCtn, '.contact:not(.contact:first-of-type)').forEach(item=>item.remove());
    $(groupMembersCtn, '.end-result') ? $(groupMembersCtn, '.end-result').remove() : null;
    groupInfo.addEventListener('scroll', groupInfoListener);
}

function groupInfoListener (){
    let heightBool = checkScroll(groupInfo);
    
    if (participantCount != totalParticipants) {
        if (!heightBool) {
            groupInfo.removeEventListener('scroll', groupInfoListener);
            groupInfoNext++;
            updateGroupParticipants(roomID, groupInfoNext)
        }
    } else if (participantCount == totalParticipants && endBool) {
        endBool = false;
        groupInfo.removeEventListener('scroll', groupInfoListener);
        let endElement = document.createElement('p');
        endElement.classList.add('bg-slate-400', 'text-center', 'text-white', 'p-2', 'end-result')
        endElement.innerText = 'End of results';
        groupMembersCtn.appendChild(endElement);
    }
}

groupInfoInit();