const iconFolderPath = 'http://127.0.0.1:5000/static/media/icons/';

const pausePixilSrc = `${iconFolderPath}pausePixil.png`;
const pausePixilHoverSrc = `${iconFolderPath}pausePixilHover.png`;
const playPixilSrc = `${iconFolderPath}playPixil.png`;
const playPixilHoverSrc = `${iconFolderPath}playPixilHover.png`;

const blankPlayImgSrc = `${iconFolderPath}play.png`;
const globalPauseImgSrc = `${iconFolderPath}pausePixil.png`;
const globalPlayImgSrc = `${iconFolderPath}playPixil.png`;
const globalPlayingGifSrc = `${iconFolderPath}blackcropped.gif`;


const table = document.getElementById("songTable");
const mainAudio = document.getElementById("mainAudio");
document.getElementById("seekBar").onmousedown = mouseDown;

window.createPage = createPage; /* allows for body onload of createPage() */


let lastSongNum = null;
let draggingSong = false;


import setEventSongNum, {prepareHeaderButtonListeners, prepareFooterButtonListeners, fileDropHandler, dragOverHandler} from '/static/eventScript.js'
window.dragOverHandler = dragOverHandler;
window.fileDropHandler = fileDropHandler;



mainAudio.addEventListener('timeupdate', () => {
	const songPosition = mainAudio.currentTime / mainAudio.duration;
	if(isNaN(songPosition)){
		return;
	}
	seekBarProgress.style.width = `${songPosition * 100}%`;

	const minutes = Math.floor(mainAudio.currentTime / 60);
	let seconds = Math.floor(mainAudio.currentTime % 60);

	if(seconds < 10){
		seconds = `0${seconds}`;
	}


	const updateCurrentTime = document.getElementById('currentTimeStamp');
	updateCurrentTime.innerText = `${minutes}:${seconds}`;

	if(songPosition == 1 && !draggingSong){ //if the song finishes naturally: revert the song that just finished back to its original state
		const lastSongObject = table.rows[lastSongNum-1].firstElementChild.firstElementChild.getSongObject;
		seekBarProgress.style.width = '0%';

		/*if the last song in the playlist finishes playing... revert the player. Otherwise, play the next song*/
		if(lastSongObject.songNum === table.rows.length){ 
			document.getElementById('footerPlayImg').src = determinePlayImgSrc();
			getSongImage(lastSongNum-1);
			document.getElementById('currentTimeStamp').innerText = '-.--';
			document.getElementById('playingTitleID').innerText = 'Playing:';
			document.getElementById('timeLength').innerText = '-.--';
			lastSongObject.isPlaying = false;

			lastSongNum = null;
			setEventSongNum(lastSongNum);	
		}
		else{
			const nextSongNum = lastSongNum;
			table.rows[nextSongNum].firstElementChild.firstElementChild.click();
		}
	}
});



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

	calculateDragWidthAndTime();

	document.onmouseup = stopDragElement;
	document.onmousemove = dragElement;
}

function dragElement(event) {
	const e = event || window.event;
	e.preventDefault();

	calculateDragWidthAndTime();
}


function stopDragElement() {
	document.onmouseup = null;
	document.onmousemove = null;
	
	draggingSong = false;

	const currentSongSrc = table.rows[lastSongNum-1].firstElementChild.firstElementChild.src;
	if(currentSongSrc === globalPlayingGifSrc){ //if it was playing (paused temporarily due to dragElement), then resume play
		mainAudio.play();
	} 
}


/* -------helper functions------- */
function getCSSProperty(ID, Property){
	let element = document.getElementById(ID);
	let elementProperty = window.getComputedStyle(element).getPropertyValue(Property);
	return elementProperty;
}

function calculateDragWidthAndTime(){
	const getSeekBarWidth = getCSSProperty('seekBar', 'width');
	const seekBarWidth = getSeekBarWidth.slice(0, getSeekBarWidth.indexOf('px')); /* remove 'px' from given width */

	const clickedPos = event.clientX;
	const seekBarLeftOffset = seekBar.getBoundingClientRect().left;
	const middleOfHandle = seekBarHandle.getBoundingClientRect().width / 2;

	const clickedWidth = clickedPos - seekBarLeftOffset - middleOfHandle;
	seekBarProgress.style.width = `${(clickedWidth / seekBarWidth) * 100}%`;

	mainAudio.currentTime = (parseFloat(seekBarProgress.style.width) / 100) * mainAudio.duration;
}
/* ^^^^^^ ---helper functions--- ^^^^^^ */


