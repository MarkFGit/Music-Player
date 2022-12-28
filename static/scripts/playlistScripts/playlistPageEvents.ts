// This file is used to set the event listeners on static fields
	// Ex: back, play, forward images at the bottom of the playlist page.

// All of these funcs can probably just sit at the global level. They only ever need to be run once.

import { table, lastSongNum, clickSongByRowNum, } from './playlistGlobals';
import { getImgElemByID, IMG_PATHS } from './../globals';

const websiteOrigin = window.location.origin;
const staticFolderURL = `${websiteOrigin}/static`;
const iconFolderPath = `${staticFolderURL}/media/icons`;


/** This should be the only function called from this file.
 * This func exists purely so it can be imported from another module thus, the global code is below is run. */

// -=-=-=-=-=-=-=-=-=-=-=-=-=-= prepare header buttons with listeners =-=-=-=-=-=-=-=-=-=-=-=-=-=-
const headerPlayIcon = getImgElemByID("header-play-icon");

headerPlayIcon.addEventListener('click', () => {
	if(lastSongNum === null){
		clickSongByRowNum(0);
	}
});

headerPlayIcon.addEventListener('mouseover', () => {
	if(lastSongNum === null){
		headerPlayIcon.src = IMG_PATHS.lowerBarPlayHoverImgSrc;
		headerPlayIcon.style.cursor = 'pointer';
	}
});

headerPlayIcon.addEventListener('mouseout', () => {
	headerPlayIcon.src = IMG_PATHS.globalPlayImgSrc;
	headerPlayIcon.style.cursor = 'default';
});
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-= prepare footer buttons with listeners =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
getImgElemByID("footer-prev-img").addEventListener('click', previousTrackButtonHandler);
getImgElemByID("footer-play-img").addEventListener('click', playPauseButtonHandler);
getImgElemByID("footer-next-img").addEventListener('click', nextTrackButtonHandler);


export function previousTrackButtonHandler(){
	const canPlayPreviousSong = (lastSongNum !== null && lastSongNum > 0);
	if(canPlayPreviousSong) return clickSongByRowNum(lastSongNum - 1);
	console.error("Error: Cannot play previous song.");
}


/** Handles clicking the play/pause button. */
export function playPauseButtonHandler(){
	if(lastSongNum === null) return (console.error("Error: Cannot play song when no song has been selected."));
	const currentSongNum = lastSongNum;
	clickSongByRowNum(currentSongNum);
}

export function nextTrackButtonHandler(){
	const canPlayNextSong = (lastSongNum !== null && lastSongNum + 1 < table.rows.length);
	if(canPlayNextSong) return clickSongByRowNum(lastSongNum + 1);
	console.error("Error: Cannot play next song.");
}


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
	const currentID = getImgElemByID(footerImgInfo[current].id);
	const currentSrcs = footerImgInfo[current].srcs;
	const hasPauseImg = ('pause' in footerImgInfo[current].srcs);

	currentID.addEventListener('mouseover', () => {
		if(lastSongNum === null) return;

		if(currentID.src === currentSrcs.normal){
			currentID.src = currentSrcs.hover;
		}
		if(hasPauseImg && currentID.src === currentSrcs.pause){
			currentID.src = currentSrcs.pauseHover;
		}
	});

	currentID.addEventListener('mouseout', () => {
		if(currentID.src === currentSrcs.hover){
			currentID.src = currentSrcs.normal;
		}
		if(hasPauseImg && currentID.src === currentSrcs.pauseHover){
			currentID.src = currentSrcs.pause;
		}
	});
}
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-