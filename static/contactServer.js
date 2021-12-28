import {getPlaylistName} from './globals.js';
import {renderCustomTextBox} from './globalEventListener.js';

export default function dragOverHandler(e){
	e.preventDefault();
}

export async function fileDropHandler(e){
	e.preventDefault();

	if(!e.dataTransfer.items) return;

	const files = [...e.dataTransfer.items].map(item => item.getAsFile());

	for(const currentFile of files){

		const xhrPromise = new Promise(resolve => {
			sendFileXHR(currentFile, resolve);
		});
		await xhrPromise; //this await is necessary, otherwise the SQL server recieves to many requests and will crash.
	}
	
	window.location.reload();
}

async function sendFileXHR(currentFile, resolve){

	const form = new FormData();
	const file = currentFile;
	
	if(isNotAcceptedFileUploadType(file.type)) return;

	form.append("file", file);
	form.append("name", file.name);

	const xhr = new XMLHttpRequest();

	const playlistName = getPlaylistName();
	const serverRoute = `/playlists/${playlistName}`;

	xhr.onreadystatechange = () => { 
		const xhrIsDone = (xhr.readyState === 4);
		if(xhrIsDone){
			if(xhr.status === 200) resolve();
			else console.error(`Failed to add song. Failed with XHR status: ${xhr.status}`);
		}
	};

	xhr.open("POST", serverRoute, true);
	xhr.send(form);
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


export function deleteOrAddNewPlaylistToServer(playlistName, operation){
	const form = new FormData();
	form.append("playlistName", playlistName);

	const xhr = new XMLHttpRequest();

	const isHomePage = (document.getElementById('playlistGrid') !== null);

	xhr.onreadystatechange = async () => {
		if(xhr.readyState === 4 && xhr.status === 200){
			if(isHomePage){
				const homePageScript = await require('./homePageScript.js');
				homePageScript.createPlaylistGrid();
			}
			
			if(xhr.response !== "OK") renderCustomTextBox(xhr.response);
			renderCustomTextBox("Playlist dropped succesfully")
		}
	};
	
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
			if(xhr.response !== "OK") return renderCustomTextBox(xhr.response);
			renderCustomTextBox("Added to Playlist");
		}
	};

	xhr.open("POST", '/insertNewSong', true);
	xhr.send(form);
}


export function removeSongFromPlaylist(e){
	const form = new FormData();

	form.append('songPlaylistIndex', Object.values(e.target.parentElement)[1]['songplaylistindex']);
	form.append('playlistName', getPlaylistName());

	const xhr = new XMLHttpRequest();
	xhr.onreadystatechange = () => {
		if(xhr.readyState === 4 && xhr.status === 200){
			if(xhr.response !== "OK") return renderCustomTextBox(xhr.response);
			window.location.reload();
		}
	};
	xhr.open("POST", '/removeSong', true);
	xhr.send(form);
}


export function deleteSongFromDB(e){

}