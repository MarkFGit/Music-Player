var lastSong = null;
var table = document.getElementById("songTable");
var mainAudio = document.getElementById("mainAudio");

mainAudio.addEventListener('timeupdate', function(){
	position = mainAudio.currentTime / mainAudio.duration;
	fill.style.width = position *  100 + '%';
	handlef.style.marginLeft = (position * 100) - 1.8 + '%';

	if(position == 1){ //if the song finishes
		let lastSongObject = table.rows[lastSong-1].cells[0].firstElementChild.parent;
		lastSongObject.newImg.src = 'static/media/play.png';
		position = 0;
		fill.style.width = 0 + '%';
		handlef.style.marginLeft = 0 + '%';
		//revert the song that just finished back to its original state
		//then move to the next song (if there is a next song)
		table.rows[lastSong].cells[0].firstElementChild.click();
	}
});

document.getElementById("seekBar").onmousedown = mouseDown;

function mouseDown(e) {
	e = e || window.event;
	e.preventDefault();
	
	if(e.clientX < window.innerWidth * .958 && lastSong != null){ //Seekbar is 95.8% of width, so this is why .958 is used. This doesn't allow the handle to go further than the seekbar extends
		handlef.style.marginLeft = (e.clientX / window.innerWidth)*(100 * (2-.96)) - 3.2 + "%";
		fill.style.width = (e.clientX / window.innerWidth)*(100 * (2-.95))- 1.6  + "%";
		table.rows[lastSong-1].cells[0].firstElementChild.parent.song.currentTime = (parseFloat(fill.style.width)/100) * table.rows[lastSong-1].cells[0].firstElementChild.parent.song.duration;
		
	}
	//if(table.rows[lastSong-1].cells[0].firstElementChild.src == "static/media/pause.png"){
			table.rows[lastSong-1].cells[0].firstElementChild.parent.song.pause();
		//}
	document.onmouseup = stopDragElement;
	document.onmousemove = dragElement;
}

function dragElement(e) {
	e = e || window.event;
	e.preventDefault();

	if(e.clientX < window.innerWidth * .958 && lastSong != null && e.clientX > 10){
			handlef.style.marginLeft = (e.clientX / window.innerWidth)*(100 * (2-.96))- 3.2  + "%";
		fill.style.width = (e.clientX / window.innerWidth)*(100 * (2-.95)) - 1.6 + "%";
		table.rows[lastSong-1].cells[0].firstElementChild.parent.song.currentTime = (parseFloat(fill.style.width)/100) * table.rows[lastSong-1].cells[0].firstElementChild.parent.song.duration;
		}
	}

function stopDragElement() {
	document.onmouseup = null;
	document.onmousemove = null;
	if(table.rows[lastSong-1].cells[0].firstElementChild.src == "http://127.0.0.1:5000/static/media/pause.png"){ //if it was playing (paused temporarily due to dragElement), then play
		table.rows[lastSong-1].cells[0].firstElementChild.parent.song.play();
	} 
}




function createTable(){
	//table.setAttribute('id','table');
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

	songObject.newImg.addEventListener('click', function(){
		if(lastSong != songObject.songNum){
			if(lastSong != null){ //If a song has been played before, and the last song is different than the current song
				//let lastAudio = table.rows[lastSong-1].cells[0].firstElementChild.parent.song;

				//preparation to remove audio element
				//lastAudio.pause();
				//var lastAudioSrc = lastAudio.src;
				/*lastAudio.src = "";
				lastAudio.load();
				lastAudio.remove();
				//need to remove the audio element in order to free up a socket

				//recreate audio element
				lastAudio.song = document.createElement('audio');
				lastAudio.setAttribute('id','song');
				lastAudio.setAttribute('type','audio/mp3');
				lastAudio.setAttribute('src', lastAudioSrc);*/

				//set corresponding image to the paused icon
				table.rows[lastSong-1].cells[0].firstElementChild.src = 'static/media/play.png';
				songObject.isPlaying = false; //??????????
			}
			mainAudio.src = 'static/media/songs/' + songObject.newSpan.innerText + ".mp3";
		}


		if(songObject.isPlaying == false){//songObject.newImg.src == "http://127.0.0.1:5000/static/media/play.png"){
			console.log(table.rows[lastSong-1]?.cells[0].firstElementChild.parent.song);
			
			mainAudio.play();
			songObject.newImg.src = 'static/media/pause.png';
			songObject.isPlaying = true;
		}
		else{
			var playPromise = mainAudio.play();

			if(playPromise !== undefined){
				playPromise.then(_ => {
					mainAudio.pause();
					songObject.newImg.src = 'static/media/play.png';
				})
				.catch(error => {

				})
			}
			songObject.isPlaying = false;
			//songObject.song.pause();
			//songObject.newImg.src = 'static/media/play.png';
		}
		
		lastSong = songObject.songNum;
	});
	/*songObject.song.addEventListener('timeupdate', function(){
		position = songObject.song.currentTime / songObject.song.duration;
		fill.style.width = position *  100 + '%';
		handlef.style.marginLeft = (position * 100) - 1.8 + '%';

		if(position == 1){ //if the song finishes
			songObject.newImg.src = 'static/media/play.png';
			position = 0;
			fill.style.width = 0 + '%';
			handlef.style.marginLeft = 0 + '%';
			//revert the song that just finished back to its original state
			//then move to the next song (if there is a next song)
			table.rows[lastSong].cells[0].firstElementChild.click();
		}
	});*/


	td.appendChild(songObject.newImg);
	td2.appendChild(songObject.newSpan);
}

