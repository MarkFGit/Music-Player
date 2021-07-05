let lastSongNum = null;
let table = document.getElementById("songTable");
let mainAudio = document.getElementById("mainAudio");

let draggingSong = false;

mainAudio.addEventListener('timeupdate', () => {
	const songPosition = mainAudio.currentTime / mainAudio.duration;
	if(!isNaN(songPosition)){
		seekBarProgress.style.width = `${songPosition * 100}%`;
	}
	

	const minutes = Math.floor(mainAudio.currentTime / 60);/* make const? */
	let seconds = Math.floor(mainAudio.currentTime % 60);

	if(seconds < 10){
		seconds = `0${seconds}`;
	}

	const updateCurrentTime = document.getElementById('currentTimeStamp');
	updateCurrentTime.innerText = `${minutes}:${seconds}`;

	if(songPosition == 1 && !draggingSong){ //if the song finishes: revert the song that just finished back to its original state
		const lastSongObject = table.rows[lastSongNum-1].cells[0].firstElementChild.parent;
		seekBarProgress.style.width = '0%';

		/*if the last song in the playlist finishes playing... revert the player. Otherwise, play the next song*/
		if(lastSongObject.songNum == table.rows.length){ 
			document.getElementById('playImg').src = "static/media/icons/playPixil.png";
			getSongImage(lastSongNum-1);
			lastSongObject.isPlaying = false;
			lastSongNum = null;
			document.getElementById('currentTimeStamp').innerText = '-.--';
			document.getElementById('title').innerText = 'Playing:';
			document.getElementById('timeLength').innerText = '-.--';
		}
		else{
			table.rows[lastSongNum].cells[0].firstElementChild.click();
		}
	}
});

document.getElementById("seekBar").onmousedown = mouseDown;

function mouseDown(event) {
	const noSelectedAudioSrc = "http://127.0.0.1:5000/";

	if(mainAudio.src == noSelectedAudioSrc){
		console.log("%cError: Cannot use seekbar when no song is selected.", "color: red");
		return; 
	}

	draggingSong = true;

	const e = event || window.event;
	e.preventDefault();

	calculateDragTimeAndWidth();

	mainAudio.pause();
	document.onmouseup = stopDragElement;
	document.onmousemove = dragElement;
}

function dragElement(event) {
	const e = event || window.event;
	e.preventDefault();

	calculateDragTimeAndWidth();
}


function stopDragElement() {
	document.onmouseup = null;
	document.onmousemove = null;

	let pausedIconSrc = "http://127.0.0.1:5000/static/media/icons/blackcropped.gif";
	if(table.rows[lastSongNum-1].cells[0].firstElementChild.src == pausedIconSrc){ //if it was playing (paused temporarily due to dragElement), then play
		mainAudio.play();
	} 
	draggingSong = false;
}


/* -------helper functions------- */
function getCSSProperty(ID, Property){
	let element = document.getElementById(ID);
	let elementProperty = window.getComputedStyle(element).getPropertyValue(Property);
	return elementProperty;
}

function calculateDragTimeAndWidth(){
	const getSeekBarWidth = getCSSProperty('seekBar', 'width');
	const seekBarWidth = getSeekBarWidth.slice(0, getSeekBarWidth.indexOf('px')); /* remove 'px' from given width */

	const clickedPos = event.clientX;
	const seekBarLeftOffset = seekBar.getBoundingClientRect().left;
	const middleOfHandle = seekBarHandle.getBoundingClientRect().width / 2;

	seekBarProgress.style.width = `${((clickedPos - seekBarLeftOffset - middleOfHandle) / seekBarWidth) * 100}%`;

	mainAudio.currentTime = (parseFloat(seekBarProgress.style.width)/100) * mainAudio.duration;
}
/* ^^^^^^ ---helper functions--- ^^^^^^ */


function createPage(){

	/* creates Table */
	const numOfPlaylistSongs = document.getElementById('scriptTag').getAttribute('numOfSongs');
	for(let songCount = 1; songCount <= numOfPlaylistSongs; songCount++){ /*Songs*/
		addRow(songCount);
	}
	addEntryInfo();


	fillPlaylistPreviewImages();
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

	return;
}


