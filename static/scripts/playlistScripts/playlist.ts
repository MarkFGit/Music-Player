// This file is used to manipulate the state of the playlist

import { Song, playlistSongs, prioritySongs, } from "./songs";

import { 
	audio, table, setPlayingDisplayTitle, updateMediaSessionMetadata, currentRow, currentNonPriorityRow,
} from "./playlistGlobals";

import { IMG_PATHS, getImgElemByID, PAGE_PROPERTIES, getSpanElemByID, getDivElemByID, } from "./../globals";

import { getSongImage, } from "./findImages";


audio.ontimeupdate = () => {
	const songPosition = audio.currentTime / audio.duration;
	if(isNaN(songPosition)) return;

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
};


audio.onended = () => {
	document.getElementById("seek-bar-progress").style.width = '0%';

	const finishedSong = playlistSongs.getSong(currentRow.getIndex());
	finishedSong.setPlayCount(finishedSong.plays + 1);


	revertRow(currentRow.getIndex());
	handleFindingNextSong();
}


/** Function invoked by autoplay and the play next button. */
export function handleFindingNextSong(){
	if(currentRow.getIndex() === null){
		console.error("Error: Cannot play next song.");
		return;
	}

	if(prioritySongs.isEmpty()){
		// Continue down the playlist as normal

		// If the current song is the last song in the playlist
		if(currentNonPriorityRow.getIndex() === table.rows.length - 1){
			revertPageToNoSong();
			return;
		}

		// Otherwise, play the next song in the playlist
		const nextSongNum = currentNonPriorityRow.getIndex() + 1;
		playNewSong(nextSongNum);
		currentNonPriorityRow.set(nextSongNum);
		return;
	}

	playNewSong(prioritySongs.getNextRowIndex());

	prioritySongs.dequeueNextSong();
}


export function playNewSong(rowIndex: number){
	// update playlist table stuff
	currentRow.set(rowIndex);
	table.rows[rowIndex].classList.add("active-row");
	scrollPlaylistIfNeeded(rowIndex);
	
	// Then update the page accordingly to the newly selected song
	const newSong: Song = playlistSongs.getSong(rowIndex);

	// update lower bar text
	setPlayingDisplayTitle(newSong.artist, newSong.title, newSong.fileName);
	document.getElementById("curr-song-duration-text").innerText = newSong.duration;


	updateMediaSessionMetadata(newSong.title, newSong.artist, newSong.album, newSong.fileName);
	audio.src = `${PAGE_PROPERTIES.staticFolderURL}/media/songs/${newSong.fileName}`;
	
	// Finally... play the song.
	playSong();
}



export function toggleSongPlay(){
	if(audio.paused){
		playSong();
		return;
	}

	// Otherwise, pause the song.
	const playPromise = audio.play();

	// In browsers that don’t yet support this functionality, playPromise won’t be defined
	if(playPromise === undefined){
		throw Error(`playPromise is undefined! Unable to pause song.`);
	}

	playPromise.then(() => {
		audio.pause();
		setToCoverImg(currentRow.getIndex());
		setFooterPlayImgSrc();
	})
	.catch(error => {
		console.error(`${error}` + ` Failed to pause song.`);
	});
}


function playSong(){
	audio.play();
	setToPlayingGif(currentRow.getIndex());
	setFooterPlayImgSrc();
}


// the table.rows line needs to moved into a seperate func so that this func can be moved into page.ts
export function revertPageToNoSong(){
	getImgElemByID("footer-play-img").src = IMG_PATHS.globalPlayImgSrc;
	getSpanElemByID("current-time-stamp").innerText = '-:--';
	getSpanElemByID("playing-title").innerText = 'Playing:';
	getSpanElemByID("curr-song-duration-text").innerText = '-:--';
	getDivElemByID("seek-bar-progress").style.width = '0%';

	table.rows[table.rows.length - 1].setAttribute("style", "background-color: ;");
	audio.src = "";
	audio.pause();

	currentRow.set(null);
	currentNonPriorityRow.set(null);
}


