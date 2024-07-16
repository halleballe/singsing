function getLyrics(artist, track) {
    // Log the artist and track
    console.log(artist, track);

    // Construct the URL for fetching lyrics
    let url = `https://api.lyrics.ovh/v1/${artist}/${track}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            let lyrics = data.lyrics;

            // Clean up the lyrics formatting
            if (lyrics.includes('Paroles')) {
                lyrics = lyrics.split("\r\n")
                lyrics = lyrics.slice(1).join('\n');
            }

            lyrics = lyrics.replace(/\[.*?\]/g, "").replace(/\(.*?\)\n/g, "");
            if (lyrics.includes('\n\n\n\n')) {
                lyrics = lyrics.replace(/\n\n/g, "\n");
            }

            // Split lyrics into verses and choruses
            let versesAndChoruses = lyrics.split(/\n{2}/);

            // Display lyrics on the webpage
            let lyricsText = document.getElementById('lyrics');
            lyricsText.innerHTML = lyrics;

            // Reverse the order of verses and choruses
            versesAndChoruses.reverse();
            versesAndChoruses.forEach(verseOrChorus => {
                let lines = verseOrChorus.split('\n');
                if (lines.length >= 4) {
                    let question = lines.slice(0, 2).join('<br>');
                    let answer = lines.slice(2, 4).join('<br>');
                    console.log('Question:', question);
                    console.log('Answer:', answer);

                    let questionElement = document.getElementById('question');
                    questionElement.innerHTML = question;
                    let answerElement = document.getElementById('answer');
                    answerElement.innerHTML = '<span class="hidden-answer">Tap to show</span>';
                    answerElement.dataset.answer = answer;

                    // Add event listener to toggle answer visibility
                    answerElement.addEventListener('click', function() {
                        if (this.querySelector('.hidden-answer')) {
                            this.innerHTML = this.dataset.answer;
                        }
                    });

                    return;
                }
            });
        });
}

let track = 0;

document.getElementById('next-song').addEventListener('click', () => {
    NextSong(1);
});

document.getElementById('previous-song').addEventListener('click', () => {
    NextSong(-1);
});

function NextSong(increment) {
    track += increment;
    const songsInfo = JSON.parse(localStorage.getItem('songsInfo'));
    if (songsInfo && track < songsInfo.length && track >= 0) {
        const currentSong = songsInfo[track];
        document.getElementById('info').textContent = `${currentSong.firstArtist} - ${currentSong.songTitle}`;
        getLyrics(currentSong.firstArtist, currentSong.songTitle);
    } else {
        console.error('Track index out of bounds or songsInfo not found');
    }
}