//SELECTORS
function $() {
    if (arguments.length == 1) {
        return document.querySelector(arguments[0]);
    } else {
        return arguments[0].querySelector(arguments[1]);
    }
}

function $$() {
    if (arguments.length == 1) {
        return document.querySelectorAll(arguments[0]);
    } else {
        return arguments[0].querySelectorAll(arguments[1]);
    }
}

//TEMPLATES
let button_template = `
    <div class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-more-vertical"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
    </div>
`;
let contact_template = `
    <div><div class="avatar"></div></div>
    <div><p class="name"></p><p class="last-seen">last seen 2 days ago</p>
    </div>
    <div></div>
`;
