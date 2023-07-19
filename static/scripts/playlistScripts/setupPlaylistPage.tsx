// This file is the entry point for all code in any page with URL: <server>/playlists/<playlist_name>

// Functions defined in this file should only be for the intial page load.

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { addNewPlaylistScreenPromptEventlistener, } from './../newPlaylistScreenPrompt';

import { audio, currentNonPriorityRow, table, } from './playlistGlobals';

import { getImgElemByID, IMG_PATHS, } from './../globals';

import { currentRow, } from './playlistGlobals';

import { playlistSongs, prioritySongs, } from './songs';

import { 
	fillPlaylistPreviewImages, toggleSongPlay, handleFindingNextSong, playNewSong, revertRow, getImgByRow, setTotalPlaylistTimeText,
} from './playlist';

import { RowContent, } from './RowContent';

import * as contactServer from './contactServer';


window["dragOverHandler"] = (e: DragEvent) => {e.preventDefault()};
window["fileDropHandler"] = async (e: DragEvent) => {
	e.preventDefault();

	if(e.dataTransfer === null) return;
	if(!e.dataTransfer.items) return;

	const files = [...e.dataTransfer.items].map(item => item.getAsFile());

	for(const songFile of files){
		if(songFile === null) break;

		// Checking if a file is of acceptable type should be done on the backend, not client-side.
		const allowedFileTypes = ["audio/mpeg", "audio/x-m4a"];

		if(!allowedFileTypes.includes(songFile.type)){
			break;
		}

		await contactServer.uploadSongFile(songFile);

		// rowIndex here is 0 because adding a song adds it to Last Added.
		// Obviously, the song just added is the most recent, so it will be at the top of Last Added.
		const newRow = table.insertRow(0);
		newRow.classList.add("song-row");

		// Make new song object AFTER the new row has been put in, but BEFORE the row content is put in.
		playlistSongs.addSong(await contactServer.getSong(songFile.name));
		setTotalPlaylistTimeText();

		// Insert row content
		ReactDOM.render(<RowContent rowIndex={0}/>, newRow);

		fillPlaylistPreviewImages();
	}
}



window.onload = () => {
	// Create the table with empty rows
	const numOfPlaylistSongs = parseInt(document.getElementById("script-tag").getAttribute("numOfSongs"));
	const songNums = [...Array(numOfPlaylistSongs).keys()];

	const songTableBody = document.getElementById("song-table-body");

	ReactDOM.render(
		<>
			{songNums.map((_, rowIndex) => <tr className="song-row" key={rowIndex}></tr>)}
		</>,
		songTableBody
	);

	// Then, create the song object array 
		// We do this after generateTable so that way the row attribute of each song points to its actual row
	playlistSongs.initialize();

	// Add content to the rows
	for(let i = 0; i < table.rows.length; i++){
		ReactDOM.render(
			<RowContent rowIndex={i}/>,
			table.rows[i]
		);
	}

	fillPlaylistPreviewImages();
	setTotalPlaylistTimeText();

	navigator.mediaSession.setActionHandler("previoustrack", previousTrackButtonHandler);
	navigator.mediaSession.setActionHandler("play", playPauseButtonHandler);
	navigator.mediaSession.setActionHandler("pause", playPauseButtonHandler);
	navigator.mediaSession.setActionHandler("nexttrack", nextTrackButtonHandler);

	addNewPlaylistScreenPromptEventlistener(null);
}


function previousTrackButtonHandler(): void {
	// Null means no song is selected, 0 means we are at the first song in the playlist.
	// We do not check currentNonPriorityRow because priority songs are removed 
	if(currentRow.getIndex() === null || currentRow.getIndex() === 0){
		console.error("Error: Cannot play previous song.");
		return;
	}

	revertRow(currentRow.getIndex());

	const prevSongNum = currentRow.getIndex() - 1;
	currentNonPriorityRow.set(prevSongNum);
	playNewSong(prevSongNum);
}


/** Handles clicking the play/pause button. */
function playPauseButtonHandler(): void {
	if(currentRow.getIndex() === null) return console.error("Error: Cannot play song when no song has been selected.");
	toggleSongPlay();
}


