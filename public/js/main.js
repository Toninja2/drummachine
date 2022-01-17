let currentIndex,
    tempo,
    machine,
    controls,
    buttons,
    rows,
    interval,
    loop,
    index,
    playing,
    paused,
    o,
    popupContainer,
    popup,
    menu,
    masterVolume;

let tempos = {

}

function resizeVolumeInputs() {
    let inputs = document.querySelectorAll('.drumInfo input[type=range]');
    for(let input = 0; input < inputs.length; input++) {
        inputs[input].style.width = `${inputs[input].parentElement.clientHeight * 85 / 100}px`;
    }
}
/*
resizeVolumeInputs();
window.onresize = resizeVolumeInputs;
*/
window.onload = e => {
    masterVolume = document.getElementById('masterVolume');
    let menu = document.getElementById('menu');
    let uSP = new URLSearchParams(window.location.search)
    uSP.has('loadSong') ? getOnWeb(uSP.get('loadSong')) : void(0);

    popupContainer = document.getElementById('popupContainer');
    popup = document.getElementById('popup');
    o = document.getElementById('a');
    o.addEventListener('change', handleFileSelect, false);

    playing = false;
    paused = false;
    loop = true;
    currentIndex = 0;
    tempo = 120;
    machine = document.getElementById('machine');
    controls = document.getElementById('controls');
    buttons = document.querySelectorAll('.machineRow button');
    rows = document.querySelectorAll('.machineRow');
    let pSButtons = document.querySelectorAll('.playSound');

    for(let button = 0; button < buttons.length; button++) {
        buttons[button].onclick = e => {
            buttons[button].classList.toggle('selected');
            if(buttons[button].classList.contains('selected') && !playing) createPlaySound('/sounds/' + buttons[button].parentElement.dataset.sound + '.wav', buttons[button].parentElement.dataset.sound);
        }
    }
    initDblClick();
    for(let b of pSButtons) {
        b.onclick = e => {
            createPlaySound(`/sounds/${b.parentElement.dataset.sound}.wav`, b.parentElement.dataset.sound);
        }
    }
    popupContainer.onclick = e => {
        if(e.target === popup) return;
        popupContainer.style.display = 'none';
    }

    console.log(`%c[Drums] %cLoaded page !`, "color: #1abc9c; font-weight: bold;", "color: normal; font-weight: normal;");
}

function onKeyDown(e) {
    switch(e.code) {
        case 'Space':
            e.preventDefault();
            play(true);
            break;
    }
}
document.onkeydown = onKeyDown;

