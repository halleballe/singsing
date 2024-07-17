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
    //https://open.spotify.com/playlist/37i9dQZF1E378XSv3P3KTK
    let playlistId = playlistUrl.split('/').pop();
    console.log("url", playlistUrl)
    console.log("id", playlistId)
    try {
        const token = await getSpotifyToken();
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        const data = await response.json();

        const songsInfo = data.tracks.items.map(item => {
            const songTitle = item.track.name;
            const firstArtist = item.track.artists[0].name;
            return { songTitle, firstArtist };
        });

        return songsInfo;
    } catch (error) {
        console.error('Error fetching the playlist:', error);
        return null;
    }
}

async function getImageAndNameFromPlaylist(playlistUrl) {
    const playlistId = playlistUrl.split('/').pop();
    console.log("url", playlistUrl);
    console.log("id", playlistId);
    try {
        const token = await getSpotifyToken();
        
        // Fetch playlist data to get the name
        const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        const playlistData = await playlistResponse.json();
        const playlistName = playlistData.name;

        // Fetch playlist images
        const imagesResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/images`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        const imagesData = await imagesResponse.json();
        const coverImage = imagesData[0].url;

        return { coverImage, playlistName };
    } catch (error) {
        console.error('Error fetching the playlist:', error);
        return null;
    }
}

// Example usage
extractSongInfo('https://open.spotify.com/playlist/37i9dQZF1E378XSv3P3KTK');

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

let default_playlists=["https://open.spotify.com/playlist/1n3nyu1YGK6EBmED7M2xbc", "https://open.spotify.com/playlist/1bmOCClj7jqYfcE5112nds", "https://open.spotify.com/playlist/0HFPa0UyfmVGoSvqhalTbB"]

async function populatePlaylists() {
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

populatePlaylists();