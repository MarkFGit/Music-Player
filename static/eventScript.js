let lastSongNum = null;
const table = document.getElementById("songTable")

import {addRow} from '/static/script.js'

export default function setEventSongNum(updatedSongNum){
	lastSongNum = updatedSongNum;
}

export function prepareHeaderButtonListeners(){
	const headerPlayIcon = document.getElementById('headerPlayIconID');

	headerPlayIcon.addEventListener('click', () => {
		if(lastSongNum === null){
			table.rows[0].firstElementChild.firstElementChild.click();
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
	document.getElementById("prevImg").addEventListener('click', () => {
		try{ 
			const prevSongNum = lastSongNum - 2;
			if(prevSongNum >= 0){
				table.rows[prevSongNum].firstElementChild.firstElementChild.click();
			}
		}
		catch{ console.log("%cError: Cannot play previous song.", "color: red"); }
	});

	document.getElementById("footerPlayImg").addEventListener('click', () => {
		try{ 
			const currentSongNum = lastSongNum - 1;
			table.rows[currentSongNum].firstElementChild.firstElementChild.click();
		}
		catch{ console.log("%cError: Cannot play song when no song has been selected.", "color: red");}
	});

	document.getElementById("nextImg").addEventListener('click', () => {
		try{
			const nextSongNum = lastSongNum;
			const numberOfRows = table.rows.length;
			if(nextSongNum < numberOfRows){
				table.rows[nextSongNum].firstElementChild.firstElementChild.click();
			}
		}
		catch{ console.log("%cError: Cannot play next song.", "color: red");}
	});

	addHoverToFooterButtons();
}

function addHoverToFooterButtons(){
	const footerImgIDs = ['nextImg', 'footerPlayImg', 'prevImg'];
	const imgFileNames = ['nextPixil', 'playPixil', 'prevPixil'];

	const iconFolderPath = 'http://127.0.0.1:5000/static/media/icons';

	footerImgIDs.forEach((currentElementID, index) => {
		const normalImgSrc = `${iconFolderPath}/${imgFileNames[index]}`;
		const normalSrc = `${normalImgSrc}.png`;
		const hoverSrc = `${normalImgSrc}Hover.png`;
		const normalPauseSrc = `${iconFolderPath}/pausePixil.png`;
		const hoverPauseSrc = `${iconFolderPath}/pausePixilHover.png`;

		const currentElement = document.getElementById(currentElementID);
		currentElement.addEventListener('mouseover', () => {
			if(lastSongNum === null){
				return;
			}

			if(currentElement.src === normalSrc){
				currentElement.src = hoverSrc;
			}
			if(currentElement.src === normalPauseSrc){
				currentElement.src = hoverPauseSrc;
			}
		});

		currentElement.addEventListener('mouseout', () => {
			if(currentElement.src === hoverSrc){
				currentElement.src = normalSrc;
			}
			if(currentElement.src === hoverPauseSrc){
				currentElement.src = normalPauseSrc;
			}
		});
	});
}



export function fileDropHandler(e){
	e.preventDefault();
	if(e.dataTransfer.items){
		for(let index = 0; index < e.dataTransfer.items.length; index++){
			let currentFile = e.dataTransfer.items[index];
			if(currentFile.kind === 'file'){
				let form = new FormData();
				form.append("file", currentFile.getAsFile());

				let fileName, fileType;
				for (let value of form.values()) {
				   fileName = value.name;
				   fileType = value.type;
				}

				if(fileType !== "audio/mpeg"){
					continue;
				}

				form.append("name", fileName);

				let xhr = new XMLHttpRequest();
				xhr.open("POST", '/', true);
				xhr.send(form);

				xhr.onreadystatechange = () => {
					const doneState = 4;
					if(xhr.readyState === doneState && xhr.status === 200){
						window.location.reload(); // update the page with new song
					}
					if(xhr.readyState === doneState && xhr.status !== 200){
						console.error(`Song was not added correctly. Failed with XHR status: ${xhr.status}`);
					}
				}
			}
		}
	}
	else{
		e.dataTransfer.items.forEach((item) => {
			console.log(item.name);
		});
	}
}

export function dragOverHandler(e){
	e.preventDefault(); /* stops browser from opening file in new tab */
}