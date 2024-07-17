async function getLyrics() {
    let count=100
    while(count){
        count--;
    //when flashcard is updated, prepare the next card
    track += 1;
    let artist;
    let song;
    let songsInfo = JSON.parse(localStorage.getItem('songsInfo'));
    if (songsInfo && track < songsInfo.length && track >= 0) {
        let currentSong = songsInfo[track];
        //save everything in local storage
        localStorage.setItem('currentSong', JSON.stringify(currentSong));
        artist = currentSong.firstArtist
        song = currentSong.songTitle
        
    } else {
        console.error('Track index out of bounds or songsInfo not found');
    }
// Log the artist and track
console.log("searching for", artist, song);


song = song.split(" - ")[0];
// Construct the URL for fetching lyrics
let url = `https://api.lyrics.ovh/v1/${artist}/${song}`;
try {
    let response = await fetch(url);
    let data = await response.json();
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


    for (let verseOrChorus of versesAndChoruses) {
        let lines = verseOrChorus.split('\n');
        if (lines.length >= 4) {
            let question = lines.slice(0, 2).join('<br>');
            let answer = lines.slice(2, 4).join('<br>');
            localStorage.setItem('question', question);
            localStorage.setItem('answer', answer);
            console.log('Question:', question);
            console.log('Answer:', answer);
            //here everything stops
            return;
        }
    }console.log("not found")
    getLyrics();

} catch (error) {
    console.error('Error fetching lyrics:', error);
    return null;
}
    }
    }
        
        

let track = 0;

document.getElementById('start-button').addEventListener('click', () => {
    swooshCard();
    NextSong(1);
});



function NextSong(increment) {
    try{
        let currentSong = JSON.parse(localStorage.getItem('currentSong'));
        let question = localStorage.getItem('question');
        let answer = localStorage.getItem('answer');
    
        //update the flashcard
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
    
        document.getElementById('info').textContent = `${currentSong.firstArtist} - ${currentSong.songTitle}`;

    }
    catch(e){
        console.error(e);
    }

    getLyrics();

   
}


async function swooshCard() {
    console.log("swooshing")
    const card = document.getElementById('shadow');
    card.classList.add('swoosh-up');
    setTimeout(() => {
        // Code to be executed after one second
        card.classList.remove('swoosh-up');
        const flashcardInnerHtml = document.getElementById('flashcard').innerHTML;
        document.getElementById('shadow').innerHTML = flashcardInnerHtml;
    }, 800);
    
}


document.getElementById('shadow').addEventListener('click', revealAnswer);

function revealAnswer() {
    let answerElements = document.querySelectorAll('.hidden-answer');
    answerElements.forEach(answerElement => {
        let parent = answerElement.parentElement;
        if (parent) {
            parent.innerHTML = parent.dataset.answer;
        }
    });
}


NextSong();
