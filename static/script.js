const iconFolderPath = 'http://127.0.0.1:5000/static/media/icons/';
const globalPauseImgSrc = `${iconFolderPath}pausePixil.png`;
const globalPauseHoverImgSrc = `${iconFolderPath}pausePixilHover.png`;
const globalPlayImgSrc = `${iconFolderPath}playPixil.png`;
const globalPlayHoverImgSrc = `${iconFolderPath}playPixilHover.png`;
const blankPlayImgSrc = `${iconFolderPath}play.png`;
const globalPlayingGifSrc = `${iconFolderPath}blackcropped.gif`;


const table = document.getElementById("songTable");
const mainAudio = document.getElementById("mainAudio");




let lastSongNum = null;
let draggingSong = false;

window.dragOverHandler = dragOverHandler;
window.fileDropHandler = fileDropHandler;
window.createPage = createPage;
window.mouseDown = mouseDown;

import updateEventScriptSongNum, {prepareHeaderButtonListeners, 
	   prepareFooterButtonListeners, fileDropHandler, dragOverHandler} from '/static/eventScript.js';

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


function incrementPlayCount(currentSongObject){
	const songName = currentSongObject.songFileName;
	const form = new FormData();
	form.append("songName", songName);

	const xhr = new XMLHttpRequest();
	xhr.open("POST", '/updatePlays', true);
	xhr.send(form);

	xhr.onreadystatechange = () => {
		if(xhr.readyState === 4 && xhr.status === 200){
			const currentPlayNum = parseInt(currentSongObject.songPlays.innerText);
			currentSongObject.songPlays.innerText =  currentPlayNum + 1;
		}	
	}
}


function revertPageToNoSong(currentSongObject){
	document.getElementById('footerPlayImg').src = determinePlayImgSrc();
	getSongImage(lastSongNum-1);
	document.getElementById('currentTimeStamp').innerText = '-:--';
	document.getElementById('playingTitleID').innerText = 'Playing:';
	document.getElementById('playingTimeLength').innerText = '-:--';
	currentSongObject.isPlaying = false;

	updateSongNum(null);
}



function mouseDown(event) {
	const noSelectedAudioSrc = "http://127.0.0.1:5000/";
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


function getCSSProperty(ID, Property){
	let element = document.getElementById(ID);
	let elementProperty = window.getComputedStyle(element).getPropertyValue(Property);
	return elementProperty;
}

function calculateDragWidth(){
	const getSeekBarWidth = getCSSProperty('seekBar', 'width');
	const seekBarWidth = getSeekBarWidth.slice(0, getSeekBarWidth.indexOf('px')); /* remove 'px' from given width */
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

	if(numOfPlaylistSongs > 0){
		addEntryInfo();
	}

	fillPlaylistPreviewImages();
	prepareHeaderButtonListeners();
	prepareFooterButtonListeners();
}

async function fillPlaylistPreviewImages(){

	const numOfPlaylistSongs = document.getElementById('scriptTag').getAttribute('numOfSongs');
	let numOfFoundPreviewImages = 0;
	const maxNumOfPreviews = 4;

	for(let index = 0; index < numOfPlaylistSongs; index++){
		const currentCoverSrc = await getSongImage(index);
		if(currentCoverSrc !== undefined){
			document.getElementById(`coverPreview${numOfFoundPreviewImages}`).src = currentCoverSrc;
			numOfFoundPreviewImages++;
		}
		if(numOfFoundPreviewImages === maxNumOfPreviews){
			return;
		}
	}
	
	while(numOfFoundPreviewImages < maxNumOfPreviews){
		document.getElementById(`coverPreview${numOfFoundPreviewImages}`).src = blankPlayImgSrc;
		numOfFoundPreviewImages++;
	}
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
	const playlistContainer = document.getElementById('playlistContainer');
	const bottomOfPlaylistContainer = playlistContainer.getBoundingClientRect().bottom;
	const bottomOfCurrentRow = table.rows[currentSongNum - 1].getBoundingClientRect().bottom;
	if(bottomOfCurrentRow > bottomOfPlaylistContainer){
		table.rows[currentSongNum - 1].scrollIntoView(false);
		return;
	}

	const topOfPlaylistContainer = playlistContainer.getBoundingClientRect().top;
	const topOfCurrentRow = table.rows[currentSongNum - 1].getBoundingClientRect().top;

	if(topOfCurrentRow < topOfPlaylistContainer){
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
			document.getElementById('footerPlayImg').src = determinePlayImgSrc();
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
	document.getElementById('footerPlayImg').src = determinePauseImgSrc();
}


function determinePlayImgSrc(){
	const footerImgElement = document.getElementById('footerPlayImg');
	if(footerImgElement.src === globalPauseHoverImgSrc){
		return footerImgElement.src = globalPlayHoverImgSrc;
	}
	return footerImgElement.src = globalPlayImgSrc;
}


function determinePauseImgSrc(){
	const footerImgElement = document.getElementById('footerPlayImg');
	if(footerImgElement.src === globalPlayHoverImgSrc){
		return footerImgElement.src = globalPauseHoverImgSrc;
	}
	return footerImgElement.src = globalPauseImgSrc;
}



function addSongObject(songCount){
	this.songTitle = document.createElement('span');
	this.songTitle.setAttribute('class', 'songTitles');
	this.songArtist = document.createElement('span');
	this.songArtist.setAttribute('class', 'songArtistOrAlbum');
	this.songDuration = document.createElement('span');
	this.songDuration.setAttribute('class', 'songDurationClass');
	this.coverImg = document.createElement('img');
	this.coverImg.setAttribute('class', 'coverImg');
	this.coverImg.getSongObject = this; //way to reference the object itself in other functions. Probably a cleaner solution to this
	this.songFileName = '';
	this.songNum = songCount;
	this.isPlaying = false;

	this.songAlbum = document.createElement('span');
	this.songAlbum.setAttribute('class', 'songArtistOrAlbum');
	this.songPlays = document.createElement('span');
	this.songPlays.setAttribute('class', 'playsWidth');
}



function addEntryInfo(){
	/* change this function */
		/* initialize variables before function call. loop through, pass variable indexes to new function*/
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


async function getSongImage(index){
	const songNamesList = JSON.parse(document.getElementById('scriptTag').getAttribute('songNames'));

	const currentSongName = removeFileExtension(songNamesList[index]);
	const songCoverPath = `static/media/songCovers/${currentSongName}.jpeg`;

	return await fetch(songCoverPath)
		.then(response => {
			const currentSongImg = table.rows[index].firstElementChild.firstElementChild;
			if (response.ok) {
				currentSongImg.setAttribute('src', songCoverPath);
				return songCoverPath;
			}
			if(response.status === 404) {
				currentSongImg.setAttribute('src', blankPlayImgSrc);
			    return;
			}
			console.log(`Find Image Error. Status of Error: %c${response.status}`,"color: red");
			return;
		})
	  	.catch(error => console.log('error is', error));
}

function removeFileExtension(fileName){
	return fileName.slice(0, fileName.lastIndexOf("."));
}


export function log(thingToConsoleLog){
	console.log(thingToConsoleLog);
}