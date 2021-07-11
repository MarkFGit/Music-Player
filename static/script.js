let lastSongNum = null;
const table = document.getElementById("songTable");
const mainAudio = document.getElementById("mainAudio");

let draggingSong = false;

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

	if(songPosition == 1 && !draggingSong){ //if the song finishes: revert the song that just finished back to its original state
		const lastSongObject = table.rows[lastSongNum-1].firstElementChild.firstElementChild.getSongObject;
		seekBarProgress.style.width = '0%';

		/*if the last song in the playlist finishes playing... revert the player. Otherwise, play the next song*/
		if(lastSongObject.songNum === table.rows.length){ 
			document.getElementById('footerPlayImg').src = "static/media/icons/playPixil.png";
			getSongImage(lastSongNum-1);
			lastSongObject.isPlaying = false;
			lastSongNum = null;
			document.getElementById('currentTimeStamp').innerText = '-.--';
			document.getElementById('playingTitleID').innerText = 'Playing:';
			document.getElementById('timeLength').innerText = '-.--';
		}
		else{
			table.rows[lastSongNum].firstElementChild.firstElementChild.click();
		}
	}
});

document.getElementById("seekBar").onmousedown = mouseDown;

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

	const playingGifSrc = "http://127.0.0.1:5000/static/media/icons/blackcropped.gif";
	const currentSongSrc = table.rows[lastSongNum-1].firstElementChild.firstElementChild.src;
	if(currentSongSrc === playingGifSrc){ //if it was playing (paused temporarily due to dragElement), then resume play
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

	seekBarProgress.style.width = `${((clickedPos - seekBarLeftOffset - middleOfHandle) / seekBarWidth) * 100}%`;

	mainAudio.currentTime = (parseFloat(seekBarProgress.style.width) / 100) * mainAudio.duration;
}
/* ^^^^^^ ---helper functions--- ^^^^^^ */


function createPage(){

	/* creates Table */
	const numOfPlaylistSongs = document.getElementById('scriptTag').getAttribute('numOfSongs');
	for(let songCount = 1; songCount <= numOfPlaylistSongs; songCount++){ /*Songs*/
		addRow(songCount);
	}
	addEntryInfo();

	preparePlaylistHeader();

	preparePlaylistFooter();
}

function preparePlaylistHeader(){
	fillPlaylistPreviewImages();

	const headerPlayIcon = document.getElementById('headerPlayIconID');

	headerPlayIcon.addEventListener('click', () => {
		if(lastSongNum === null){
			table.rows[0].firstElementChild.firstElementChild.click();
		}
	});

	headerPlayIcon.addEventListener('mouseover', () => {
		if(lastSongNum === null){
			headerPlayIcon.src = 'static/media/icons/playPixilHover.png';
			headerPlayIcon.style.cursor = 'pointer';
		}
	});

	headerPlayIcon.addEventListener('mouseout', () => {
		headerPlayIcon.src = 'static/media/icons/playPixil.png';
		headerPlayIcon.style.cursor = 'default';
	});
}

async function fillPlaylistPreviewImages(){

	const numOfPlaylistSongs = document.getElementById('scriptTag').getAttribute('numOfSongs');
	let list = [];
	let numOfFoundPreviewImages = 0;
	const maxNumOfPreviews = 4;

	for(let index = 0; index < numOfPlaylistSongs; index++){
		list.push(getSongImage(index));
	}

	list = await Promise.all(list);

	for(let index = 0; index < list.length; index++){
		if(list[index] !== undefined){
			document.getElementById(`coverPreview${numOfFoundPreviewImages}`).src = list[index][1];
			numOfFoundPreviewImages++;
		}
		if(numOfFoundPreviewImages === maxNumOfPreviews){
			return;
		}
	}

	
	for(numOfFoundPreviewImages; numOfFoundPreviewImages < maxNumOfPreviews; numOfFoundPreviewImages++){
		document.getElementById(`coverPreview${numOfFoundPreviewImages}`).src = 'static/media/icons/play.png';
	}
}


function preparePlaylistFooter(){

	const footerImgIDs = ['nextImg', 'footerPlayImg', 'prevImg'];
	const imgFileNames = ['nextPixil', 'playPixil', 'prevPixil'];

	const iconFolderPath = 'http://127.0.0.1:5000/static/media/icons';

	footerImgIDs.forEach((currentElementID, index) => {
		const currentElement = document.getElementById(currentElementID);

		const normalImgSrc = `${iconFolderPath}/${imgFileNames[index]}`;
		const nonHoverSrc = `${normalImgSrc}.png`;
		const hoverSrc = `${normalImgSrc}Hover.png`
		const nonHoverPauseSrc = `${iconFolderPath}/pausePixil.png`;
		const hoverPauseSrc = `${iconFolderPath}/pausePixilHover.png`

		currentElement.addEventListener('mouseover', () => {
			if(lastSongNum === null){
				return;
			}

			if(currentElement.src === nonHoverSrc){
				currentElement.src = hoverSrc;
			}
			if(currentElement.src === nonHoverPauseSrc){
				currentElement.src = hoverPauseSrc;
			}
		});

		currentElement.addEventListener('mouseout', () => {
			if(currentElement.src === hoverSrc){
				currentElement.src = nonHoverSrc;
			}
			if(currentElement.src === hoverPauseSrc){
				currentElement.src = nonHoverPauseSrc;
			}
		});
	});
}