function addSongObject(songCount){
	this.newSpan = document.createElement('span');
	this.newSpan.style.color = "grey";
	
	this.newImg = document.createElement('img');
	this.newImg.setAttribute('id','newImg');
	this.newImg.setAttribute('type','img');
	//var image_data = document.getElementById('scriptTag').getAttribute('image_data')
	//if(image_data != 'None') table.rows[0].cells[0].firstElementChild.setAttribute('src', image_data);
	this.newImg.setAttribute('src','static/media/play.png');

	this.newImg.parent = this; //way to reference the object itself

	//this.song = document.createElement('audio');
	//this.song.setAttribute('id','song');
	//this.song.setAttribute('type','audio/mp3');

	//this.song.volume = 1;

	this.position;

	this.songNum = songCount;

	this.isPlaying = false;


}

function addEntryInfo(){
	//var x = document.getElementById('scriptTag').getAttribute('songNames');
	//var arr = x.split(",");

	songList = arrayify('songNames');
	//arr[0] = arr[0].slice(2,arr[0].length-1); //handle first element with opening bracket
	
	for(var count = 0; count < songList.length; count++){ 
		table.rows[count].cells[0].firstElementChild.parent.newSpan.innerText = songList[count].slice(0, songList[count].length-4);//appendChild(document.createTextNode(songList[count].slice(0, songList[count].length-4))); 
		//table.rows[count].cells[0].firstElementChild.parent.song.setAttribute('src','static/media/songs/'+songList[count]);
		if(count == 4) table.rows[4].cells[0].firstElementChild.setAttribute('src', "http://127.0.0.1:5000/static/media/songCovers/" + songList[count].slice(0, songList[count].length-4) + ".jpeg");
	}
	//var image_data = document.getElementById('scriptTag').getAttribute('image_data')
	//if(image_data != 'None') table.rows[4].cells[0].firstElementChild.setAttribute('src', "http://127.0.0.1:5000/static/media/songCovers/" + arr[count]);
}

function arrayify(getAttribute){
	var arr = document.getElementById('scriptTag').getAttribute(getAttribute);
	arr = arr.split(",");

	for(var count = 0; count < arr.length; count++){
		arr[count] = arr[count].slice(2,arr[count].length - 1);
	}
	arr[arr.length-1] = arr[arr.length-1].slice(0, arr[arr.length-1].length-1); //handle last element with closing bracket

	return arr;
}

document.getElementById("playPrev").addEventListener('click',function(){
	table.rows[lastSong-2].cells[0].firstElementChild.click();
});

document.getElementById("playButton").addEventListener('click',function(){
	table.rows[lastSong-1].cells[0].firstElementChild.click();
});

document.getElementById("playNext").addEventListener('click',function(){
	table.rows[lastSong].cells[0].firstElementChild.click();
});


//Wants:
	//multiple pages to select from, ex: home, playlists, artists
	//volume slider
	//figure out how to interact with file system; get info from the song files themselves (artist, song name, song picture(if present))


//Add windows volume slider thumbnail?