console.log('Lets write JavaScript');
let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    try {
        let response = await fetch(`/${folder}/`);
        if (!response.ok) throw new Error('Failed to fetch songs');
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");
        songs = [];
        for (let element of as) {
            if (element.href.endsWith(".mp3")) {
                songs.push(decodeURI(element.href.split(`/${folder}/`)[1])); 
            }
        }
        updateSongList();
    } catch (error) {
        console.error('Error fetching songs:', error);
    }
}

function getArtistForSong(song) {
    return songMetadata[song] || "Unknown Artist"; 
}

function updateSongList() {
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        const artist = getArtistForSong(song); 
        songUL.innerHTML += `
            <li>
                <img class="invert" width="34" src="music.svg" alt="">
                <div class="info">
                    <div>${decodeURI(song).replace(/%20/g, " ")}</div>
                    <div>${artist}</div> <!-- Displaying the artist name here -->
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="play.svg" alt="">
                </div>
            </li>`;
    }
    attachSongListeners();
}

function attachSongListeners() {
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
        });
    });
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    
    if (!pause) {
        currentSong.play();
        document.querySelector("#play").src = "pause.svg";
    }
    
    const songNameElement = document.querySelector(".songinfo");
    const artistName = getArtistForSong(track); 
    songNameElement.innerHTML = `
        ${decodeURI(track).replace(/%20/g, " ")} 
        <br> <span class="artist-info">${artistName}</span>
    `;
    
    // Reset song time display
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}


async function displayAlbums() {
    try {
        let response = await fetch(`/songs/`);
        if (!response.ok) throw new Error('Failed to fetch albums');
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");
        for (let e of anchors) {
            if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
                let folder = e.href.split("/").slice(-2)[0];
                let metadataResponse = await fetch(`/songs/${folder}/info.json`);
                if (!metadataResponse.ok) throw new Error(`Failed to fetch info for ${folder}`);
                let metadata = await metadataResponse.json();
                cardContainer.innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2>${metadata.title}</h2>
                        <p>${metadata.description}</p>
                    </div>`;
            }
        }
        attachAlbumListeners();
    } catch (error) {
        console.error('Error displaying albums:', error);
    }
}

function attachAlbumListeners() {
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async () => {
            songs = await getSongs(`songs/${e.dataset.folder}`);
            playMusic(songs[0]);
        });
    });
}

async function main() {
    try {
        await getSongs("songs/ncs");
        playMusic(songs[0], true);
        await displayAlbums();

        const playButton = document.querySelector("#play");

        if (!playButton) {
            console.error("Play button not found");
            return;
        }

        playButton.addEventListener("click", () => {
            if (currentSong.paused) {
                if (!currentSong.src || currentSong.src === "") {
                    playMusic(songs[0]);
                } else {
                    currentSong.play();
                }
                playButton.src = "pause.svg";
            } else {
                currentSong.pause();
                playButton.src = "play.svg";
            }
        });

        currentSong.addEventListener("timeupdate", () => {
            document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        });

        document.querySelector(".seekbar").addEventListener("click", e => {
            let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            document.querySelector(".circle").style.left = percent + "%";
            currentSong.currentTime = (currentSong.duration * percent) / 100;
        });
  
        document.querySelector(".hamburger").addEventListener("click", () => {
            document.querySelector(".left").style.left = "0";
        });
  
        document.querySelector(".close").addEventListener("click", () => {
            document.querySelector(".left").style.left = "-120%";
        });
  
        document.querySelector("#previous").addEventListener("click", () => {
            currentSong.pause();
            let currentTrack = decodeURI(currentSong.src.split("/").pop()); 
            let index = songs.indexOf(currentTrack); 
            if (index > 0) {
                playMusic(songs[index - 1]); 
            } else {
                playMusic(songs[songs.length - 1]); 
            }
        });
        
        document.querySelector("#next").addEventListener("click", () => {
            currentSong.pause();
            let currentTrack = decodeURI(currentSong.src.split("/").pop()); 
            let index = songs.indexOf(currentTrack); 
            if (index < songs.length - 1) {
                playMusic(songs[index + 1]); 
            } else {
                playMusic(songs[0]); 
            }
        });
        
  
  

        document.querySelector(".range input").addEventListener("change", e => {
            currentSong.volume = parseInt(e.target.value) / 100;
            let volumeIcon = document.querySelector(".volume > img");
            volumeIcon.src = currentSong.volume > 0 ? volumeIcon.src.replace("mute.svg", "volume.svg") : volumeIcon.src.replace("volume.svg", "mute.svg");
        });

        document.querySelector(".volume > img").addEventListener("click", e => {
            let volumeIcon = e.target;
            if (volumeIcon.src.includes("volume.svg")) {
                volumeIcon.src = volumeIcon.src.replace("volume.svg", "mute.svg");
                currentSong.volume = 0;
                document.querySelector(".range input").value = 0;
            } else {
                volumeIcon.src = volumeIcon.src.replace("mute.svg", "volume.svg");
                currentSong.volume = 0.1;
                document.querySelector(".range input").value = 10;
            }
        });

    } catch (error) {
        console.error('Error initializing the application:', error);
    }
}

function toggleButton() {
    const body = document.body;
    const toggleCircle = document.querySelector('.toggle-circle');

    
    body.classList.toggle('dark-theme');
    body.classList.toggle('light-theme'); 

    
    if (body.classList.contains('dark-theme')) {
        toggleCircle.style.transform = 'translateX(25px)';
        console.log('Dark theme applied');
    } else {
        toggleCircle.style.transform = 'translateX(0)';
        console.log('Light theme applied');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const toggleButton = document.querySelector('.toggle-button');

    
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(`${currentTheme}-theme`);
    console.log(`Current theme: ${currentTheme}`);

    
    themeToggleButton.addEventListener('click', () => {
        console.log('Theme toggle button clicked');
        toggleButton();
        saveThemePreference();
    });

    
    toggleButton.addEventListener('click', () => {
        toggleButton();
        saveThemePreference();
    });
});

function saveThemePreference() {
    
    if (document.body.classList.contains('dark-theme')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
}




const songMetadata = {
    "Blinding Lights.mp3": "The Weeknd",
    "Bye Bye Bye.mp3": "NSYNC",
    "Darkside.mp3": "Alan Walker",
    "Light Switch.mp3": "Charlie Puth",
    "No Cap.mp3": "KR$NA", 
    "Strip That Down.mp3": "Liam Payne",
    "Sugar.mp3": "Maroon 5",
};

main();

