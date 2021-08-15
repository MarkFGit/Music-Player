const iconFolderPath = 'http://127.0.0.1:5000/static/media/icons/';
const globalPauseImgSrc = `${iconFolderPath}pause.png`;
const globalPauseHoverImgSrc = `${iconFolderPath}hoverPause.png`;
const globalPlayImgSrc = `${iconFolderPath}playSong.png`;
const globalPlayHoverImgSrc = `${iconFolderPath}hoverPlay.png`;
const blankPlayImgSrc = `${iconFolderPath}play.png`;
const globalPlayingGifSrc = `${iconFolderPath}playing.gif`;


const table = document.getElementById("songTable");
const mainAudio = document.getElementById("mainAudio");


let lastSongNum = null;
let draggingSong = false;

window.dragOverHandler = dragOverHandler;
window.fileDropHandler = fileDropHandler;
window.createPage = createPage;
window.mouseDown = mouseDown;

import './_globalVars.scss'
import './main.scss';
import './homePage.scss';
import './lowerBarStyles.scss'
import './globalComponentStyles.scss';

import './globalEventListener.js';

import updateEventScriptSongNum, {prepareHeaderButtonListeners, 
	   prepareFooterButtonListeners, } from './eventScript.js';

import dragOverHandler, {fileDropHandler, incrementPlayCount,
		createNewPlaylistToServer} from './contactServer.js'

import getSongImage, {fillPlaylistPreviewImages, 
	determineFooterPlayImgSrc} from './findImages.js'

export function clickSongBySongNum(songNum){
	table.rows[songNum].firstElementChild.firstElementChild.click();
}

function updateSongNum(currentSongNum){
	lastSongNum = currentSongNum;
	updateEventScriptSongNum(lastSongNum);
}


mainAudio.addEventListener('timeupdate', () => {
	const songPosition = mainAudio.currentTime / mainAudio.duration;
	if(isNaN(songPosition)) return;

	updatePlayingSongTimestamp(songPosition);

	const playingSongEndedNaturally = (songPosition == 1 && !draggingSong);
	if(playingSongEndedNaturally){
		seekBarProgress.style.width = '0%';

		console.log(lastSongNum - 1)
		const currentSongObject = table.rows[lastSongNum-1].firstElementChild.firstElementChild.getSongObject;
		incrementPlayCount(currentSongObject);
		const isLastPlaylistSong = (currentSongObject.songNum === table.rows.length);
		if(isLastPlaylistSong){ 
			revertPageToNoSong(currentSongObject);
			return;
		}
		const nextSongNum = lastSongNum;
		clickSongBySongNum(nextSongNum);
	}
});

function updatePlayingSongTimestamp(songPosition){
	seekBarProgress.style.width = `${songPosition * 100}%`;

	const minutes = Math.floor(mainAudio.currentTime / 60);
	let seconds = Math.floor(mainAudio.currentTime % 60);

	if(seconds < 10){
		seconds = `0${seconds}`;
	}

	const updateCurrentTime = document.getElementById('currentTimeStamp');
	updateCurrentTime.innerText = `${minutes}:${seconds}`;
}



function revertPageToNoSong(songObject){
	songObject.isPlaying = false;

	document.getElementById('footerPlayImg').src = determineFooterPlayImgSrc(songObject.isPlaying);
	getSongImage(lastSongNum-1);
	document.getElementById('currentTimeStamp').innerText = '-:--';
	document.getElementById('playingTitleID').innerText = 'Playing:';
	document.getElementById('playingTimeLength').innerText = '-:--';
	table.rows[songObject.songNum - 1].style = "background-color: ;";
	mainAudio.src = "";
	
	updateSongNum(null);
}



function mouseDown(event) {
	const noSelectedAudioSrc = "http://127.0.0.1:5000/lastAdded";
	if(mainAudio.src === noSelectedAudioSrc){
		console.log("%cError: Cannot use seekbar when no song is selected.", "color: red");
		return;
	}

	draggingSong = true;
	mainAudio.pause();

	const e = event || window.event;
	e.preventDefault();

	calculateDragWidth();
	calculateCurrentTime();

	document.onmouseup = stopDragElement;
	document.onmousemove = dragElement;
}

function dragElement(event) {
	const e = event || window.event;
	e.preventDefault();

	calculateDragWidth();
	calculateCurrentTime();
}


function stopDragElement() {
	document.onmouseup = null;
	document.onmousemove = null;
	
	draggingSong = false;

	const currentSongSrc = table.rows[lastSongNum-1].firstElementChild.firstElementChild.src;
	const pausedFromDragging = (currentSongSrc === globalPlayingGifSrc);
	if(pausedFromDragging) mainAudio.play();
}



function calculateDragWidth(){
	const seekBar = document.getElementById('seekBar');
	const seekBarWidth = parseFloat(window.getComputedStyle(seekBar).getPropertyValue('width'));

	const clickedPos = event.clientX;
	const seekBarLeftOffset = seekBar.getBoundingClientRect().left;
	const middleOfHandle = seekBarHandle.getBoundingClientRect().width / 2;
	const clickedWidth = clickedPos - seekBarLeftOffset - middleOfHandle;

	seekBarProgress.style.width = `${(clickedWidth / seekBarWidth) * 100}%`;
}

function calculateCurrentTime(){
	mainAudio.currentTime = (parseFloat(seekBarProgress.style.width) / 100) * mainAudio.duration;
}

function createPage(){
	const numOfPlaylistSongs = document.getElementById('scriptTag').getAttribute('numOfSongs');
	for(let songCount = 1; songCount <= numOfPlaylistSongs; songCount++){ /* Creates table */
		addRow(songCount, numOfPlaylistSongs);
	}

	addEntryInfoToAllRows();

	fillPlaylistPreviewImages();
	prepareHeaderButtonListeners();
	prepareFooterButtonListeners();
}