export function revertRow(rowIndex: number){
	setToCoverImg(rowIndex);
	table.rows[currentRow.getIndex()].classList.remove("active-row");
}


/** Returns the image for a song for the given row in the playlist table. */
export function getImgByRow(rowIndex: number): HTMLImageElement {
	const elem = table.rows[rowIndex].firstElementChild.firstElementChild;
	if(elem instanceof HTMLImageElement){
		return elem;
	}
	throw new DOMException(`Failed to retrieve song Img for the row with row number: ${rowIndex}`)
}


export function getRowIndexByEventTarget(t: EventTarget): number {
	if(t instanceof HTMLButtonElement || t instanceof HTMLImageElement){
		t = t.parentElement;
		if(t instanceof HTMLTableCellElement){
			t = t.parentElement;
			if(t instanceof HTMLTableRowElement){
				return t.rowIndex;
			}
		}
	}

	throw new Error(`Failed to get rowIndex. Failed with target t: ${t}`);
}


export function scrollPlaylistIfNeeded(rowIndex: number){
	const playlistContainer = document.getElementById("playlist-content-container");
	const playlistContainerCoords = playlistContainer.getBoundingClientRect();
	const currentRowCoords = table.rows[rowIndex].getBoundingClientRect();

	if(currentRowCoords.bottom > playlistContainerCoords.bottom){
		table.rows[rowIndex].scrollIntoView(false);
		return;
	}

	if(currentRowCoords.top < playlistContainerCoords.top){
		table.rows[rowIndex].scrollIntoView();
	}
}


export function setToPlayingGif(rowIndex: number): void {
	getImgByRow(rowIndex).src = IMG_PATHS.globalPlayingGifSrc;
}


export async function setToCoverImg(rowIndex: number): Promise<void> {
	const song = playlistSongs.getSong(rowIndex);

	// for some reason this const is needed
	const imgSrc = await getSongImage(song.fileName);
	getImgByRow(rowIndex).src = imgSrc;
} 


export async function fillPlaylistPreviewImages(): Promise<void> {
	const numOfPlaylistSongs = table.rows.length;
	let numOfFoundPreviewImages = 0;
	const maxNumOfPreviews = 4;

	for(let index = 0; index < numOfPlaylistSongs; index++){
		const song = playlistSongs.getSong(index);
		const currentCoverSrc = await getSongImage(song.fileName);
		if(currentCoverSrc !== IMG_PATHS.noCoverImgSrc){
			getImgElemByID(`cover-preview-${numOfFoundPreviewImages}`).src = currentCoverSrc;
			numOfFoundPreviewImages++;
		}
		if(numOfFoundPreviewImages === maxNumOfPreviews){
			return; 
		}
	}
	
	for(numOfFoundPreviewImages; numOfFoundPreviewImages < maxNumOfPreviews; numOfFoundPreviewImages++){
		getImgElemByID(`cover-preview-${numOfFoundPreviewImages}`).src = IMG_PATHS.noCoverImgSrc;
	}
}


function setFooterPlayImgSrc(): void {
	getImgElemByID("footer-play-img").src = determineFooterPlayImgSrc();

	function determineFooterPlayImgSrc(): string {
		const footerImgElement = getImgElemByID("footer-play-img");
		const currSrc = footerImgElement.src;

		if(!audio.paused){
			// the second condition here occurs when hovering over the main play button while a song is finishing
			if(currSrc === IMG_PATHS.lowerBarPlayHoverImgSrc || currSrc === IMG_PATHS.lowerBarPauseHoverImgSrc){
				return IMG_PATHS.lowerBarPauseHoverImgSrc;
			}
			return IMG_PATHS.lowerBarPauseImgSrc;
		}
		if(currSrc === IMG_PATHS.lowerBarPauseHoverImgSrc){
			return IMG_PATHS.lowerBarPlayHoverImgSrc;
		}
		return IMG_PATHS.globalPlayImgSrc;
	}
}