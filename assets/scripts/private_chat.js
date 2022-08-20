const roomID = $('#js_room').innerText;
const chatSocket = new WebSocket('ws://'+window.location.host+'/ws/channels/private/'+roomID+'/');

const main = $('#main');
const msgCtn = $('#msg-section');
const mainRight = $('#main-right');
const onlineArr = [];

chatSocket.onopen = function(event) {
    chatSocket.send(
        JSON.stringify({context: 'signal', status: true})
    );
}

chatSocket.onclose = function() {
    console.error('Chat socket closed unexpectedly');
}

chatSocket.onmessage = function(event) {
    let data = JSON.parse(event.data);
    if (data.context == 'signal') {
        chatSocket.send(
            JSON.stringify({context: 'echo', status: true})
        );
    }

    if (data.context == 'message') {
        let message = document.createElement('div');

        if ($('.msg-container:last-child .username')) {
            let lastUsername = $('.msg-container:last-child .username').innerText;
            if (lastUsername == data.user) {
                message.classList.add('prg-msg');
            }
        }

        message.classList.add('msg-container');
        message.innerHTML = message_template;
        $(message, '.avatar').innerText = data.user.slice(0,1).toUpperCase();
        $(message, '.username').innerText = data.user;
        $(message, '.date').innerText = data.time;
        $(message, '.message').innerText = data.message;
        msgCtn.appendChild(message);

        currPosition = checkSroll(msgCtn);
        if (currPosition) {
            handleScroll(msgCtn);
        }
    }

    if (data.context == 'echo') {
        let onlineCtn = $('p[role="online"]');
        if (onlineArr.indexOf(data.user) < 0 && data.status == true) {
            onlineArr.push(data.user);
        }
        if (data.status == false) {
            onlineArr.splice(onlineArr.indexOf(data.user),1);
        }
        if (onlineArr.length == 2) {
            onlineCtn.innerText = "Online";
        } else {
            onlineCtn.innerText = "offline";
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

function checkSroll(element) {
    let fullHeight = element.scrollHeight;
    let currHeight = element.offsetHeight;

    let bottom = fullHeight - currHeight;
    if (element.scrollTop != bottom) {
        return 1;
    } else {
        return 0;
    }
}

function handleScroll(element) {
    let fullHeight = element.scrollHeight;
    let currHeight = element.offsetHeight;

    let bottom = fullHeight - currHeight;
    element.scrollTop = bottom;
}

currPosition = checkSroll(msgCtn);
if (currPosition) {
    handleScroll(msgCtn);
}

(function() {
    let dispRight = $('button[role="toggle-main-right"]');
    let closeRight = $('button[role="close-main-right"]');

    dispRight.addEventListener('click', () => {
        if (mainRight.style.display == '' || mainRight.style.display == 'none') {
            main.style.display = 'grid';
            main.style.gridTemplateColumns = '65% 35%';
            mainRight.style.display = 'block';
        }
        else  if (mainRight.style.display == 'block') {
            main.style.display = '';
            mainRight.style.display = 'none';
        }
    });

    closeRight.addEventListener('click', () => {
        main.style.display = '';
        mainRight.style.display = 'none';
    });
}) ()

// TEMPLATES
var pv_contact_template = `
    <div class="contact">
        <div class="avatar"></div>
        <div class="name"></div>
    </div>
`;

var message_template = `
    <div class="left">
        <div class="avatar"></div>
    </div>
    <div class="right">
        <p class="name"><span class='username'></span><span class="date"></span></p>
        <p class="message"></p>
    </div>
`;
