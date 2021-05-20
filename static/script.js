		var lastSong = null;

    	document.getElementById("seekBar").onmousedown = mouseDown;

 		function mouseDown(e) {
    		e = e || window.event;
   			e.preventDefault();
			
   			if(e.clientX < window.innerWidth * .958 && lastSong != null){ //Seekbar is 95.8% of width, so this is why .958 is used. This doesn't allow the handle to go further than the seekbar extends
    			handlef.style.marginLeft = (e.clientX / window.innerWidth)*(100 * (2-.96)) - 3.2 + "%";
    			fill.style.width = (e.clientX / window.innerWidth)*(100 * (2-.95))- 1.6  + "%";
    			table.rows[lastSong-1].cells[0].firstElementChild.parent.song.currentTime = (parseFloat(fill.style.width)/100) * table.rows[lastSong-1].cells[0].firstElementChild.parent.song.duration;
    			table.rows[lastSong-1].cells[0].firstElementChild.parent.song.pause();
   			}
    		
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
    		table.rows[lastSong-1].cells[0].firstElementChild.parent.song.play();
  		}


		

		function createTable(){
			var table = document.getElementById("songTable");
			table.setAttribute('id','table');
			var songCount;
			for(songCount = 1; songCount <= 50; songCount++){ /*Songs*/
				addRow(songCount);
			}
		}

		function addRow(songCount){
			let tr = table.insertRow(-1);
			let td = tr.insertCell(0);
			let td2 = tr.insertCell(1);
			let td3 = tr.insertCell(2);

			var songTest = new addSongObject(songCount);


			songTest.newImg.addEventListener('click', function(){
				if(lastSong != null && lastSong != songTest.songNum){ //If a song has been played before, and the last song is different than the current song
					let lastAudio = table.rows[lastSong-1].cells[0].firstElementChild.parent.song;

					//preparation to remove audio element
					lastAudio.pause();
					var lastAudioSrc = lastAudio.src;
					lastAudio.src = "";
					lastAudio.load();
					lastAudio.remove();
					//need to remove the audio element in order to free up a socket

					//recreate audio element
					lastAudio.song = document.createElement('audio');
					lastAudio.setAttribute('id','song');
					lastAudio.setAttribute('type','audio/mp3');
					lastAudio.setAttribute('src', lastAudioSrc);

					//set corresponding image to the paused position
					table.rows[lastSong-1].cells[0].firstElementChild.src = 'static/media/play.png';
				}


				if(songTest.newImg.src == "http://127.0.0.1:5000/static/media/play.png"){
					songTest.song.play();
					songTest.newImg.src = 'static/media/pause.png';
				}
				else{
					songTest.song.pause();
					songTest.newImg.src = 'static/media/play.png';
				}
				
				lastSong = songTest.songNum;
			});
			songTest.song.addEventListener('timeupdate', function(){
				position = songTest.song.currentTime / songTest.song.duration;
				fill.style.width = position *  100 + '%';
				handlef.style.marginLeft = (position * 100) - 1.8 + '%';

				if(position == 1){ //if the song finishes
					songTest.newImg.src = 'static/media/play.png';
					position = 0;
					fill.style.width = 0 + '%';
					handlef.style.marginLeft = 0 + '%';
					//revert the song that just finished back to its original state
					//then move to the next song (if there is a next song)
					table.rows[lastSong].cells[0].firstElementChild.click();
				}
			});


			td.appendChild(songTest.newImg);
			td2.appendChild(songTest.newSpan);
		}

		function addSongObject(songCount){
			this.newSpan = document.createElement('span');
			this.newSpan.style.color = "grey";
			this.newSpan.appendChild(document.createTextNode('media/'+songCount+'.mp3'));

			/*var loc = window.location.pathname;
			var dir = loc.substring(0, loc.lastIndexOf('/'));*/

			//var scripts = document.getElementsByTagName("script"),
			
			
			this.newImg = document.createElement('img');
			this.newImg.setAttribute('id','newImg');
			this.newImg.setAttribute('type','img');
			this.newImg.setAttribute('src','static/media/play.png');

			this.newImg.parent = this;

			this.song = document.createElement('audio');
			this.song.setAttribute('id','song');
			this.song.setAttribute('type','audio/mp3');
			this.song.setAttribute('src', 'static/media/'+songCount.toString()+'.mp3');

			this.song.volume = 1;

			this.position;

			this.songNum = songCount;
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