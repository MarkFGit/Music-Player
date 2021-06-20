let lastSongNum = null;
let table = document.getElementById("songTable");
let mainAudio = document.getElementById("mainAudio");

mainAudio.addEventListener('timeupdate', () => {
	position = mainAudio.currentTime / mainAudio.duration;
	fill.style.width = position *  100 + '%';
	handlef.style.marginLeft = (position * 100) - 1.8 + '%';

	updateCurrentTime = document.getElementById('currentTimeStamp');

	//seconds = Math.floor(mainAudio.currentTime % 60);
	let minutes = Math.floor(mainAudio.currentTime / 60);
	let seconds = Math.floor(mainAudio.currentTime % 60);
	if(seconds < 10){
		seconds = `0${seconds}`;
	}


	updateCurrentTime.innerText = `${minutes}:${seconds}`;

	if(position == 1){ //if the song finishes: revert the song that just finished back to its original state
		let lastSongObject = table.rows[lastSongNum-1].cells[0].firstElementChild.parent;
		lastSongObject.coverImg.src = 'static/media/play.png';
		position = 0;
		fill.style.width = 0 + '%';
		handlef.style.marginLeft = 0 + '%';

		/*if the last song in the playlist finishes playing... set the main play button to as if it's paused. Otherwise, play the next song*/
		if(lastSongObject.songNum == table.rows.length){ 
			document.getElementById('currImg').src = "static/media/newPlay.png";
		}
		else{
			table.rows[lastSongNum].cells[0].firstElementChild.click();
		}
	}
});

document.getElementById("seekBar").onmousedown = mouseDown;

function mouseDown(e) {

	if(mainAudio.src == "http://127.0.0.1:5000/"){
		return; //can't use audio bar if no song has been selected
	}

	e = e || window.event;
	e.preventDefault();
	
	let seekBarWidth = .958;



	if(e.clientX < window.innerWidth * seekBarWidth && lastSongNum != null){ //Seekbar is 95.8% of width, so this is why .958 is used. This doesn't allow the handle to go further than the seekbar extends
		handlef.style.marginLeft = (e.clientX / window.innerWidth)*(100 * (2-.96)) - 3.2 + "%";
		fill.style.width = (e.clientX / window.innerWidth)*(100 * (2-.95))- 1.6  + "%";
		mainAudio.currentTime = (parseFloat(fill.style.width)/100) * mainAudio.duration;
	}

	mainAudio.pause();
	document.onmouseup = stopDragElement;
	document.onmousemove = dragElement;
}

function dragElement(e) {
	e = e || window.event;
	e.preventDefault();

	if(e.clientX < window.innerWidth * .958 && lastSongNum != null && e.clientX > 10){
		handlef.style.marginLeft = (e.clientX / window.innerWidth)*(100 * (2-.96))- 3.2  + "%";
		fill.style.width = (e.clientX / window.innerWidth)*(100 * (2-.95)) - 1.6 + "%";
		mainAudio.currentTime = (parseFloat(fill.style.width)/100) * mainAudio.duration;
	}
}
//*** Need to clean up dragElement & mouseDown functions. ***
function stopDragElement() {
	document.onmouseup = null;
	document.onmousemove = null;

	if(table.rows[lastSongNum-1].cells[0].firstElementChild.src == "http://127.0.0.1:5000/static/media/blackcropped.gif"){ //if it was playing (paused temporarily due to dragElement), then play
		mainAudio.play();
	} 
}




function createTable(){
	let x = document.getElementById('scriptTag').getAttribute('numOfSongs');
	for(let songCount = 1; songCount <= x; songCount++){ /*Songs*/
		addRow(songCount);
	}
	addEntryInfo();
}

