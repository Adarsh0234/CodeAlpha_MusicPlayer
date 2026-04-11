const tracks = [
    { title: "Gehra hua", artist: "Dhurandhar", duration: 222, emoji: "🎵", bg: "#121008", file: "Gehra Hua - Dhurandhar (320 kbps).mp3" },
    { title: "Sapphire", artist: "Ed Sheeran", duration: 205, emoji: "🌅", bg: "#130f08", file: "Sapphire (Mp3 Song)-(SambalpuriStar.In).mp3" },
    { title: "The Nights", artist: "Avicii", duration: 240, emoji: "⚡", bg: "#0c0f18", file: "Avicii - The Nights (Lyrics) _my father told me_.mp3" },
    { title: "Faded", artist: "Alan Walker", duration: 210, emoji: "🔥", bg: "#150c0a", file: "Alan Walker  Faded.mp3" },
    { title: "Warriyo - Mortals", artist: "Laura Brehm", duration: 260, emoji: "🌊", bg: "#091311", file: "Warriyo - Mortals (feat. Laura Brehm).mp3" },
];

let current = 0, playing = false, autoplay = true, elapsed = 0, ticker = null;
const audio = document.getElementById('audioPlayer');

const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const PLAY = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
const PAUSE = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

audio.addEventListener('loadedmetadata', () => {
    document.getElementById('totalTime').textContent = fmt(Math.floor(audio.duration));
    renderProgress();
});

audio.addEventListener('timeupdate', renderProgress);

audio.addEventListener('ended', () => {
    playing = false;
    document.getElementById('playerCard').classList.remove('playing');
    document.getElementById('playBtn').innerHTML = PLAY;
    if (autoplay) loadTrack((current + 1) % tracks.length, true);
});

function savePlayerState() {
    try {
        const state = {
            current: current,
            autoplay: autoplay,
            volume: document.getElementById('volSlider').value
        };
        localStorage.setItem('aurumPlayerState', JSON.stringify(state));
    } catch (e) {
        console.warn('Could not save player state:', e);
    }
}

function loadPlayerState() {
    try {
        const savedState = localStorage.getItem('aurumPlayerState');
        if (savedState) {
            const state = JSON.parse(savedState);
            current = Math.min(state.current || 0, tracks.length - 1);
            autoplay = state.autoplay !== undefined ? state.autoplay : true;

            if (state.volume !== undefined) {
                document.getElementById('volSlider').value = state.volume;
                document.getElementById('volVal').textContent = state.volume + '%';
                audio.volume = state.volume / 100;
            }

            document.getElementById('apToggle').classList.toggle('on', autoplay);
        }
    } catch (e) {
        console.warn('Could not load player state:', e);
        current = 0;
        autoplay = true;
    }
}

function loadTrack(i, andPlay = false) {
    current = i;
    const t = tracks[i];
    document.getElementById('songTitle').textContent = t.title;
    document.getElementById('artistName').textContent = t.artist;
    document.getElementById('albumArt').textContent = t.emoji;
    document.getElementById('albumArt').style.background = t.bg;
    
    if (t.file) {
        audio.src = t.file;
        audio.currentTime = 0;
        audio.volume = document.getElementById('volSlider').value / 100;
        audio.load();
        document.getElementById('totalTime').textContent = fmt(t.duration);
    } else {
        document.getElementById('totalTime').textContent = fmt(t.duration);
    }
    
    renderPlaylist();
    savePlayerState();
    if (andPlay) startPlaying();
}

function startPlaying() {
    if (tracks[current].file) {
        audio.play();
    } else {
        // Fallback to simulated playback for tracks without files
        clearInterval(ticker);
        ticker = setInterval(() => {
            elapsed++;
            if (elapsed >= tracks[current].duration) {
                clearInterval(ticker);
                playing = false;
                document.getElementById('playerCard').classList.remove('playing');
                document.getElementById('playBtn').innerHTML = PLAY;
                renderProgress();
                savePlayerState();
                if (autoplay) loadTrack((current + 1) % tracks.length, true);
                return;
            }
            renderProgress();
            renderPlaylist();
        }, 1000);
    }
    playing = true;
    document.getElementById('playBtn').innerHTML = PAUSE;
    document.getElementById('playerCard').classList.add('playing');
    savePlayerState();
}

function stopPlaying() {
    if (tracks[current].file) {
        audio.pause();
    } else {
        clearInterval(ticker);
    }
    playing = false;
    document.getElementById('playBtn').innerHTML = PLAY;
    document.getElementById('playerCard').classList.remove('playing');
    savePlayerState();
}

function renderProgress() {
    let elapsedTime;
    if (tracks[current].file) {
        elapsedTime = audio.currentTime || 0;
    } else {
        elapsedTime = elapsed;
    }
    const duration = tracks[current].file ? audio.duration : tracks[current].duration;
    const pct = (elapsedTime / duration) * 100;
    document.getElementById('progressFill').style.width = pct.toFixed(2) + '%';
    document.getElementById('curTime').textContent = fmt(Math.floor(elapsedTime));
}

function renderPlaylist() {
    const pl = document.getElementById('playlist');
    pl.innerHTML = '';
    tracks.forEach((t, i) => {
        const div = document.createElement('div');
        div.className = 'track-item' + (i === current ? ' active' : '');
        div.innerHTML = `
<span class="track-num">${i === current && playing ? '♪' : String(i + 1).padStart(2, '0')}</span>
<div class="track-meta">
  <div class="t-name">${t.title}</div>
  <div class="t-artist">${t.artist}</div>
</div>
<div class="track-right">
  <div class="eq-bars"><div class="eq-bar"></div><div class="eq-bar"></div><div class="eq-bar"></div></div>
  <span class="t-dur">${fmt(t.duration)}</span>
</div>`;
        div.addEventListener('click', () => { stopPlaying(); loadTrack(i, true); });
        pl.appendChild(div);
    });
}

document.getElementById('progressTrack').addEventListener('click', function (e) {
    const rect = this.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (tracks[current].file) {
        audio.currentTime = pct * audio.duration;
    } else {
        elapsed = Math.round(pct * tracks[current].duration);
        renderProgress();
    }
    savePlayerState();
});

document.getElementById('volSlider').addEventListener('input', function () {
    document.getElementById('volVal').textContent = this.value + '%';
    audio.volume = this.value / 100;
    savePlayerState();
});

document.getElementById('playBtn').addEventListener('click', () => playing ? stopPlaying() : startPlaying());

document.getElementById('prevBtn').addEventListener('click', () => {
    const was = playing; stopPlaying();
    const currentTime = tracks[current].file ? audio.currentTime : elapsed;
    if (currentTime > 3) { 
        if (tracks[current].file) audio.currentTime = 0;
        else elapsed = 0; 
        renderProgress(); 
        if (was) startPlaying(); 
    }
    else loadTrack((current - 1 + tracks.length) % tracks.length, was);
});

document.getElementById('nextBtn').addEventListener('click', () => {
    const was = playing; stopPlaying();
    loadTrack((current + 1) % tracks.length, was);
});

document.getElementById('apToggle').addEventListener('click', function () {
    autoplay = !autoplay;
    this.classList.toggle('on', autoplay);
    savePlayerState();
});

loadPlayerState();
loadTrack(current);