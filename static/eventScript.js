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
		try{ 
			const prevSongNum = lastSongNum - 2;
			if(prevSongNum >= 0){
				clickSongBySongNum(prevSongNum);
			}
		}
		catch{ console.log("%cError: Cannot play previous song.", "color: red"); }
	});

	document.getElementById("footerPlayImg").addEventListener('click', () => {
		try{ 
			const currentSongNum = lastSongNum - 1;
			clickSongBySongNum(currentSongNum);
		}
		catch{ console.log("%cError: Cannot play song when no song has been selected.", "color: red");}
	});

	document.getElementById("footerNextImg").addEventListener('click', () => {
		try{
			const nextSongNum = lastSongNum;
			const numberOfRows = table.rows.length;
			if(nextSongNum < numberOfRows){
				clickSongBySongNum(nextSongNum);
			}
		}
		catch{ console.log("%cError: Cannot play next song.", "color: red");}
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
			if(lastSongNum === null){
				return;
			}

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
			const fileName = file.name;
			const fileType = file.type;
		
			if(fileType !== "audio/mpeg"){
				continue;
			}
			form.append("file", file);
			form.append("name", fileName);

			const xhr = new XMLHttpRequest();
			xhr.open("POST", '/', true);
			xhr.send(form);
			
			xhr.onreadystatechange = () => { reloadOnXhrReady(xhr); }
		}
		return;
	}
	e.dataTransfer.items.forEach((item) => {
		console.log(item.name);
	});
}


function reloadOnXhrReady(xhr){
	const xhrIsDone = (xhr.readyState === 4);
	if(xhrIsDone){
		if(xhr.status === 200) {
			window.location.reload();
			return;
		}
		console.error(`Song was not added correctly. Failed with XHR status: ${xhr.status}`);
	}
}


export function dragOverHandler(e){
	//e.dataTransfer.dropEffect = "move";
	e.preventDefault(); /* stops browser from opening file in new tab */
}