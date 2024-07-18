async function getSpotifyToken() {
    const clientId = '099a572a8852440e9532813fc7d7f62e';
    const clientSecret = '3471b83dee2c4ec98506a3ae63260845';
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}

async function extractSongInfo(playlistUrl) {
    console.log("this is the URL",playlistUrl)
    let type="playlists"
    if (playlistUrl.includes("album")){
        console.log("this is an album")
        type="albums"
    }
    let playlistId = playlistUrl.split('/').pop().split("?")[0];
    console.log("url", playlistUrl);
    console.log("id", playlistId);
    try {
        const token = await getSpotifyToken();
        let response = await fetch(`https://api.spotify.com/v1/${type}/${playlistId}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        const data = await response.json();
        console.log("this is the data", data)
        let songsInfo;
        if (type == "playlists"){
            songsInfo = data.tracks.items.map(item => {
            console.log("it is doing it")
            const songTitle = item.track.name;
            const firstArtist = item.track.artists[0].name;
            return { songTitle, firstArtist };
        });
        }else{
        songsInfo = [];
        const items = data.tracks.items;
        for (let i = 0; i < items.length; i++) {
            console.log("it is doing it");
            const instance = items[i];
            const songTitle = instance.name;
            console.log(songTitle)
            const firstArtist = instance.artists[0].name;
            console.log(firstArtist)
            songsInfo.push({ songTitle, firstArtist });
        }
            
        }
       
        console.log(songsInfo)
        return songsInfo;
    } catch (error) {
        console.error('Error fetching the playlist or album:', error);
        return null;
    }
}

async function getImageAndNameFromPlaylist(playlistUrl) {
    console.log("getting image and playlist for",playlistUrl)
    let playlistId = playlistUrl.split('/').pop();
    playlistId  = playlistId.split("?")[0]

    let coverImage = "image.jpeg";
    let playlistName = "någonting gick fel";
    try {
        const token = await getSpotifyToken();
        
        // Fetch playlist data to get the name
        const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        const playlistData = await playlistResponse.json();
        console.log("response Name", playlistResponse)
        playlistName = playlistData.name;
        coverImage = playlistData.images[0].url
        
        return { coverImage, playlistName };
    } catch (error) {
        //may have been an album
        try {
            console.log("MAY HAVE BEEN AN ALBUM")
            // Fetch playlist data to get the name
            const token = await getSpotifyToken();
            const playlistResponse = await fetch(`https://api.spotify.com/v1/albums/${playlistId}`, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            const playlistData = await playlistResponse.json();
            playlistName = playlistData.name;
            coverImage = playlistData.images[0].url;
            console.log(coverImage)
            
            return { coverImage, playlistName };
        }catch{
            console.error('Error fetching the playlist:', error);
            return { coverImage, playlistName };
        }
        
    }
}


async function on_submit() {
    const playlistUrl = document.getElementById('playlistUrl').value;
    try {
        const songsInfo = await extractSongInfo(playlistUrl);
        const formattedSongs = songsInfo.map(song => `${song.songTitle} - ${song.firstArtist}`);
        document.getElementById('output').value = formattedSongs.join('\n');

        // Save songs info to local storage
        localStorage.setItem('songsInfo', JSON.stringify(songsInfo));

        // Create and display the "Play" button
        const playButton = document.createElement('button');
        playButton.textContent = 'Play';
        playButton.addEventListener('click', () => {
            window.location.href = 'flashcards.html';
        });
        document.body.appendChild(playButton);
    } catch (error) {
        console.error('Error extracting song info:', error);
        document.getElementById('output').value = 'Error extracting song info';
    }
}