function nextTrackButtonHandler(): void {
	const isLastPlaylistSong = (currentNonPriorityRow.getIndex() === table.rows.length - 1);
	// Can't play next when no song is chosen OR if the priority queue is empty and we are on the last playlist song
	if(currentRow.getIndex() === null || (prioritySongs.isEmpty() && isLastPlaylistSong)){
		console.error("Error: Cannot play next song.");
		return;
	}

	revertRow(currentRow.getIndex());

	handleFindingNextSong();
}


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

const staticFolderURL = `${window.location.origin}/static`;
const iconFolderPath = `${staticFolderURL}/media/icons`;

// -=-=-=-=-=-=-=-=-=-=-=-=- prepare header buttons with listeners =-=-=-=-=-=-=-=-=-=-=-=-=-
const headerPlayIcon = getImgElemByID("header-play-icon");

headerPlayIcon.addEventListener('click', () => {
	if(currentRow.getIndex() === null){
		getImgByRow(0).click();
	}
});

headerPlayIcon.addEventListener('mouseover', () => {
	if(currentRow.getIndex() === null){
		headerPlayIcon.src = IMG_PATHS.lowerBarPlayHoverImgSrc;
		headerPlayIcon.style.cursor = 'pointer';
	}
});

headerPlayIcon.addEventListener('mouseout', () => {
	headerPlayIcon.src = IMG_PATHS.globalPlayImgSrc;
	headerPlayIcon.style.cursor = 'default';
});
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-



document.getElementById("seek-bar").addEventListener("mousedown", (e: MouseEvent) => {
	e.preventDefault();

	if(currentRow.getIndex() === null){
		return console.error("Error: Cannot use seekbar when no song is selected.");
	}

	audio.pause();

	setSeekBarWidth(e);
	// Even though this is called on onmouseup, this call also needs to be here for some reason.
	updateCurrentSongTime();



	document.onmouseup = e => {
		e.preventDefault();

		document.onmouseup = null;
		document.onmousemove = null;

		updateCurrentSongTime();
		const currentSongSrc = getImgByRow(currentRow.getIndex()).src;
		const pausedFromDragging = (currentSongSrc === IMG_PATHS.globalPlayingGifSrc);
		if(pausedFromDragging) audio.play();
	};


	document.onmousemove = e => {
		e.preventDefault();

		setSeekBarWidth(e);
	};

	function updateCurrentSongTime(){
		const seekBarProgress = document.getElementById("seek-bar-progress");
		audio.currentTime = (parseFloat(seekBarProgress.style.width) / 100) * audio.duration;
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
});



// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-= prepare footer buttons with listeners =-=-=-=-=-=-=-=-=-=-=-
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


getImgElemByID("footer-prev-img").addEventListener('click', previousTrackButtonHandler);
getImgElemByID("footer-play-img").addEventListener('click', playPauseButtonHandler);
getImgElemByID("footer-next-img").addEventListener('click', nextTrackButtonHandler);


const footerImgInfo = {
	prev: {
		id: "footer-prev-img",
		srcs: {
			normal: `${iconFolderPath}/prev.png`,
			hover: `${iconFolderPath}/prevHover.png`
		}
	},
	play: {
		id: "footer-play-img",
		srcs: {
			normal: `${iconFolderPath}/play.png`,
			hover: `${iconFolderPath}/playHover.png`,
			pause: `${iconFolderPath}/pause.png`,
			pauseHover: `${iconFolderPath}/pauseHover.png`
		}
	},
	next: {
		id: "footer-next-img",
		srcs: {
			normal: `${iconFolderPath}/next.png`,
			hover: `${iconFolderPath}/nextHover.png`
		}
	}
};

for(const [current] of Object.entries(footerImgInfo)){
	const currentImage = getImgElemByID(footerImgInfo[current].id);
	const currentSrcs = footerImgInfo[current].srcs;
	const hasPauseImg = ('pause' in footerImgInfo[current].srcs);

	currentImage.addEventListener('mouseover', () => {
		if(currentRow.getIndex() === null) return;

		if(currentImage.src === currentSrcs.normal){
			currentImage.src = currentSrcs.hover;
		}
		if(hasPauseImg && currentImage.src === currentSrcs.pause){
			currentImage.src = currentSrcs.pauseHover;
		}
	});

	currentImage.addEventListener('mouseout', () => {
		if(currentImage.src === currentSrcs.hover){
			currentImage.src = currentSrcs.normal;
		}
		if(hasPauseImg && currentImage.src === currentSrcs.pauseHover){
			currentImage.src = currentSrcs.pause;
		}
	});
}
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-