function addRow(songCount){
	const tr = table.insertRow(-1);
	const td = tr.insertCell(0);
	const td2 = tr.insertCell(1);
	const td3 = tr.insertCell(2);
	const td4 = tr.insertCell(3);

	const songObject = new addSongObject(songCount);

	songObject.coverImg.addEventListener('click', () => {
		if(lastSongNum != songObject.songNum){ //If the last song is different than the current song
			if(lastSongNum != null){ //If a song has been played before set corresponding image to the paused icon
				getSongImage(lastSongNum-1);
				songObject.isPlaying = false;
			}
			mainAudio.src = `static/media/songs/${songObject.wholeSongName}.mp3`;

			const titleDiv = document.getElementById('title');
			titleDiv.innerText = `Playing: ${songObject.wholeSongName}`;

			const timeLengthDiv = document.getElementById('timeLength');
			timeLengthDiv.innerText = songObject.songDuration.innerText;
		}


		if(songObject.isPlaying == false){
			mainAudio.play();
			songObject.coverImg.src = 'static/media/icons/blackcropped.gif';

			songObject.isPlaying = true;
			document.getElementById('playImg').src = "static/media/icons/pausePixil.png";
		}
		else{
			const playPromise = mainAudio.play();

			if(playPromise !== undefined){
				playPromise.then(() => {
					mainAudio.pause();
					getSongImage(songObject.songNum-1);
					songObject.isPlaying = false;
					document.getElementById('playImg').src = "static/media/icons/playPixil.png";
				})
				.catch(error => {
					console.log(`Error from pausing is: %c${error}`,"color: red;");
				})
			}
			
		}
		
		lastSongNum = songObject.songNum;
	});

	td.appendChild(songObject.coverImg);
	td2.appendChild(songObject.songTitle);
	td3.appendChild(songObject.songArtist);
	td4.appendChild(songObject.songDuration);
}

function addSongObject(songCount){
	this.songTitle = document.createElement('span');
	this.songTitle.style.color = "grey";

	this.songArtist = document.createElement('span');
	this.songArtist.style.color = "grey";

	this.songDuration = document.createElement('span');
	this.songDuration.style.color = "grey";
	
	this.coverImg = document.createElement('img');
	this.coverImg.setAttribute('id','coverImg');
	this.coverImg.setAttribute('type','img');

	this.coverImg.parent = this; //way to reference the object itself in other functions. Probably a cleaner solution to this

	//this.song.volume = 1;
	
	this.wholeSongName = '';

	this.position;

	this.songNum = songCount;

	this.isPlaying = false;

	function getSongObject(){
		return this;
	}
}

function addEntryInfo(){
	const songNamesList = arrayifyFlaskData('songNames');
	const titleList = arrayifyFlaskData('songTitles');
	const artistList = arrayifyFlaskData('songArtists');
	const durationsList = arrayifyFlaskData('songDurations')
	
	let songObject = table.rows[0].cells[0].firstElementChild.parent;

	
	const songListLength = songNamesList.length;
	for(let index = 0; index < songListLength; index++){ //**make for loop nicer**
		songObject = table.rows[index].cells[0].firstElementChild.parent;

		wholeSongName = songNamesList[index].slice(0, songNamesList[index].indexOf(".mp3")); //removes .mp3 extension

		songObject.wholeSongName = wholeSongName;
		songObject.songTitle.innerText = titleList[index];
		songObject.songArtist.innerText = artistList[index];
		songObject.songDuration.innerText = durationsList[index];


		getSongImage(index);
	}
}


async function getSongImage(index){
	const songNamesList = arrayifyFlaskData('songNames');

	const currentSongName = songNamesList[index].slice(0, songNamesList[index].indexOf(".mp3")); //removes .mp3 extension
	const coverPath = `static/media/songCovers/${currentSongName}.jpeg`;

	return await fetch(coverPath)
		.then(response => {
			if (response.ok) {
				table.rows[index].cells[0].firstElementChild.setAttribute('src', coverPath);
				return [true, coverPath];
			} else if(response.status === 404) {
				table.rows[index].cells[0].firstElementChild.setAttribute('src', 'static/media/icons/play.png');
			    return;
			} else {
				console.log(`Find Image Error. Status: %c${response.status}`,"color: red");
				return;
			}
		})
	  	.catch(error => console.log('error is', error));
}


function arrayifyFlaskData(getAttribute){
	let arr = document.getElementById('scriptTag').getAttribute(getAttribute);
	try{
		arr = arr.split(",");
	}catch{
		console.log(`Array ${getAttribute} is: ` + arr);
		return;
	}

	for(let index = 0; index < arr.length; index++){
		arr[index] = arr[index].slice(2, arr[index].length-1); /* removes ', ' between each entry*/
	}

	const lastIndex = arr.length-1;

	arr[lastIndex] = arr[lastIndex].slice(0, arr[lastIndex].length-1); //handle last element with closing bracket

	return arr;
}

document.getElementById("playPrev").addEventListener('click', () => {
	try{ table.rows[lastSongNum-2].cells[0].firstElementChild.click(); }
	catch{ console.log("%cError: Cannot play previous song when no song has been selected.", "color: red"); }
});

document.getElementById("playButton").addEventListener('click', () => {
	try{ table.rows[lastSongNum-1].cells[0].firstElementChild.click(); }
	catch{ console.log("%cError: Cannot play song when no song has been selected.", "color: red");}
});

document.getElementById("playNext").addEventListener('click', () => {
	try{ table.rows[lastSongNum].cells[0].firstElementChild.click(); }
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
	//border on content section