function addRow(songCount){
	let tr = table.insertRow(-1);
	let td = tr.insertCell(0);
	let td2 = tr.insertCell(1);
	let td3 = tr.insertCell(2);
	let td4 = tr.insertCell(3);

	var songObject = new addSongObject(songCount);

	songObject.coverImg.addEventListener('click', () => {
		if(lastSongNum != songObject.songNum){ //If the last song is different than the current song
			if(lastSongNum != null){ //If a song has been played before
				//set corresponding image to the paused icon
				findImage(lastSongNum-1);
				songObject.isPlaying = false;
			}
			mainAudio.src = `static/media/songs/${songObject.wholeSongName}.mp3`;

			titleDiv = document.getElementById('title');
			titleDiv.innerText = `Playing: ${songObject.wholeSongName}`;

			timeLengthDiv = document.getElementById('timeLength');
			timeLengthDiv.innerText = songObject.songDuration.innerText;
		}


		if(songObject.isPlaying == false){
			mainAudio.play();
			songObject.coverImg.src = 'static/media/blackcropped.gif';

			songObject.isPlaying = true;
			document.getElementById('currImg').src = "static/media/newPause.png";
		}
		else{
			var playPromise = mainAudio.play();

			if(playPromise !== undefined){
				playPromise.then(() => {
					mainAudio.pause();
					findImage(songObject.songNum-1);
				})
				.catch(error => {
					console.log(`Error from pausing is: %c${error}`,"color: red;");
				})
			}
			songObject.isPlaying = false;
			document.getElementById('currImg').src = "static/media/newPlay.png";
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


}

function addEntryInfo(){
	songList = arrayifyFlaskData('songNames');
	titleList = arrayifyFlaskData('songTitles');
	artistList = arrayifyFlaskData('songArtists');
	durationsList = arrayifyFlaskData('songDurations')
	
	let songObject = table.rows[0].cells[0].firstElementChild.parent;

	

	for(let count = 0; count < songList.length; count++){ //**make for loop nicer**
		songObject = table.rows[count].cells[0].firstElementChild.parent;

		wholeSongName = songList[count].slice(0, songList[count].length-4);

		songObject.wholeSongName = wholeSongName;


		songObject.songTitle.innerText = titleList[count];
		songObject.songArtist.innerText = artistList[count];
		songObject.songDuration.innerText = durationsList[count];


		findImage(count);
	}
}


async function findImage(count){
	let currentSongName = songList[count].slice(0, songList[count].indexOf(".")); //removes .mp3 extension
	let coverPath = `static/media/songCovers/${currentSongName}.jpeg`;

	fetch(coverPath)
		.then(response => {
			if (response.ok) {
				table.rows[count].cells[0].firstElementChild.setAttribute('src', coverPath);
				return;
			} else if(response.status === 404) {
				table.rows[count].cells[0].firstElementChild.setAttribute('src', 'static/media/play.png');
			    return;
			} else {
				console.log(`Find Image Error. Status: %c${response.status}`,"color: red");
				return;
			}
		})
	  	.catch(error => console.log('error is', error));
}


function arrayifyFlaskData(getAttribute){
	var arr = document.getElementById('scriptTag').getAttribute(getAttribute);
	try{
		arr = arr.split(",");
	}catch{
		console.log(`Array ${getAttribute} is: ` + arr);
		return
	}

	for(let count = 0; count < arr.length; count++){
		arr[count] = arr[count].slice(2,arr[count].length - 1);
	}
	arr[arr.length-1] = arr[arr.length-1].slice(0, arr[arr.length-1].length-1); //handle last element with closing bracket

	return arr;
}

document.getElementById("playPrev").addEventListener('click', () => {
	try{ table.rows[lastSongNum-2].cells[0].firstElementChild.click(); }
	catch{ console.log("Cannot play previous song when no song has been selected."); }
});

document.getElementById("playButton").addEventListener('click', () => {
	try{ table.rows[lastSongNum-1].cells[0].firstElementChild.click(); }
	catch{ console.log("Cannot play song when no song has been selected.");}
});

document.getElementById("playNext").addEventListener('click', () => {
	try{ table.rows[lastSongNum].cells[0].firstElementChild.click(); }
	catch{ console.log("Cannot play next song when no song has been selected.");}
});


//Wants:
	//multiple pages to select from, ex: home, playlists, artists
	//volume slider
	//drag songs to reorder playlist (able to order playlists)
	//drop files onto website in order to "upload" new songs to the site
	//infinite scrolling
	//side panel


//Add windows volume slider thumbnail?


//To Do tomorrow:
	//Spiffy up the table (flex box?, lines between songs?)