function addRow(songCount, numOfPlaylistSongs){
	const songObject = new addSongObject(songCount);

	const tr = table.insertRow(-1);
	tr.setAttribute('class','songRowClass');

	const songContainer = document.createElement('div');
	songContainer.setAttribute('class','songContainer');
	tr.appendChild(songContainer);

	const songInfoDiv = tr.childNodes[0];
	songInfoDiv.appendChild(songObject.coverImg);
	songInfoDiv.appendChild(songObject.songTitle);
	songInfoDiv.appendChild(songObject.songDuration);
	songInfoDiv.appendChild(songObject.songArtist);
	songInfoDiv.appendChild(songObject.songAlbum);
	songInfoDiv.appendChild(songObject.songPlays);

	if(songCount < numOfPlaylistSongs){
		const songDivider = document.createElement('div');
		songDivider.className = "songDivider";
		tr.appendChild(songDivider);
	}

	addSongImgEventListener(songObject);
}


function addSongImgEventListener(songObject){
	songObject.coverImg.addEventListener('click', () => {

		const currentSongNum = songObject.songNum;
		if(lastSongNum !== currentSongNum){
			if(lastSongNum !== null){ //revert previous song/row
				getSongImage(lastSongNum-1);
				songObject.isPlaying = false;
				table.rows[lastSongNum-1].style = "";
			}
			mainAudio.src = `static/media/songs/${songObject.songFileName}`;

			const playingTitleDiv = document.getElementById('playingTitleID');
			const songNameWithoutExtension = removeFileExtension(songObject.songFileName);
			playingTitleDiv.innerText = `Playing: ${songNameWithoutExtension}`;

			const playingTimeLengthDiv = document.getElementById('playingTimeLength');
			playingTimeLengthDiv.innerText = songObject.songDuration.innerText;

			table.rows[currentSongNum - 1].style = "background-color: #161616;";
			
			playlistScrollIfNeeded(currentSongNum);
		}

		if(songObject.isPlaying) return pauseSong(songObject);

		updateSongNum(currentSongNum);
		playNextSong(songObject);

	});
}


function playlistScrollIfNeeded(currentSongNum){
	const playlistContainer = document.getElementById('playlistContentContainer');
	const playlistContainerCoords = playlistContainer.getBoundingClientRect();
	const currentRowCoords = table.rows[currentSongNum - 1].getBoundingClientRect();

	if(currentRowCoords.bottom > playlistContainerCoords.bottom){
		table.rows[currentSongNum - 1].scrollIntoView(false);
		return;
	}

	if(currentRowCoords.top < playlistContainerCoords.top){
		table.rows[currentSongNum - 1].scrollIntoView();
	}
}


function pauseSong(songObject){
	const playPromise = mainAudio.play();

	if(playPromise !== undefined){
		playPromise.then(() => {
			mainAudio.pause();
			songObject.isPlaying = false;
			getSongImage(songObject.songNum-1);
			document.getElementById('footerPlayImg').src = determineFooterPlayImgSrc(songObject.isPlaying);
		})
		.catch(error => {
			console.log(`Error from pausing is: %c${error}`,"color: red;");
		});
	}
}


function playNextSong(songObject){
	mainAudio.play();
	songObject.isPlaying = true;
	songObject.coverImg.src = globalPlayingGifSrc;
	document.getElementById('footerPlayImg').src = determineFooterPlayImgSrc(songObject.isPlaying);
}


function addSongObject(songCount){
	this.coverImg = document.createElement('img');
	this.coverImg.setAttribute('class', 'coverImg');

	//way to reference the object itself in other functions. Probably a cleaner solution to this
	this.coverImg.getSongObject = this; 

	this.songTitle = document.createElement('span');
	this.songTitle.setAttribute('class', 'songTitles');
	this.songDuration = document.createElement('span');
	this.songDuration.setAttribute('class', 'songDurationClass');
	this.songArtist = document.createElement('span');
	this.songArtist.setAttribute('class', 'songArtistOrAlbum');
	this.songAlbum = document.createElement('span');
	this.songAlbum.setAttribute('class', 'songArtistOrAlbum');
	this.songPlays = document.createElement('span');
	this.songPlays.setAttribute('class', 'playsWidth');
	this.songFileName = '';
	this.songNum = songCount;
	this.isPlaying = false;
}



function addEntryInfoToAllRows(){
	const songNamesList = JSON.parse(document.getElementById('scriptTag').getAttribute('songNames'));
	const titleList = JSON.parse(document.getElementById('scriptTag').getAttribute('songTitles'));
	const artistList = JSON.parse(document.getElementById('scriptTag').getAttribute('songArtists'));
	const durationsList = JSON.parse(document.getElementById('scriptTag').getAttribute('songDurations'));
	const albumsList = JSON.parse(document.getElementById('scriptTag').getAttribute('songAlbums'));
	const playsList = JSON.parse(document.getElementById('scriptTag').getAttribute('songPlays'));

	songNamesList.forEach((songName, index) => {
		const songObject = table.rows[index].firstElementChild.firstElementChild.getSongObject;

		songObject.songFileName = songName;
		songObject.songTitle.innerText = titleList[index];
		songObject.songArtist.innerText = artistList[index];
		songObject.songDuration.innerText = durationsList[index];
		songObject.songAlbum.innerText = albumsList[index];
		songObject.songPlays.innerText = playsList[index];

		getSongImage(index);
	});
}


export function removeFileExtension(fileName){
	return fileName.slice(0, fileName.lastIndexOf("."));
}