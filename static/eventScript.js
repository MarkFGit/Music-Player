let lastSongNum = null;
const table = document.getElementById("songTable")

import {clickSongBySongNum} from '/static/script.js'

export default function updateEventScriptSongNum(updatedSongNum){
	lastSongNum = updatedSongNum;
}

const URLforIconsFolder = 'http://127.0.0.1:5000/static/media/icons';

export function prepareHeaderButtonListeners(){
	const headerPlayIcon = document.getElementById('headerPlayIconID');

	headerPlayIcon.addEventListener('click', () => {
		if(lastSongNum === null){
			clickSongBySongNum(0);
		}
	});

	headerPlayIcon.addEventListener('mouseover', () => {
		if(lastSongNum === null){
			headerPlayIcon.src = `${URLforIconsFolder}/playHover.png`;
			headerPlayIcon.style.cursor = 'pointer';
		}
	});

	headerPlayIcon.addEventListener('mouseout', () => {
		headerPlayIcon.src = `${URLforIconsFolder}/play.png`;
		headerPlayIcon.style.cursor = 'default';
	});
}

export function prepareFooterButtonListeners(){
	document.getElementById("footerPrevImg").addEventListener('click', () => {
		const previousSongNum = lastSongNum - 1;
		const canPlayPreviousSong = (lastSongNum !== null && previousSongNum >= 0);
		if(canPlayPreviousSong) return clickSongBySongNum(previousSongNum);
		console.error("Error: Cannot play previous song.");
	});

	document.getElementById("footerPlayImg").addEventListener('click', () => {
		if(lastSongNum === null) return (console.error("Error: Cannot play song when no song has been selected."));
		const currentSongNum = lastSongNum;
		clickSongBySongNum(currentSongNum);
	});

	document.getElementById("footerNextImg").addEventListener('click', () => {
		const canPlayPreviousSong = (lastSongNum !== null && lastSongNum >= 0);
		const nextSongNum = lastSongNum + 1;
		if(canPlayPreviousSong) return clickSongBySongNum(nextSongNum);
		console.error("Error: Cannot play next song.");
	});

	addHoverToFooterImgs()
}

function addHoverToFooterImgs(){
	const iconFolderPath = 'http://127.0.0.1:5000/static/media/icons';
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
		const currentID = document.getElementById(footerImgInfo[current].id);
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
}