function addRow(songCount){
	const songObject = new addSongObject(songCount);

	const tr = table.insertRow(-1);
	tr.className = "songRowClass";

	const songContainer = document.createElement('div');
	songContainer.className = "songContainer";
	tr.appendChild(songContainer);

	const songInfoDiv = tr.childNodes[0];
	
	songInfoDiv.appendChild(songObject.coverImg);
	songInfoDiv.appendChild(songObject.songTitle);
	songInfoDiv.appendChild(songObject.songDuration);
	songInfoDiv.appendChild(songObject.songArtist);

	const songDivider = document.createElement('div');
	songDivider.className = "songDivider";
	tr.appendChild(songDivider);

	songObject.coverImg.addEventListener('click', () => {
		if(lastSongNum != songObject.songNum){ //If the last song is different than the current song
			if(lastSongNum != null){ //If a song has been played before set corresponding image to the paused icon
				getSongImage(lastSongNum-1);
				songObject.isPlaying = false;
			}
			mainAudio.src = `static/media/songs/${songObject.wholeSongName}.mp3`;

			const titleDiv = document.getElementById('playingTitleID');
			titleDiv.innerText = `Playing: ${songObject.wholeSongName}`;

			const timeLengthDiv = document.getElementById('timeLength');
			timeLengthDiv.innerText = songObject.songDuration.innerText;
		}

		lastSongNum = songObject.songNum;

		if(songObject.isPlaying){
			const playPromise = mainAudio.play();

			if(playPromise !== undefined){
				playPromise.then(() => {
					mainAudio.pause();
					getSongImage(songObject.songNum-1);
					songObject.isPlaying = false;
					document.getElementById('footerPlayImg').src = "static/media/icons/playPixil.png";
				})
				.catch(error => {
					console.log(`Error from pausing is: %c${error}`,"color: red;");
				})
			}

			return;
		}

		mainAudio.play();
		songObject.isPlaying = true;
		songObject.coverImg.src = 'static/media/icons/blackcropped.gif';
		document.getElementById('footerPlayImg').src = "static/media/icons/pausePixil.png";
	});
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

	this.position;

	this.songNum = songCount;

	this.isPlaying = false;
}



function addEntryInfo(){
	const songNamesList = arrayifyFlaskData('songNames');
	const titleList = arrayifyFlaskData('songTitles');
	const artistList = arrayifyFlaskData('songArtists');
	const durationsList = arrayifyFlaskData('songDurations')
	
	let songObjecet = table.rows[0].firstElementChild.firstElementChild.getSongObject;
	
	songNamesList.forEach((songName, index) => {
		songObject = table.rows[index].firstElementChild.firstElementChild.getSongObject;

		wholeSongName = songName.slice(0, songName.indexOf(".mp3"));

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
	const coverPath = `static/media/songCovers/${currentSongName}.jpeg`;

	return await fetch(coverPath)
		.then(response => {
			if (response.ok) {
				table.rows[index].firstElementChild.firstElementChild.setAttribute('src', coverPath);
				return [true, coverPath];
			} else if(response.status === 404) {
				table.rows[index].firstElementChild.firstElementChild.setAttribute('src', 'static/media/icons/play.png');
			    return;
			} else {
				console.log(`Find Image Error. Status: %c${response.status}`,"color: red");
				return;
			}
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

document.getElementById("prevImg").addEventListener('click', () => {
	try{ 
		if(lastSongNum-2 >= 0){
			table.rows[lastSongNum-2].firstElementChild.firstElementChild.click();
		}
	}
	catch{ console.log("%cError: Cannot play previous song when no song has been selected.", "color: red"); }
});

document.getElementById("footerPlayImg").addEventListener('click', () => {
	try{ table.rows[lastSongNum-1].firstElementChild.firstElementChild.click(); }
	catch{ console.log("%cError: Cannot play song when no song has been selected.", "color: red");}
});

document.getElementById("nextImg").addEventListener('click', () => {
	try{
		if(lastSongNum < table.rows.length){
			table.rows[lastSongNum].firstElementChild.firstElementChild.click();
		}
	}
	catch{ console.log("%cError: Cannot play next song when no song has been selected.", "color: red");}
});


//Wants:
	//multiple pages to select from, ex: home, playlists, artists
	//volume slider
	//drag songs to reorder playlist (able to order playlists)
	//drop files onto website in order to "upload" new songs to the site
	//infinite scrolling
	//side panel


//Add windows volume slider thumbnail?

//To Do Now:
	//Make shuffle text into icon
	//create prepare footer function?
	//volume slider