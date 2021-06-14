var lastSongNum = null;
var table = document.getElementById("songTable");
var mainAudio = document.getElementById("mainAudio");

mainAudio.addEventListener('timeupdate', () => {
	position = mainAudio.currentTime / mainAudio.duration;
	fill.style.width = position *  100 + '%';
	handlef.style.marginLeft = (position * 100) - 1.8 + '%';

	if(position == 1){ //if the song finishes
		let lastSongObject = table.rows[lastSongNum-1].cells[0].firstElementChild.parent;
		lastSongObject.newImg.src = 'static/media/play.png';
		position = 0;
		fill.style.width = 0 + '%';
		handlef.style.marginLeft = 0 + '%';
		//revert the song that just finished back to its original state
		//then move to the next song (if there is a next song)
		table.rows[lastSongNum].cells[0].firstElementChild.click();
	}
});

document.getElementById("seekBar").onmousedown = mouseDown;

function mouseDown(e) {
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
	if(table.rows[lastSongNum-1].cells[0].firstElementChild.src == "http://127.0.0.1:5000/static/media/pause.png"){ //if it was playing (paused temporarily due to dragElement), then play
		mainAudio.play();
	} 
}




function createTable(){
	var songCount;
	var x = document.getElementById('scriptTag').getAttribute('numSongs');
	for(songCount = 1; songCount <= x; songCount++){ /*Songs*/
		addRow(songCount);
	}

	addEntryInfo();
}

function addRow(songCount){
	let tr = table.insertRow(-1);
	let td = tr.insertCell(0);
	let td2 = tr.insertCell(1);
	let td3 = tr.insertCell(2);

	var songObject = new addSongObject(songCount);

	songObject.newImg.addEventListener('click', () => {
		if(lastSongNum != songObject.songNum){ //If the last song is different than the current song
			if(lastSongNum != null){ //If a song has been played before
				//set corresponding image to the paused icon
				findImage(lastSongNum-1);//table.rows[lastSong-1].cells[0].firstElementChild.src = 'static/media/play.png';
				songObject.isPlaying = false;
			}
			mainAudio.src = `static/media/songs/${songObject.newSpan.innerText}.mp3`;
		}


		if(songObject.isPlaying == false){
			mainAudio.play();
			songObject.newImg.src = 'static/media/pause.png';
			songObject.isPlaying = true;
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
		}
		
		lastSongNum = songObject.songNum;
	});

	td.appendChild(songObject.newImg);
	td2.appendChild(songObject.newSpan);
	//td3.appendChild("hi");
}

function addSongObject(songCount){
	this.newSpan = document.createElement('span');
	this.newSpan.style.color = "grey";
	
	this.newImg = document.createElement('img');
	this.newImg.setAttribute('id','newImg');
	this.newImg.setAttribute('type','img');

	this.newImg.setAttribute('src','static/media/play.png');

	this.newImg.parent = this; //way to reference the object itself in other functions. Probably a cleaner solution to this

	//this.song.volume = 1;
	this.position;

	this.songNum = songCount;

	this.isPlaying = false;


}

function addEntryInfo(){
	//var x = document.getElementById('scriptTag').getAttribute('songNames');
	//var arr = x.split(",");

	songList = arrayifyFlaskData('songNames');
	
	for(var count = 0; count < songList.length; count++){ //**make for loop nicer**
		table.rows[count].cells[0].firstElementChild.parent.newSpan.innerText = songList[count].slice(0, songList[count].length-4); //slicing removes the .mp3 extension on each song

		findImage(count);
	}
}


async function findImage(count){
	let songPath = `static/media/songCovers/${songList[count].slice(0, songList[count].length-4)}.jpeg`
	return fetch(songPath)
			.then(response => {
				if (response.ok) {
					table.rows[count].cells[0].firstElementChild.setAttribute('src', songPath);
					return [true, count];//'success 200';
				} else if(response.status === 404) {
					table.rows[count].cells[0].firstElementChild.setAttribute('src', 'static/media/play.png');
				    return [false, count];//'error 404';
				} else {
					return false;//'some other error: ' + response.status;
				   }
			  	})
		  	.catch(error => console.log('error is', error));
}


function arrayifyFlaskData(getAttribute){
	var arr = document.getElementById('scriptTag').getAttribute(getAttribute);
	arr = arr.split(",");

	for(var count = 0; count < arr.length; count++){
		arr[count] = arr[count].slice(2,arr[count].length - 1);
	}
	arr[arr.length-1] = arr[arr.length-1].slice(0, arr[arr.length-1].length-1); //handle last element with closing bracket

	return arr;
}

document.getElementById("playPrev").addEventListener('click', () => table.rows[lastSongNum-2].cells[0].firstElementChild.click());

document.getElementById("playButton").addEventListener('click', () => table.rows[lastSongNum-1].cells[0].firstElementChild.click());

document.getElementById("playNext").addEventListener('click', () => table.rows[lastSongNum].cells[0].firstElementChild.click());


//Wants:
	//multiple pages to select from, ex: home, playlists, artists
	//volume slider
	//figure out how to interact with file system; get info from the song files themselves (artist, song name, song picture(if present))


//Add windows volume slider thumbnail?