let lastSongNum = null;
const table = document.getElementById("songTable")

import {log, clickSongBySongNum} from '/static/script.js'

export default function updateEventScriptSongNum(updatedSongNum){
	lastSongNum = updatedSongNum;
}

export function prepareHeaderButtonListeners(){
	const headerPlayIcon = document.getElementById('headerPlayIconID');

	headerPlayIcon.addEventListener('click', () => {
		if(lastSongNum === null){
			clickSongBySongNum(0);
		}
	});

	headerPlayIcon.addEventListener('mouseover', () => {
		if(lastSongNum === null){
			headerPlayIcon.src = 'static/media/icons/playPixilHover.png';
			headerPlayIcon.style.cursor = 'pointer';
		}
	});

	headerPlayIcon.addEventListener('mouseout', () => {
		headerPlayIcon.src = 'static/media/icons/playPixil.png';
		headerPlayIcon.style.cursor = 'default';
	});
}

export function prepareFooterButtonListeners(){
	document.getElementById("footerPrevImg").addEventListener('click', () => {
		const previousSongNum = lastSongNum - 2;
		const canPlayPreviousSong = (lastSongNum !== null && previousSongNum >= 0);
		if(canPlayPreviousSong) return clickSongBySongNum(previousSongNum);
		console.error("Error: Cannot play previous song.");
	});

	document.getElementById("footerPlayImg").addEventListener('click', () => {
		if(lastSongNum === null) return (console.error("Error: Cannot play song when no song has been selected."));
		const currentSongNum = lastSongNum - 1;
		clickSongBySongNum(currentSongNum);
	});

	document.getElementById("footerNextImg").addEventListener('click', () => {
		const canPlayPreviousSong = (lastSongNum !== null && lastSongNum >= 0);
		const nextSongNum = lastSongNum;
		if(canPlayPreviousSong) return clickSongBySongNum(nextSongNum);
		console.error("Error: Cannot play next song.");
	});

	addHoverToFooterButtons();
}


function addHoverToFooterButtons(){
	const footerImgElementIDs = {
		footerPrevImg: 'prevPixil',
		footerPlayImg: 'playPixil',
		footerNextImg: 'nextPixil'
	}

	const iconFolderPath = 'http://127.0.0.1:5000/static/media/icons';


	for(const [currentElementID, imgSrc] of Object.entries(footerImgElementIDs)){
		const normalPlaySrc = `${iconFolderPath}/${imgSrc}.png`;
		const hoverPlaySrc = `${iconFolderPath}/${imgSrc}Hover.png`;
		const normalPauseSrc = `${iconFolderPath}/pausePixil.png`;
		const hoverPauseSrc = `${iconFolderPath}/pausePixilHover.png`;

		const currentElement = document.getElementById(currentElementID);
		currentElement.addEventListener('mouseover', () => {
			if(lastSongNum === null) return;

			if(currentElement.src === normalPlaySrc){
				currentElement.src = hoverPlaySrc;
			}
			if(currentElement.src === normalPauseSrc){
				currentElement.src = hoverPauseSrc;
			}
		});

		currentElement.addEventListener('mouseout', () => {
			if(currentElement.src === hoverPlaySrc){
				currentElement.src = normalPlaySrc;
			}
			if(currentElement.src === hoverPauseSrc){
				currentElement.src = normalPauseSrc;
			}
		});

	}
}


export function dragOverHandler(e){
	//e.dataTransfer.dropEffect = "move";
	e.preventDefault(); /* stops browser from opening file in new tab */
}

export async function fileDropHandler(e){
	e.preventDefault();
	if(e.dataTransfer.items){
		for(let index = 0; index < e.dataTransfer.items.length; index++){
			const currentFile = e.dataTransfer.items[index];
			if(currentFile.kind !== 'file'){
				continue;
			}

			const form = new FormData();
			const file = currentFile.getAsFile();

			if(isNotAcceptedFileUploadType(file.type)){
				continue;
			}

			const fileName = file.name;
			form.append("file", file);
			form.append("name", fileName);

			const xhr = new XMLHttpRequest();
			xhr.open("POST", '/', true);
			xhr.send(form);
			
			xhr.onreadystatechange = () => { reloadOnXhrReady(xhr); }
		}
	}
}


function isNotAcceptedFileUploadType(fileType){
	const allowedFileTypes = ["audio/mpeg", "audio/x-m4a"];

	if(allowedFileTypes.includes(fileType)){
		return false;
	}
	return true;
}


function reloadOnXhrReady(xhr){
	const xhrIsDone = (xhr.readyState === 4);
	if(xhrIsDone){
		if(xhr.status === 200) return window.location.reload();
		console.error(`Failed to add song. Failed with XHR status: ${xhr.status}`);
	}
}