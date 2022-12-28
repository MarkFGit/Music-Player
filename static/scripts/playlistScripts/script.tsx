// This file is the entry point for all code in any page with URL: <server>/playlists/<playlist_name>
// Where the playlist_name is a valid playlist name.

// Functions defined in this file should only be for the intial page load.

// Functions which are _generally_ more complex than this should be in the 'playlistComponents' file.

// Adding a new song is handled in this file. It may be moved in future.

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { addNewPlaylistScreenPromptEventlistener, } from './../newPlaylistScreenPrompt';
import { previousTrackButtonHandler, playPauseButtonHandler, nextTrackButtonHandler, } from './playlistPageEvents';

import * as contactServer from './contactServer';

import { setSongImageByRowNum, fillPlaylistPreviewImages, } from './findImages';

import { IMG_PATHS, } from './../globals';

import { 
	lastSongNum, isDraggingSong, table, audio, 
	getImgByRow, getSongObjectByRowNum, setDraggingSong, clickSongByRowNum, revertPageToNoSong, 
} from './playlistGlobals';

import { RowContent, } from './RowContent';

import { handleFileDrop, } from './handleFileDrop';


window["dragOverHandler"] = (e: DragEvent) => {e.preventDefault()};
window["fileDropHandler"] = handleFileDrop;


window.onload = () => {
	generateTable();
	fillPlaylistPreviewImages();

	navigator.mediaSession.setActionHandler("previoustrack", previousTrackButtonHandler);
	navigator.mediaSession.setActionHandler("play", playPauseButtonHandler);
	navigator.mediaSession.setActionHandler("pause", playPauseButtonHandler);
	navigator.mediaSession.setActionHandler("nexttrack", nextTrackButtonHandler);
}

addNewPlaylistScreenPromptEventlistener(null);

document.getElementById("volume-range").addEventListener("input", () => {
	const volRange = document.getElementById("volume-range") as HTMLInputElement;
	const volLevel = parseFloat(volRange.value);

	if(isNaN(volLevel)){ // this shouldn't happen, but just in case it does...
		return;
	}

	audio.volume = volLevel;

	// round is needed because sometimes numbers come out as xx.000000001 or xx.99999999
	// this is probably due to unavoidable floating point arithmetic errors
	const volInt = Math.round(volLevel * 100);
	document.getElementById("volume-text").innerText = volInt.toString() + "%";
});


audio.addEventListener('timeupdate', () => {
	const songPosition = audio.currentTime / audio.duration;
	if(isNaN(songPosition)) return;

	updatePlayingSongTimestamp(songPosition);

	const playingSongEndedNaturally = (songPosition == 1 && !isDraggingSong);
	if(playingSongEndedNaturally){
		document.getElementById("seek-bar-progress").style.width = '0%';

		const song = getSongObjectByRowNum(lastSongNum);

		contactServer.incrementPlayCount(song);

		const isLastPlaylistSong = (song.rowNum === table.rows.length-1);
		if(isLastPlaylistSong){
			song.isPlaying = false;
			setSongImageByRowNum(lastSongNum);
			revertPageToNoSong();
			return;
		}

		const nextSongNum = lastSongNum + 1;
		clickSongByRowNum(nextSongNum);
	}
});



function updatePlayingSongTimestamp(songPosition: number){
	const seekBarProgress = document.getElementById("seek-bar-progress");
	seekBarProgress.style.width = `${songPosition * 100}%`;

	const minutes = Math.floor(audio.currentTime / 60);
	const seconds = Math.floor(audio.currentTime % 60);
	let secondsStr = seconds.toString();

	if(seconds < 10){
		secondsStr = `0${seconds}`;
	}

	const updateCurrentTime = document.getElementById("current-time-stamp");
	updateCurrentTime.innerText = `${minutes}:${secondsStr}`;
}


document.getElementById("seek-bar").addEventListener("mousedown", (e: MouseEvent) => {
	if(lastSongNum === null){
		return console.error("Error: Cannot use seekbar when no song is selected.");
	}

	setDraggingSong(true);
	audio.pause();

	e.preventDefault();

	setSeekBarWidth(e);
	updateCurrentSongTime();

	document.onmouseup = stopDragElement;
	document.onmousemove = dragElement;
});

function dragElement(e: MouseEvent) {
	e.preventDefault();

	setSeekBarWidth(e);
	updateCurrentSongTime();
}

function updateCurrentSongTime(){
	const seekBarProgress = document.getElementById("seek-bar-progress");
	audio.currentTime = (parseFloat(seekBarProgress.style.width) / 100) * audio.duration;
}


function stopDragElement() {
	document.onmouseup = null;
	document.onmousemove = null;
	
	setDraggingSong(false);

	const currentSongSrc = getImgByRow(lastSongNum).src;
	const pausedFromDragging = (currentSongSrc === IMG_PATHS.globalPlayingGifSrc);
	if(pausedFromDragging) audio.play();
}


function setSeekBarWidth(e: MouseEvent){
	const seekBar = document.getElementById("seek-bar");
	const seekBarWidth = parseFloat(window.getComputedStyle(seekBar).getPropertyValue("width"));

	const clickedPos = e.clientX;
	const seekBarLeftOffset = seekBar.getBoundingClientRect().left;
	const seekBarHandle = document.getElementById("seek-bar-handle");
	const middleOfHandle = seekBarHandle.getBoundingClientRect().width / 2;
	const clickedWidth = clickedPos - seekBarLeftOffset - middleOfHandle;

	const seekBarProgress = document.getElementById("seek-bar-progress");
	seekBarProgress.style.width = `${(clickedWidth / seekBarWidth) * 100}%`;
}



function generateTable(){
	const numOfPlaylistSongs = parseInt(document.getElementById("script-tag").getAttribute("numOfSongs"));
	const songNums = [...Array(numOfPlaylistSongs).keys()];

	const rows = [];
	for(let rowNum = 0; rowNum < numOfPlaylistSongs; rowNum++){
		rows.push(<Row key={rowNum} rowNum={rowNum}/>);
	}

	const container = document.getElementById("song-table-body");
	ReactDOM.render(
		<>
			{songNums.map((_, rowNum) => {
				return <Row key={rowNum} rowNum={rowNum}/>;
			})}
		</>,
		container
	);

	
}


/** This is used to create a Row only in the initial page load. */
function Row({rowNum}: {rowNum: number}): JSX.Element {
	return(
		<tr className="song-row">
			<RowContent rowNum={rowNum}/>
		</tr>
	);
}