async function getSong() {
    let id = prompt('Enter your song id:');
    if(!id) return openPopup('Invalid id !');
    getOnWeb(id);
}
function initDblClick() {
    function initForInstrument(instrument) {
        let iButtons = document.querySelectorAll('#' + instrument + ' button');
        for(let b  = 0; b < iButtons.length; b++) {
            iButtons[b].ondblclick = e => {
                //play(false, b);
            }
            iButtons[b].oncontextmenu = e => {
                if(e.button !== 2) return;
                e.preventDefault();
                openMenu(b, e);
            }
        }
    }
    initForInstrument('kick');
    initForInstrument('snare');
    initForInstrument('hiHat');
    initForInstrument('bell');
    initForInstrument('bC');
}
window.onclick = e => {
    let menu = document.getElementById('menu');
    if(e.target === menu/* || e.target.parentElement === menu*/) return;
    menu.style.display = 'none';
}
async function openMenu(index, event) {
    let menu = await document.getElementById('menu');

    menu.style.removeProperty('left');
    menu.style.removeProperty('top');
    menu.style.removeProperty('right');
    menu.style.removeProperty('bottom');

    menu.dataset.case = index;
    menu.style.display = "flex";

    if(event.clientX + menu.offsetWidth >= window.innerWidth) menu.style.right = (window.innerWidth - event.clientX) + 'px';
    else menu.style.left = event.clientX + 'px';
    if(event.clientY + menu.offsetHeight >= window.innerHeight) menu.style.bottom = (window.innerHeight - event.clientY) + 'px';
    else menu.style.top = event.clientY + 'px';
}
let s = {tempos: {}};
async function copy(index) {
    let l = await prompt('What is the length for the part ?');
    if(!l) return openPopup('An error occured, please retry');
    copyPart(Number(index), Number(l));
}
function copyPart(indexStart, length) {
    if(!String(indexStart) || !String(length)) return openPopup('An error occured, please retry');
    ro = document.getElementsByClassName('machineRow');
    s = {tempos: {}};
    for(let r of ro) {
        for(let i = indexStart; i < (indexStart + length); i++) {
            if(tempos[i]) {
                s.tempos[i] = tempos[i];
            }
            let b = r.getElementsByTagName('button')[i];
            if(!s[r.id]) s[r.id] = [];
            if(b) {
                s[r.id].push(b.classList.contains('selected') ? 'S' : '');
            }
        }
    }
    s.need = indexStart + length;
    copyText(JSON.stringify(s));
    return s;
}
async function slidePage() {
    let mainPage = document.getElementById('mainPage');
    if(!mainPage.style.transform) return mainPage.style.transform = "translateX(-50%)";
    return mainPage.style.removeProperty('transform');
}
async function pastePart(index, data) {
    if(!data) {
        data = s;
        console.log(s)
        if(!data || (data && !data.need)) return;
    }
    try {
        await data.then(d => {
            data = JSON.parse(d);
        });
    } catch(err) {
        void(0);
    }
    if(!data) {
        data = s;
        console.log(s)
        if(!data || (data && !data.need)) return;
    }
    let ro = document.getElementsByClassName('machineRow');
    let needPlace = Math.ceil(data.need / 4);
    for(let r of ro) {
        let o = 0;
        for(let i = index; i < (Number(index) + (needPlace * 4)); i++) {

            let b = await r.getElementsByTagName('button')[i];
            if(!b) await addColumn();
            data[r.id][o] ? b.classList.add('selected') : void(0);
            o++;
        }
    }
}
function fallbackCopyText(text) {
    let textArea = document.createElement("textarea");
    textArea.value = text;

    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        let successful = document.execCommand('copy');
        console.log('Config copied !');
    } catch (err) {
        console.error('Unable to copy', err);
    }

    document.body.removeChild(textArea);
}
function copyText(text) {
    if (!navigator.clipboard) {
        fallbackCopyText(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function() {
        console.log('Config copied !');
    }, function(err) {
        fallbackCopyText(text);
    });
}
function getClipboard() {
    if(!navigator.clipboard) return s;
    return navigator.clipboard.readText().then(
        clipText => {
            return clipText;
        }
    );
}
/*
function copyText(text = '') {
    let i = document.createElement('input');
    i.style.display = 'none';
    i.value = text;
    document.body.appendChild(i);
    i.focus();
    i.select();
    document.execCommand('copy');
}*/
async function deleteTime(index) {
    let i = Number(index);
    let time = Math.floor(i / 4);
    let rows = document.getElementsByClassName('machineRow');
    for(let r = 0; r < rows.length; r++) {
        let buttons = rows[r].getElementsByTagName('button');
        let toRemove = [];
        for(let b = time * 4; b < ((time * 4) + 4); b++) {
            toRemove.push(buttons[b]);
        }
        toRemove.forEach((item, i) => {
            rows[r].removeChild(item);
        });
    }
    initDblClick();

}
function resetCaseTempo(index) {
    let c = Object.keys(tempos);
    applyTempo(index, tempos[c[c.indexOf(index) - 1]])
}
function chooseTempoFor(index) {

    if(tempos[index]) {
        let a = confirm(`The tempo for the case n°${index + 1} is ${tempos[index]} bpm. Do you want to change ?`);
        if(!a) return;
    }

    let t = prompt("What tempo for case n°" + (Number(index) + 1) + " ?");
    t = Number(t);
    if(Number.isNaN(t)) return alert('An error occured !');
    if(!t) return alert('An error occured !');

    applyTempo(index, t)
}
function applyTempo(index, t) {
    tempos[index] = t;

    let r = document.querySelectorAll('.machineRow');
    for(let ro = 0; ro < r.length; ro++) {
        let b = document.querySelectorAll(`#${r[ro].id} button`);
        b[index].classList.add('tempoChange');

        let c = Object.keys(tempos);
        let l = tempos[c[c.indexOf(String(index)) - 1]];

        if(l && l == t || isEmpty(tempos)) b[index].classList.remove('tempoChange');
        if(!l && t == tempo || !t) b[index].classList.remove('tempoChange');
    }
    let c = Object.keys(tempos);
    let l = tempos[c[c.indexOf(String(index)) - 1]];

    if(l && l == t || isEmpty(tempos)) delete tempos[index];
    if(!l && t == tempo || !t) delete tempos[index];
}
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
async function setConfig(config) {
    console.log(`%c[Drums] %cLoading config ...`, "color: #1abc9c; font-weight: bold;", "color: normal; font-weight: normal;");

    if(!config.tempo) config.tempo = 120;
    if(!config.columns) config.columns = 8;
    if(!config.rows) return openPopup('Invalid config file !');

    document.getElementById('songName').innerText = (config.name ? config.name : "No name !");
    document.getElementById('songName').title = (config.name ? config.name : "No name !");
    let temposChanges = document.querySelectorAll('.tempoChange');

    temposChanges.forEach((elem, i) => {
        elem.classList.remove('tempoChange');
    });


    tempo = config.tempo;
    let t = await document.querySelector('#selectNumber input');
    t.value = tempo;

    let cols = (document.querySelectorAll('.machineRow button').length / 5) / 4;

    if(config.columns > cols) {
        let nToAdd = config.columns - cols;
        for(let p = 0; p < nToAdd; p++) {
            await addColumn();
        }
    } else if(config.columns < cols) {
        let nToDel = cols - config.columns;
        for(let p = 0; p < nToDel; p++) {
            await removeColumn();
        }
    }

    y = await document.querySelectorAll('button.selected');
    for(let u = 0; u < y.length; u++) {
        y[u].classList.toggle('selected');
    }
    for(let x in config.rows) {
        let butts = await document.querySelectorAll(`#${rows[x].id} button`);
        let v = await document.querySelector(`#${rows[x].dataset.sound}Info input`);
        v.value = config.rowsInfos[x].volume;
        for(let b in butts) {
            if(config.tempos && config.tempos[b]) butts[b].classList.add('tempoChange');
            if(config.rows[x][b] === "S") {
                butts[b].classList.add('selected');
            }
        }
    }
    if(config.tempos) tempos = config.tempos;
    console.log(`%c[Drums] %cLoaded config !`, "color: #1abc9c; font-weight: bold;", "color: normal; font-weight: normal;");
}

function handleFileSelect(evt) {
    if (window.File && window.FileReader && o.files) {
        if(!o.files[0].name.endsWith('.json')) return openPopup('Invalid file !');

        let fr = new FileReader();
        let result;
        fr.onload = function(e) {
            result = JSON.parse(e.target.result);
            setConfig(result);
        }
        fr.readAsText(o.files[0]);
    } else {
        openPopup('Not supported or invalid file !');
    }
}
async function downloadConfig() {
    let data = await createConfig();
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    var dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", "rythm.json");
    dlAnchorElem.click();
}
async function saveOnWeb() {
    let res = prompt('What name for your project ?');
    let c = await createConfig();
    if(res) c.name = res;
    fetch('/saveOnWeb', {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(c)
    }).then(res => res.json())
    .then(resp => {
        if(!resp.id) return openPopup('An error occured !');
        alert('The id for the song is ' + resp.id);
    });
}
async function getOnWeb(id) {
    fetch(`/song/${id}`, {
        method: 'POST'
    }).then(res => res.json())
    .then(resp => {
        if(resp.error) return openPopup('Invalid id !');
        setConfig(resp);
    });
}
async function createConfig() {
    let data = {
        tempo: document.querySelector('#selectNumber input').value,
        columns: (document.querySelectorAll('.machineRow button').length / 5) / 4,
        rows: await getRows(),
        rowsInfos: await getInfos(),
        tempos: tempos
    }
    return data;
}
async function getInfos() {
    let data = {
        0: {},
        1: {},
        2: {},
        3: {},
        4: {}
    }
    for(let row = 0; row < rows.length; row++) {
        let v = await document.querySelector(`#${rows[row].dataset.sound}Info input`);
        data[row].volume = v.value;
    }
    return data;
}
async function getRows() {
    let r = {
        0: [],
        1: [],
        2: [],
        3: [],
        4: []
    }
    for(let x = 0; x < rows.length; x++) {
        let cR = rows[x];
        let b = document.querySelectorAll(`#${cR.id} button`);

        for(let y of b) {
            y.classList.contains('selected') ? r[x].push('S') : r[x].push('');
        }
    }
    return r;
}
async function createPlaySound(src, s) {
    let sound = document.createElement('audio');
    
    sound.style.display = "none";
    sound.src = src;

    let volume = document.querySelector(`#${s}Info input`).value;
    sound.volume = volume / 200 * (Number(masterVolume.value) / 100);

    await sound.play();
}
/*let sound = document.getElementById(`${s.toLowerCase()}-audio`);
if(!sound) {
    console.log('recreated')
    sound = document.createElement('audio');
    sound.id = `${s.toLowerCase()}-audio`;
    sound.style.display = "none";
    document.body.appendChild(sound);
}

let sound = document.createElement('audio');
sound.preload = "auto";
sound.style.display = "none";
sound.src = src;

sound.src = src;
let volume = document.querySelector(`#${s}Info input`).value;
sound.volume = volume / 200 * (Number(masterVolume.value) / 100);
sound.pause()
sound.currentTime = 0;

await sound.play();*/
function play(pauseIfPlaying = false, startIndex) {
    if(playing && pauseIfPlaying) return pause();

    playing = true;
    clearTimeout(interval);

    let t = document.querySelector('#selectNumber input');
    tempo = t.value;
    if(tempo < 30) {
        tempo = 30;
        t.value = tempo;
    }
    if(tempo > 300) {
        tempo = 300;
        t.value = tempo;
    }
    clearPlaying();

    index = 0;

    if(paused) index = currentIndex;
    paused = false;

    if(startIndex) index = startIndex;

    playColumn(index);
    index++;
    /*
    interval = setInterval(function() {
        let k = document.querySelectorAll(`#${rows[4].id} button`);

        if(index >= k.length) index = k.length - 1;

        playColumn(index);

        index++;
        if(index == k.length-- && !loop) {
            clearInterval(interval);
            clearPlaying();
            stop();
        }
        if(index == k.length-- && loop) index = 0;
    }, (1000 * 60 / tempo) / 4)*/

    interval = setTimeout(function() {
        p();
    }, (1000 * 60 / tempo) / 4)
    //document.getElementById('kickSound').play()
}
function p() {
    let cTempo;

    for(let t in tempos) {
        if(t <= index) cTempo = tempos[t];
    }
    if(!cTempo) cTempo = tempo;

    interval = setTimeout(function() {
        p();
    }, (1000 * 60 / cTempo) / 4);

    let k = document.querySelectorAll(`#${rows[4].id} button`);

    if(index >= k.length) index = k.length - 1;

    playColumn(index);

    index++;
    if(index == k.length-- && !loop) {
        clearTimeout(interval);
        clearPlaying();
        stop();
    }
    if(index == k.length-- && loop) index = 0;
}
function playColumn(index) {
    clearPlaying()
    for(let x = 0; x < rows.length; x++) {
        let c = document.querySelectorAll(`#${rows[x].id} button`);
        try {
            machine.scrollTo(c[index].offsetLeft - (machine.offsetWidth / 2 + c[index].offsetWidth), 0);
            c[index].classList.contains('selected') ? createPlaySound(`/sounds/${rows[x].dataset.sound}.wav`, rows[x].dataset.sound) : void(0);
            c[index].classList.toggle('playing');
        } catch(err) {

        }
    }
}
function pause() {
    playing = false;
    currentIndex = index;
    paused = true;

    clearTimeout(interval);
}
function clearPlaying() {
    y = document.querySelectorAll('button.playing');
    for(let u = 0; u < y.length; u++) {
        y[u].classList.toggle('playing');
    }
}
function stop() {
    machine.scrollTo(0, 0);
    playing = false;
    paused = false;
    clearTimeout(interval);
    clearPlaying();
}
async function reset(ask = false) {
    let x;
    if(ask) x = confirm('Do you want to reset your project ?');
    if(ask && !x) return;
    window.open('/', '_self');
}
async function removeColumn() {
    for(let x = 0; x < 4; x++) {
        for(let x = 0; x < rows.length; x++) {
            let b = document.querySelectorAll(`#${rows[x].id} button`);
            if(b.length <= 8) {
                return;
            }
            rows[x].removeChild(b[b.length - 1]);
            if(b.length <= 9) {
                document.getElementById('removeColumn').classList.add('disabled');
            }
        }
    }
}
async function addColumn() {
    for(let x = 0; x < 4; x++) {
        document.getElementById('removeColumn').classList.remove('disabled');
        for(let x = 0; x < rows.length; x++) {
            let b = await document.createElement('button');
            b.innerHTML = '<svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="25" r="20" fill="black"/></svg>'
            rows[x].appendChild(b);
            b.onclick = e => {
                b.classList.toggle('selected');
                if(b.classList.contains('selected') && !playing) createPlaySound('/sounds/' + b.parentElement.dataset.sound + '.wav', b.parentElement.dataset.sound);
            }
        }
        initDblClick();
    }
}
async function openPopup(text) {
    popupContainer.style.display = 'flex';
    let h1Text = document.querySelector('#popup h1');
    if(!text) return h1Text.innerText = "Not supported in your browser !";
    h1Text.innerText = text;
}
