import {getPlaylistName} from './globals.js';
import {renderSuccessBox} from './globalEventListener.js';

export default function dragOverHandler(e){
	e.preventDefault();
}

export async function fileDropHandler(e){
	e.preventDefault();
	if(e.dataTransfer.items){
		for(let index = 0; index < e.dataTransfer.items.length; index++){
			const currentFile = e.dataTransfer.items[index];
			if(currentFile.kind !== 'file') continue;

			const form = new FormData();
			const file = currentFile.getAsFile();

			if(isNotAcceptedFileUploadType(file.type)) continue;

			form.append("file", file);
			form.append("name", file.name);

			const xhr = new XMLHttpRequest();

			const playlistName = getPlaylistName();
			const serverRoute = `/playlists/${playlistName}`;
			xhr.open("POST", serverRoute, true);
			xhr.send(form);
			
			xhr.onreadystatechange = () => { 
				const xhrIsDone = (xhr.readyState === 4);
				if(xhrIsDone){
					if(xhr.status === 200) return window.location.reload();
					console.error(`Failed to add song. Failed with XHR status: ${xhr.status}`);
				}
			};
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


export function incrementPlayCount(currentSongObject){
	const form = new FormData();
	form.append("songName", currentSongObject.songFileName);

	const xhr = new XMLHttpRequest();
	xhr.onreadystatechange = async () => {
		if(xhr.readyState === 4 && xhr.status === 200){
			const script = await require('./script.js');
			const playsInRow = script.getSongRow(currentSongObject.songNum-1).querySelector('.playsWidth');
			const currentPlayNum = parseInt(playsInRow.innerText);
			playsInRow.innerText =  currentPlayNum + 1;
		}	
	};
	xhr.open("POST", '/updatePlays', true);
	xhr.send(form);
}


export async function deleteOrAddNewPlaylistToServer(playlistName, operation){
	const form = new FormData();
	form.append("playlistName", playlistName);

	const xhr = new XMLHttpRequest();

	const isHomePage = (document.getElementById('playlistGrid') !== null);
	if(isHomePage){ //if the current site is the home page, recreate the new gride of playlists
		const homePageScript = await require('./homePageScript.js');
		xhr.onreadystatechange = () => {
			if(xhr.readyState === 4 && xhr.status === 200){
				homePageScript.createPlaylistGrid();
			}
		};
	}
	if(operation === "add") xhr.open("POST", '/addPlaylist', true);
	if(operation === "delete") xhr.open("POST", '/deletePlaylist', true);
	
	xhr.send(form);
}



export function getPlaylistNamesFromDB(resolve){
	const xhr = new XMLHttpRequest();
	xhr.onreadystatechange = () => {
		if(xhr.readyState === 4 && xhr.status === 200){
			resolve(JSON.parse(xhr.response));
		}
	};
	xhr.open("POST", '/getPlaylists', true);
	xhr.send();
}

export async function resolvePlaylistNames(){
	const playlistPromise = new Promise(resolve => {
		getPlaylistNamesFromDB(resolve);
	});

	const data = await playlistPromise;
	return data["PlaylistNames"];
}

export function addSongToPlaylistInDB(e){
	const form = new FormData();

	form.append('fileName', Object.values(e.target.parentElement)[1]['currentsongname']);
	form.append('playlistName', e.target.innerText);

	const xhr = new XMLHttpRequest();
	xhr.onreadystatechange = () => {
		if(xhr.readyState === 4 && xhr.status === 200){
			renderSuccessBox();
		}
	}

	xhr.open("POST", '/insertNewSong', true);
	xhr.send(form)
}