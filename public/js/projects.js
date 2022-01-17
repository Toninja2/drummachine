let s = [];

window.onload = async e => {
    let searchBar = document.getElementById('searchBar');
    let pL = document.getElementById('pL');

    searchBar.oninput = e => {
        let sV = document.querySelectorAll('.searchNotInclude');
        for(let s of sV) {
            s.classList.remove('searchNotInclude');
        }
        let found = s.filter(elem => {
            return elem.name && elem.name.toLowerCase().includes(searchBar.value.toLowerCase())
        });
        for(let n = 0; n < s.length; n++) {
            if(!found.includes(s[n])) document.getElementById(s[n].name.replace(/ /g, '-')).classList.add('searchNotInclude');
        }
    }
    getSongsOnWeb();
}
async function getSongsOnWeb() {
    let before = Date.now();
    let r = await fetch('/songs/list?public=1', {
        method: 'POST'
    });
    console.log('Executed request in: ', (Date.now() - before), 'ms');
    let songs = await r.json();

    pL.innerHTML = '<h1 id="noFound">No song found !</h1>';
    if(!isEmpty(songs)) document.getElementById('noFound').style.display = "none";

    for(let song in songs) {
        s.push(songs[song]);

        let songDiv = document.createElement('div');
        songDiv.id = song.replace(/ /g, '-');
        songDiv.classList.add('dSong');

        let songInfos = document.createElement('div');

        let songTitle = document.createElement('h1');
        songTitle.innerText = song;
        let songTempo = document.createElement('p');
        songTempo.innerText = songs[song].tempo + ' bpm';

        songInfos.appendChild(songTitle);
        songInfos.appendChild(songTempo);

        songDiv.appendChild(songInfos);
        pL.appendChild(songDiv)

        songDiv.onclick = async e => {
            let selectedDivs = document.querySelectorAll('.sDSelected');
            if(selectedDivs.length) {
                for(let d of selectedDivs) {
                    d.classList.remove('sDSelected');
                }
            }
            songDiv.classList.add('sDSelected');
            initInfoPanel(songs[song]);
        }
    }
}
function initInfoPanel(infos) {
    document.getElementById('globalVidTitle').innerText = infos.name;
    document.getElementById('globalVidTitle').title = infos.name;
    document.getElementById('globalVidTempo').innerText = infos.tempo + ' bpm';
    let edit = document.getElementById('edit');
    edit.innerText = "Edit song !";
    edit.classList.remove('disabled');
    edit.onclick = e => {
        window.open('/?loadSong=' + infos.name);
    }

    let selected = document.querySelector('.sDSelected');
    let associations = {
        0: "cV",
        1: "shV",
        2: "hV",
        3: "sV",
        4: "kV"
    }
    for(let x = 0; x < 5; x++) {
        document.getElementById(associations[x]).innerHTML = infos.rowsInfos[x].volume + "<span class='darken'>/200</span>";
    }
    document.getElementById('times').innerText = infos.columns;
}
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
