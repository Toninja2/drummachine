let x = false;
async function rotateRects() {
    let rects = document.getElementsByClassName('rectSvg');
    for(let x = 0; x < rects.length; x++) {
        rects[x].classList.toggle('openedMenu');
        if(rects[x].classList.contains('openedMenu')) {
            op(rects[x], false);
        } else {
            c(rects[x], false);
        }
    }
}
function op(rect, a = false) {
    if(a) rect.classList.add('openedMenu');
    if(a && x) return;
    document.getElementById('lateralMenu').style.transform = 'translateX(0px)';
    switch(rect.id) {
        case '0':
            rect.style.transform = "translateY(7.5px)"
            setTimeout(function() {
                rect.style.transform += " rotate(45deg)";
            }, 500);
            break;
        case '1':
            rect.style.transform = "translateY(-7.5px)"
            setTimeout(function() {
                rect.style.transform += " rotate(-45deg)";
            }, 500);
            break;
    }
}
function c(rect, a = false) {
    if(a) rect.classList.remove('openedMenu');
    x = false;
    if(!rect.style.transform) return;
    document.getElementById('lateralMenu').style.transform = '';
    switch(rect.id) {
        case '0':
            rect.style.transform = "translateY(7.5px)"
            setTimeout(function() {
                rect.style.transform = "";
            }, 500);
            break;
        case '1':
            rect.style.transform = "translateY(-7px)"
            setTimeout(function() {
                rect.style.transform = "";
            }, 500);
            break;
    }
}
window.addEventListener('load', e => {
    let menu = document.getElementById('lateralMenu');
    let clicking = false;
    window.addEventListener('mousedown', e => {
        if(e.button) return;
        clicking = true;
    });
    window.addEventListener('mouseup', e => {
        if(e.button) return;
        menu.style.removeProperty('transition');
        document.body.style.removeProperty("user-select");
        document.body.style.removeProperty('cursor');
        clicking = false;
        if(Math.floor(menu.getBoundingClientRect().x)) {
            x = false;
            menu.style.removeProperty('transform');
            let rects = document.getElementsByClassName('rectSvg');
            if(e.target.classList.contains('menuBarB') || e.target.classList.contains('rectSvg')) return;

            c(rects[0], true);
            c(rects[1], true);
        }
    });
    window.addEventListener('mousemove', e => {
        document.body.style.userSelect = "none";

        let mt = menu.getBoundingClientRect().x + menu.offsetWidth;
        if(e.clientX >= mt - 30 && e.clientX <= mt + 5) {
            document.body.style.cursor = "w-resize";
        } else {
            document.body.style.removeProperty('cursor');
        }
        if(!clicking) return;
        //if(!Math.floor(menu.getBoundingClientRect().x) && e.clientX < menu.offsetWidth - 30) return;
        if(!menu.getBoundingClientRect().x) {
            let rects = document.getElementsByClassName('rectSvg');
            op(rects[0], true);
            op(rects[1], true);
            x = true;
        }
        if(e.clientX > (menu.getBoundingClientRect().x + 30 + menu.offsetWidth) && (Math.floor(menu.getBoundingClientRect().x) === -Math.floor(menu.offsetWidth))) return;

        if(menu.getBoundingClientRect().x >= 0 && e.clientX > menu.offsetWidth) return;
        menu.style.transition = "0s";
        document.body.style.cursor = "w-resize";
        let tX = e.clientX - menu.offsetWidth;

        if(tX > 0) tX = 0;

        menu.style.transform = `translateX(${tX}px)`;
    });
});
