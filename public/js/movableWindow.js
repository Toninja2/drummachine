HTMLElement.prototype.movable = function(stopMovable = true) {
    if(this.dataset.movable && stopMovable) {
        return this.removeAttribute('data-movable');
    }
    if(!this.dataset.movable) {
        this.dataset.movable = true;
    }

    let drag = {};
    this.style.position = "absolute";

    this.onmousedown = e => {
        if(this.dataset.movable !== "true") return;
        this.style.cursor = "grab";
        drag.drag = true;
        let bcr = this.getBoundingClientRect();
        drag.x = e.clientX - bcr.left;
        drag.y = e.clientY - bcr.top;
        document.body.style.userSelect = "none";
        this.style.transition = "0s";
    }
    window.onmouseup = e => {
        if(this.dataset.movable !== "true") return;
        this.style.removeProperty('cursor');
        drag.drag = false;
        document.body.style.removeProperty('user-select');
        this.style.removeProperty('transition')
    }
    window.onmousemove = e => {
        if(this.dataset.movable !== "true") return;

        if(!drag.drag) return;

        let y;
        let x;

        if((e.clientY - drag.y + this.offsetHeight) >= window.innerHeight) y = window.innerHeight - this.offsetHeight + drag.y;
        else y = e.clientY;
        if((e.clientX - drag.x + this.offsetWidth) >= window.innerWidth) x = window.innerWidth - this.offsetWidth + drag.x;
        else x = e.clientX;
        if(e.clientY - drag.y <= 0) y = drag.y;
        if(e.clientX - drag.x <= 0) x = drag.x;

        this.style.top = y - drag.y + "px";
        this.style.left = x - drag.x + "px";
    }
}
HTMLElement.prototype.isMovable = function() {
    if(this.dataset.movable) return true;
    return false;
}
/*HTMLElement.prototype.bounce = function() {
    let bcr = this.getBoundingClientRect();
    let left = bcr.left;
    let top = bcr.top;
    let secondTime = 1.5;

    if(this.style.animation) beforeAnim = this.style.animation;
    else beforeAnim = false;

    let anim = '\
    @keyframes bounceAnim {\
        0% {\
            transform: scale(1, 1);\
        }\
        10% {\
            transform: translateY(var(--moveFrom)) scale(1.2, 0.7);\
        }\
        22% {\
            transform: translateY(var(--moveFromF));\
        }\
        26% {\
            transform: translateY(calc(var(--moveFromF) + 50px)) scale(1, 1);\
        }\
        37% {\
            transform: translateY(var(--moveFrom)) scale(1.2, 0.7);\
        }\
    }';
    // C
    anim = '\
        @keyframes bounceAnim {\
            0% {\
                transform: scale(1, 1);\
            }\
            25% {\
                transform: scale(1.2, 0.7);\
            }\
            50% {\
                transform: scale(0.9, 1.2) translateY(45px);\
            }\
            100% {\
                transform: scale(1, 1);\
            }\
        }\
    '
    // C
    let bottomPosition = top + this.offsetHeight;

    let style = document.createElement('style');
    style.innerText = anim;
    document.body.appendChild(style);

    let mF = window.innerHeight - bottomPosition;

    this.style.setProperty('--moveFrom', mF + "px");
    this.style.setProperty('--moveFromF', -(mF / 3 - mF) + "px")
    this.style.animation = `${secondTime}s bounceAnim linear`;

    let _this = this;
    setTimeout(function() {
        style.parentElement.removeChild(style);

        _this.style.removeProperty('--moveFrom');
        beforeAnim ? this.style.animation = beforeAnim : _this.style.removeProperty('animation');


    }, secondTime * 1000);
}*/
function chooseRandomElement(callback) {
    let elements = document.body.querySelectorAll('*');
    let chosenElement = elements[Math.floor(Math.random() * elements.length)];

    return chosenElement;
}
