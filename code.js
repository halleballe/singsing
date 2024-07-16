document.getElementById('submit').addEventListener('click', on_submit);


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