function createPage(){

	/* creates Table */
	const numOfPlaylistSongs = document.getElementById('scriptTag').getAttribute('numOfSongs');
	for(let songCount = 1; songCount <= numOfPlaylistSongs; songCount++){ /*Songs*/
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
		let currentCoverSrc = await getSongImage(index);
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



export function addRow(songCount, numOfPlaylistSongs){
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

	if(songCount < numOfPlaylistSongs){
		const songDivider = document.createElement('div');
		songDivider.className = "songDivider";
		tr.appendChild(songDivider);
	}

	songObject.coverImg.addEventListener('click', () => {

		const currentSongNum = songObject.songNum;
		if(lastSongNum !== currentSongNum){ //If the last song is different than the current song
			if(lastSongNum !== null){ //If a song has been played before set corresponding image to the paused icon
				getSongImage(lastSongNum-1);
				songObject.isPlaying = false;
			}
			mainAudio.src = `static/media/songs/${songObject.wholeSongName}.mp3`;

			const playingTitleDiv = document.getElementById('playingTitleID');
			playingTitleDiv.innerText = `Playing: ${songObject.wholeSongName}`;

			const playingTimeLengthDiv = document.getElementById('playingTimeLength');
			playingTimeLengthDiv.innerText = songObject.songDuration.innerText;
		}

		

		if(songObject.isPlaying){
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

			return;
		}

		lastSongNum = currentSongNum;
		setEventSongNum(lastSongNum);

		mainAudio.play();
		songObject.isPlaying = true;
		songObject.coverImg.src = globalPlayingGifSrc;
		document.getElementById('footerPlayImg').src = determinePauseImgSrc();
	});
}

function determinePlayImgSrc(){
	const footerImgElement = document.getElementById('footerPlayImg');

	if(footerImgElement.src === pausePixilHoverSrc){
		return footerImgElement.src = playPixilHoverSrc;
	}
	
	return footerImgElement.src = playPixilSrc;
}


function determinePauseImgSrc(){
	const footerImgElement = document.getElementById('footerPlayImg');

	if(footerImgElement.src === playPixilHoverSrc){
		return footerImgElement.src = pausePixilHoverSrc;
	}

	return footerImgElement.src = pausePixilSrc;
}



function addSongObject(songCount){
	this.songTitle = document.createElement('span');
	this.songTitle.setAttribute('class', 'songTitleOrArtist');

	this.songArtist = document.createElement('span');
	this.songArtist.setAttribute('class', 'songTitleOrArtist');

	this.songDuration = document.createElement('span');
	this.songDuration.setAttribute('class', 'songDurationClass');

	this.coverImg = document.createElement('img');
	this.coverImg.setAttribute('class', 'coverImg');

	this.coverImg.getSongObject = this; //way to reference the object itself in other functions. Probably a cleaner solution to this
	
	this.wholeSongName = '';

	this.songNum = songCount;

	this.isPlaying = false;
}



function addEntryInfo(){
	const songNamesList = arrayifyFlaskData('songNames');
	const titleList = arrayifyFlaskData('songTitles');
	const artistList = arrayifyFlaskData('songArtists');
	const durationsList = arrayifyFlaskData('songDurations')

	let songObject = table.rows[0].firstElementChild.firstElementChild.getSongObject;

	songNamesList.forEach((songName, index) => {
		songObject = table.rows[index].firstElementChild.firstElementChild.getSongObject;

		let wholeSongName = songName.slice(0, songName.indexOf(".mp3"));

		songObject.wholeSongName = wholeSongName;
		songObject.songTitle.innerText = titleList[index];
		songObject.songArtist.innerText = artistList[index];
		songObject.songDuration.innerText = durationsList[index];


		getSongImage(index);
	});
}


async function getSongImage(index){
	const songNamesList = arrayifyFlaskData('songNames');

	const currentSongName = songNamesList[index].slice(0, songNamesList[index].indexOf(".mp3")); //removes .mp3 extension
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


function arrayifyFlaskData(getAttribute){
	const arr = document.getElementById('scriptTag').getAttribute(getAttribute).split(",");

	const arrLength = arr.length;
	const lastIndex = arrLength - 1;
	for(let index = 0; index < arrLength; index++){
		arr[index] = arr[index].slice(2, arr[index].length-1); // removes ', ' between each entry
		if(index === lastIndex){
			arr[index] = arr[index].slice(0, arr[index].length-1); //handle last element with closing bracket
		}
	}

	return arr;
}