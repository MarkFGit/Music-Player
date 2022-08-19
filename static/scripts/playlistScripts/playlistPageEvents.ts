// This file is used to set the event listeners on static fields
	// Ex: back, play, forward images at the bottom of the playlist page.

// All of these funcs can probably just sit at the global level. They only ever need to be run once.

import { lastSongNum, clickSongBySongNum, } from './playlistGlobals';
import { getImgElemByID } from './../globals';

const websiteOrigin = window.location.origin;
const staticFolderURL = `${websiteOrigin}/static`;
const iconFolderPath = `${staticFolderURL}/media/icons`;


/** This should be the only function called from this file.
 * This func exists purely so it can be imported from another module thus, the global code is below is run. */

// -=-=-=-=-=-=-=-=-=-=-=-=-=-= prepare header buttons with listeners =-=-=-=-=-=-=-=-=-=-=-=-=-=-
const headerPlayIcon = getImgElemByID('headerPlayIconID');

headerPlayIcon.addEventListener('click', () => {
	if(lastSongNum === null){
		clickSongBySongNum(0);
	}
});

headerPlayIcon.addEventListener('mouseover', () => {
	if(lastSongNum === null){
		headerPlayIcon.src = `${iconFolderPath}/playHover.png`;
		headerPlayIcon.style.cursor = 'pointer';
	}
});

headerPlayIcon.addEventListener('mouseout', () => {
	headerPlayIcon.src = `${iconFolderPath}/play.png`;
	headerPlayIcon.style.cursor = 'default';
});
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-= prepare footer buttons with listeners =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
getImgElemByID("footerPrevImg").addEventListener('click', () => {
	const previousSongNum = lastSongNum - 1;
	const canPlayPreviousSong = (lastSongNum !== null && previousSongNum >= 0);
	if(canPlayPreviousSong) return clickSongBySongNum(previousSongNum);
	console.error("Error: Cannot play previous song.");
});

getImgElemByID("footerPlayImg").addEventListener('click', () => {
	if(lastSongNum === null) return (console.error("Error: Cannot play song when no song has been selected."));
	const currentSongNum = lastSongNum;
	clickSongBySongNum(currentSongNum);
});

getImgElemByID("footerNextImg").addEventListener('click', () => {
	const canPlayPreviousSong = (lastSongNum !== null && lastSongNum >= 0);
	const nextSongNum = lastSongNum + 1;
	if(canPlayPreviousSong) return clickSongBySongNum(nextSongNum);
	console.error("Error: Cannot play next song.");
});

const footerImgInfo = {
	prev: {
		id: 'footerPrevImg',
		srcs: {
			normal: `${iconFolderPath}/prev.png`,
			hover: `${iconFolderPath}/prevHover.png`
		}
	},
	play: {
		id: 'footerPlayImg',
		srcs: {
			normal: `${iconFolderPath}/play.png`,
			hover: `${iconFolderPath}/playHover.png`,
			pause: `${iconFolderPath}/pause.png`,
			pauseHover: `${iconFolderPath}/pauseHover.png`
		}
	},
	next: {
		id: 'footerNextImg',
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