let default_playlists=["https://open.spotify.com/playlist/1n3nyu1YGK6EBmED7M2xbc", "https://open.spotify.com/playlist/1bmOCClj7jqYfcE5112nds", "https://open.spotify.com/playlist/0HFPa0UyfmVGoSvqhalTbB", "https://open.spotify.com/playlist/4gEUNj0sdveR5y2gqQ0Sfr?si=e4ceeded8d8c4614"]
async function populateUserPlaylists() {
    let userPlaylists = JSON.parse(localStorage.getItem('userPlaylists')) || [];
    console.log("User", userPlaylists);
    document.getElementById('userPlaylists').innerHTML = '<div class="playlist-item list-group-item add-new"><img src="plus.png" alt="Playlist 1" class="img-thumbnail"><span>Lägg till ny Spellista</span></div>'; // Clear existing items
    document.querySelector('.playlist-item.add-new').addEventListener('click', showAddPlaylistModal);
    userPlaylists.forEach(async (playlistUrl) => {
        const { coverImage, playlistName } = await getImageAndNameFromPlaylist(playlistUrl);
        const playlistItem = document.createElement('div');
        playlistItem.classList.add('playlist-item', 'list-group-item');
        playlistItem.onclick = showStartButton;
        playlistItem.innerHTML = `
        <div class="playlist-content" style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center;">
                <img src="${coverImage}" alt="${playlistName}" class="img-thumbnail">
                <span>${playlistName}</span>
                <input type="hidden" value="${playlistUrl}">
            </div>
            <button class="delete-button">Delete</button>
        </div>
    `;
        document.getElementById('userPlaylists').appendChild(playlistItem);
        attachPlaylistItemListeners(); // Attach listeners to new items

        // Add delete button functionality
        playlistItem.querySelector('.delete-button').addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent triggering the playlist item click
            userPlaylists = userPlaylists.filter(url => url !== playlistUrl);
            localStorage.setItem('userPlaylists', JSON.stringify(userPlaylists));
            populateUserPlaylists(); // Refresh the list
        });
    });
}

async function populateDefaultPlaylists() {
    console.log("Default",userPlaylists)
    default_playlists.forEach(async (playlistUrl) => {
        const { coverImage, playlistName } = await getImageAndNameFromPlaylist(playlistUrl);
        const playlistItem = document.createElement('div');
        playlistItem.classList.add('playlist-item', 'list-group-item');
        playlistItem.onclick = showStartButton;
        playlistItem.innerHTML = `
        <img src="${coverImage}" alt="${playlistName}" class="img-thumbnail">
        <span>${playlistName}</span>
        <input type="hidden" value="${playlistUrl}">
    `;
        document.getElementById('defaultPlaylists').appendChild(playlistItem);
        attachPlaylistItemListeners(); // Attach listeners to new items
    });
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function getSelectedPlaylistUrl() {
    const selectedPlaylist = document.querySelector('.playlist-item.selected');
    if (selectedPlaylist) {
        const playlistUrl = selectedPlaylist.querySelector('input').value;
        try {
            let songsInfo = await extractSongInfo(playlistUrl); // Use await here
            songsInfo = shuffle(songsInfo);
            // Save songs info to local storage
            localStorage.setItem('songsInfo', JSON.stringify(songsInfo));
            window.location.href = 'flashcards.html';
        } catch (error) {
            console.error('Error extracting song info:', error);
            document.getElementById('output').value = 'Error extracting song info';
        }
    } else {
        alert('Please select a playlist first.');
    }
}

document.getElementById('start-button').addEventListener('click', getSelectedPlaylistUrl);

// Function to show the modal
function showAddPlaylistModal() {
    const modal = document.getElementById('addPlaylistModal');
    modal.style.display = 'block';
}

// Function to hide the modal
function hideAddPlaylistModal() {
    const modal = document.getElementById('addPlaylistModal');
    modal.style.display = 'none';
}

// Event listener for closing the modal
document.querySelector('.close').addEventListener('click', hideAddPlaylistModal);

// Event listener for form submission
document.getElementById('addPlaylistForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const playlistUrl = document.getElementById('playlistUrlInput').value;
    let userPlaylists = JSON.parse(localStorage.getItem('userPlaylists')) || [];
    userPlaylists.push(playlistUrl);
    localStorage.setItem('userPlaylists', JSON.stringify(userPlaylists));
    await populateUserPlaylists();
    hideAddPlaylistModal();
});

// Add event listener to the list item


populateDefaultPlaylists();
populateUserPlaylists();