import { signOut } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function () {
    const firebaseConfig = {
        apiKey: "AIzaSyD8vqVDweadKCcELrEWx9I0Hw63r11n8mU",
        authDomain: "sdsouncloud.firebaseapp.com",
        projectId: "sdsouncloud",
        storageBucket: "sdsouncloud.appspot.com",
        messagingSenderId: "104219545502",
        appId: "1:104219545502:web:7118b6151630683b45108f",
        measurementId: "G-7MM2V4VVGR"
    };
    const app = initializeApp(firebaseConfig);
    const auth = getAuth();
    firebase.initializeApp(firebaseConfig);

    var database = firebase.database();
    var songs = [];
    var currentPage = 1;
    var currentResults = [];
    var currentResultsPage = 1;

    database.ref('/songs').once('value').then(function (snapshot) {
        songs = snapshot.val();
        currentResults = songs;
        displaySongs();
    });

    function displaySongs() {
        var resultsDiv = document.getElementById('search-results');
        resultsDiv.innerHTML = '';
        var start = (currentResultsPage - 1) * 5;
        var end = start + 5;
        for (var i = start; i < end && i < currentResults.length; i++) {
            let resultDiv = document.createElement('div');
            if (typeof currentResults[i] === 'object') {
                resultDiv.textContent = currentResults[i].title + ' by ' + currentResults[i].artist; 
                resultDiv.addEventListener('click', createSongClickHandler(currentResults[i]));
            } else {
                resultDiv.textContent = currentResults[i];
                resultDiv.addEventListener('click', function() {
                    var value = this.textContent;
                    var filter = document.getElementById('filter').value;
                    var filteredSongs = songs.filter(function(song) {
                        return song[filter] === value;
                    });
                    currentResults = filteredSongs;
                    currentResultsPage = 1;
                    displaySongs();
                });
            }
            resultsDiv.appendChild(resultDiv);
        }
        document.getElementById('current-page').textContent = currentResultsPage;
    }
    

    function createSongClickHandler(song) {
        return function() {
            searchYouTube(song.title + ' ' + song.artist);
        };
    }

    function searchYouTube(query) {
        var url = 'https://www.googleapis.com/youtube/v3/search';
        var params = {
            key: 'AIzaSyDSRCp6jPZIWpaPhx0A6DsacxBJGV4vLMc',
            q: query,
            part: 'snippet',
            type: 'video',
            maxResults: 5 
        };
    
        fetch(url + '?' + new URLSearchParams(params))
            .then(response => response.json())
            .then(data => {
                if (data.items.length > 0) {
                    var videoList = document.getElementById('video-list');
                    videoList.innerHTML = '';
                    data.items.forEach(function(item) {
                        var videoId = item.id.videoId;
                        var videoTitle = item.snippet.title;
                        var thumbnailUrl = item.snippet.thumbnails.default.url;
                        var videoItem = document.createElement('li');
                        var thumbnailImg = document.createElement('img');
                        thumbnailImg.src = thumbnailUrl;
                        var titleSpan = document.createElement('span');
                        titleSpan.textContent = videoTitle;
                        videoItem.appendChild(thumbnailImg);
                        videoItem.appendChild(titleSpan);
                        videoItem.addEventListener('click', function() {
                            playSongOnYouTube(videoId);
                        });
                        videoList.appendChild(videoItem);
                    });
                } else {
                    console.log('No se encontraron videos');
                }
            })
            .catch(error => console.error('Error:', error));
    }
    
    function playSongOnYouTube(videoId) {
        var youtubeUrl = 'https://www.youtube.com/watch?v=' + videoId;
        window.open(youtubeUrl, '_blank', 'width=560,height=315');
    }

    document.getElementById('prev-page').addEventListener('click', function () {
        if (currentResultsPage > 1) {
            currentResultsPage--;
            displaySongs();
        } else {
            alert('Esta es la primera página');
        }
    });

    document.getElementById('next-page').addEventListener('click', function () {
        if (currentResultsPage < Math.ceil(currentResults.length / 5)) {
            currentResultsPage++;
            displaySongs();
        } else {
            alert('Esta es la última página');
        }
    });

    document.getElementById('search-input').addEventListener('input', function () {
        var searchQuery = this.value.toLowerCase();
        var resultsDiv = document.getElementById('search-results');
        resultsDiv.innerHTML = '';

        if (searchQuery) {
            var filteredSongs = songs.filter(function(song) {
                return song.title.toLowerCase().includes(searchQuery) || song.artist.toLowerCase().includes(searchQuery);
            });

            if (filteredSongs.length > 0) {
                currentResults = filteredSongs;
                currentResultsPage = 1;
                displaySongs();
            } else {
                resultsDiv.textContent = 'No se encontraron canciones';
            }
        } else {
            currentResults = songs;
            currentResultsPage = 1;
            displaySongs();
        }
    });

    document.getElementById('search-form').addEventListener('submit', function (event) {
        event.preventDefault(); 
        var filter = document.getElementById('filter').value;
        var searchInput = document.getElementById('search-input');

        switch(filter) {
            case 'genre':
                searchInput.disabled = true;
                database.ref('/songs').orderByChild('genre').once('value').then(function(snapshot) {
                    currentResults = [];
                    snapshot.forEach(function(childSnapshot) {
                        var genre = childSnapshot.val().genre;
                        if (!currentResults.includes(genre)) {
                            currentResults.push(genre);
                        }
                    });
                    currentResultsPage = 1;
                    displaySongs();
                });
                break;
            case 'artist':
                searchInput.disabled = true;
                database.ref('/songs').orderByChild('artist').once('value').then(function(snapshot) {
                    currentResults = [];
                    snapshot.forEach(function(childSnapshot) {
                        var artist = childSnapshot.val().artist;
                        if (!currentResults.includes(artist)) {
                            currentResults.push(artist);
                        }
                    });
                    currentResultsPage = 1;
                    displaySongs();
                });
                break;
            case 'year':
                searchInput.disabled = true;
                database.ref('/songs').orderByChild('year').once('value').then(function(snapshot) {
                    currentResults = [];
                    snapshot.forEach(function(childSnapshot) {
                        var year = childSnapshot.val().year;
                        if (!currentResults.includes(year)) {
                            currentResults.push(year);
                        }
                    });
                    currentResultsPage = 1;
                    displaySongs();
                });
                break;
            default:
                searchInput.disabled = false;
                currentResults = songs;
                currentResultsPage = 1;
                displaySongs();
                break;
        }
    });
    document.getElementById('logout-button').addEventListener('click', function () {
        signOut(auth).then(() => {
            alert('Has cerrado sesión satisfactoriamente.');
            window.location.href = './index.html'; 
        }).catch((error) => {
            console.error('Error:', error);
        });
    });


});
