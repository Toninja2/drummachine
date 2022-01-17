let name;
let password;

window.onload = e => {
    name = document.getElementById('name');
    password = document.getElementById('password');
    let inputs = document.querySelectorAll('#loginForm div.formEntry input');
    for(let input = 0; input < inputs.length; input++) {
        inputs[input].onfocus = e => {

        }
        inputs[input].addEventListener('focusout', handleFocusOut)
    }
}
function handleFocusOut() {
    if(!this.value.length) this.parentElement.getElementsByTagName('label')[0].classList.remove('active');
    else this.parentElement.getElementsByTagName('label')[0].classList.add('active');
}
async function log() {
    fetch('/logUser', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: name.value,
            password: password.value
        })
    }).then(res => res.json()).then(r => {

        if(r.error) {
            let inputs = document.querySelectorAll('.formEntry');
            for(let inp of inputs) {
                inp.style.border = '2px solid #e74c3c';
                let l = inp.getElementsByTagName('label')[0];
                l.style.color = '#e74c3c';
            }
        }

        let o = document.querySelectorAll('label.active');
        for(let i = 0; i < o.length; i++) {
            o[i].classList.remove('active');
        }
        name.value = '';
        password.value = '';
        if(r.r) window.open(r.url, '_self');
    });
}
