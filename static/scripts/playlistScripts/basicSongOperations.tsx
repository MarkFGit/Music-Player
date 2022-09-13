/* This file contains function for basic operability of songs. i.e. pausing and playing. */

import { getRowIndexByEventTarget, getSongObjectByRowNum, lastSongNum,
	audio, table, Song, updateLastSongNum, getImgByRow, } from "./playlistGlobals";
import { IMG_PATHS, PAGE_PROPERTIES, getImgElemByID,
	removeFileExtension, } from "./../globals";

import { setSongImageByRowNum, determineFooterPlayImgSrc,  } from "./findImages";

export function songImgEventListener(e: React.SyntheticEvent){
	const rowNum = getRowIndexByEventTarget(e.target);
	const song = getSongObjectByRowNum(rowNum);

	const clickedOnSameSong = (lastSongNum === song.rowNum);
	if(clickedOnSameSong){
		if(song.isPlaying){
			pauseSong(song);
		}
		else{
			playSong(song);
		}
		return;
	}

	const songIsAlreadySelected = (lastSongNum !== null);
	if(songIsAlreadySelected){ //revert previous song/row
		setSongImageByRowNum(lastSongNum);
		table.rows[lastSongNum].classList.remove("active-row");
		const oldSong = getSongObjectByRowNum(lastSongNum);
		oldSong.isPlaying = false;
	}

	// Update page with the song just clicked on
	updateLastSongNum(rowNum);
	updateLowerBarPlayingTitle(song);

	document.getElementById("curr-song-duration-text").innerText = song.duration;

	table.rows[rowNum].classList.add("active-row");
	
	scrollPlaylistIfNeeded(rowNum);

	audio.src = `${PAGE_PROPERTIES.staticFolderURL}/media/songs/${song.fileName}`;
	// Finally... play the song.
	playSong(song);
}


function pauseSong(song: Song){
	const playPromise = audio.play();

	// In browsers that don’t yet support this functionality, playPromise won’t be defined
	if(playPromise !== undefined){
		playPromise.then(() => {
			audio.pause();
			song.isPlaying = false;
			setSongImageByRowNum(song.rowNum);
			getImgElemByID("footer-play-img").src = determineFooterPlayImgSrc(song.isPlaying);
		})
		.catch(error => {
			console.error(`${error}` + `Failed to pause song: ${song}`);
		});
	}
}


function playSong(song: Song){
	audio.play();
	song.isPlaying = true;
	const imgForRow = getImgByRow(lastSongNum);
	imgForRow.src = IMG_PATHS.globalPlayingGifSrc;
	getImgElemByID("footer-play-img").src = determineFooterPlayImgSrc(song.isPlaying);
}


function updateLowerBarPlayingTitle(song: Song){
	const playingTitle = document.getElementById("playing-title");
	if(song.artist === "" || song.title === ""){
		playingTitle.innerText = `Playing: ${removeFileExtension(song.fileName)}`;
	}
	else{
		playingTitle.innerText = `Playing: ${song.artist} - ${song.title}`;
	}
}



function scrollPlaylistIfNeeded(rowNum: number){
	const playlistContainer = document.getElementById("playlist-content-container");
	const playlistContainerCoords = playlistContainer.getBoundingClientRect();
	const currentRowCoords = table.rows[rowNum].getBoundingClientRect();

	if(currentRowCoords.bottom > playlistContainerCoords.bottom){
		table.rows[rowNum].scrollIntoView(false);
		return;
	}

	if(currentRowCoords.top < playlistContainerCoords.top){
		table.rows[rowNum].scrollIntoView();
	}
}