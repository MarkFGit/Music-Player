// Notes:
	// As the name suggests, this file is solely responsible for communicating with the backend
	// At some point all xhr's will be replaced with fetch
	// Circular imports will be removed in the future...

import {getPlaylistName, isPlaylistPage} from './globals.js';
import {renderCustomTextBox} from './globalEventListener.js';





// dragOverHandler and fileDropHandler should really be in script.js
export default function dragOverHandler(e){
	e.preventDefault();
}

export async function fileDropHandler(e){
	e.preventDefault();

	if(!e.dataTransfer.items) return;

	const files = [...e.dataTransfer.items].map(item => item.getAsFile());
	const newSongObjs = [];

	for(const file of files){
		const xhrPromise = new Promise(resolve => {
			sendFileXHR(file, resolve);
		});
		await xhrPromise; //this await is necessary, otherwise the SQL server recieves to many requests and will crash.

		const newSongObj = await getNewSongData(file.name);
		const newTotalTime = await getUpdatedPlaylistTime(getPlaylistName());
		const script_js = await require('./script.js');
		script_js.updatePageForNewRow(newSongObj, newTotalTime);
	}
}



export async function getNewSongData(fileName){
	const dataPromise = new Promise(resolve => {
		if(!isPlaylistPage()){
			return;
		}

		// Get song info from server
		const xhr = new XMLHttpRequest();
		const form = new FormData();
		form.append("fileName", fileName);
		form.append("playlistName", getPlaylistName());


		xhr.onreadystatechange = () => {
			const xhrIsDone = (xhr.readyState === 4);
			if(xhrIsDone){
				if(xhr.status === 200){
					resolve(JSON.parse(xhr.response));
				}
				else{
					console.error(`Failed to get song data`);
				}
			}
		}

		xhr.open("POST", "/getNewSongInfo", true);
		xhr.send(form);
	});

	const results = await dataPromise;
	return JSON.parse(results['songObj']);
}



async function sendFileXHR(file, resolve){
	if(file === null){
		return;
	}
	
	// Checking if a file is of acceptable type should be done on the backend, not client-side.
	if(isNotAcceptedFileUploadType(file.type)) return;

	const form = new FormData();
	form.append("file", file);

	const xhr = new XMLHttpRequest();

	xhr.onreadystatechange = () => { 
		const xhrIsDone = (xhr.readyState === 4);
		if(xhrIsDone){
			if(xhr.status === 200) resolve();
			else console.error(`Failed to add song. Failed with XHR status: ${xhr.status}`);
		}
	};

	xhr.open("POST", "/uploadSongFile", true);
	xhr.send(form);
}


// This should really be checked on the backend
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
			const script_js = await require('./script.js');
			const playsInRow = script_js.getSongRow(currentSongObject.songNum).querySelector('.play');
			const currentPlayNum = parseInt(playsInRow.innerText);
			playsInRow.innerText =  currentPlayNum + 1;
		}	
	};
	xhr.open("POST", '/updatePlays', true);
	xhr.send(form);
}


export function deleteOrAddNewPlaylistToServer(playlistName, op){
	const form = new FormData();
	form.append("playlistName", playlistName);

	const xhr = new XMLHttpRequest();

	xhr.onreadystatechange = async () => {
		if(xhr.readyState === 4 && xhr.status === 200){
			const isHomePage = (document.getElementById('playlistGrid') !== null);
			if(isHomePage){
				const homePageScript = await require('./homePageScript.js');
				homePageScript.createPlaylistGrid();
			}
			
			if(xhr.response !== "OK") return renderCustomTextBox(xhr.response);
			if(op === "delete") return renderCustomTextBox("Playlist dropped succesfully");
			if(op === "add") renderCustomTextBox("Playlist added succesfully");
		}
	};
	
	if(op === "add") xhr.open("POST", '/addPlaylist', true);
	if(op === "delete") xhr.open("POST", '/deletePlaylist', true);
	
	xhr.send(form);
}


export async function resolveCustomPlaylistNames(){
	const playlistPromise = new Promise(resolve => {
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => {
			if(xhr.readyState === 4 && xhr.status === 200){
				resolve(JSON.parse(xhr.response));
			}
		};
		xhr.open("POST", '/getPlaylists', true);
		xhr.send();
	});

	const data = await playlistPromise;
	return data["PlaylistNames"];
}


export function addSongToPlaylistInDB(songFileName, playlistName){
	const form = new FormData();

	form.append('fileName', songFileName);
	form.append('playlistName', playlistName);

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


export async function removeSongFromPlaylist(indexInDB, indexInPage){
	const form = new FormData();
	form.append('songPlaylistIndex', indexInDB);
	form.append('playlistName', getPlaylistName());

	const xhr = new XMLHttpRequest();
	xhr.onreadystatechange = async () => {
		if(xhr.readyState === 4 && xhr.status === 200){
			if(xhr.response !== "OK") return renderCustomTextBox(xhr.response);

			const script_js = await require('./script.js');
			const newTotalTime = await getUpdatedPlaylistTime(getPlaylistName());
			script_js.updatePageForDeletedRow(indexInPage, newTotalTime);
		}
	};
	xhr.open("POST", '/removeSong', true);
	xhr.send(form);
}


export function deleteSongFromDB(songFileName, songName){
	const form = new FormData();
	form.append('songFileName', songFileName);
	form.append('songName', songName);

	const xhr = new XMLHttpRequest();
	xhr.onreadystatechange = async () => {
		if(xhr.readyState === 4 && xhr.status === 200){
			const script_js = await require('./script.js');
			const newTotalTime = await getUpdatedPlaylistTime(getPlaylistName());
			script_js.updatePageForDeletedSong(songFileName, newTotalTime);
		}
	};

	xhr.open("POST", '/deleteSong', true);
	xhr.send(form);
}



async function getUpdatedPlaylistTime(playlistName){
	const dataPromise = new Promise(resolve => {
		const form = new FormData();
		form.append("playlistName", playlistName);

		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => {
			const xhrIsDone = (xhr.readyState === 4);
			if(xhrIsDone){
				if(xhr.status === 200){
					resolve(JSON.parse(xhr.response));
				}
				else{
					console.error(`Failed to get playlist time from server.`);
				}
			}
		};
		xhr.open("POST", "/getPlaylistTime", true);
	 	xhr.send(form);
	});
	
	const results = await dataPromise;
	return results['totalTime'];
}



export async function updateSongInfoInDB(newInfo, songFileName){
	await new Promise(resolve => {
		const form = new FormData();
		form.append("newInfo", JSON.stringify(newInfo));
		form.append("newSongImg", newInfo["newSongImg"]);
		form.append("songFileName", songFileName);

		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => {
			const xhrIsDone = (xhr.readyState === 4);
			if(xhrIsDone){
				if(xhr.status === 200){
					resolve();
					return;
				}
				console.error(`Failed to update song info to server.
							\nFailed with xhr status: ${xhr.status}`);
				resolve();
				return;
			}
		};
		xhr.open("POST", "/updateSongInfo", true);
	 	xhr.send(form);
	});
}


export async function getSongInfoFromDB(songFileName){
	const dataPromise = await new Promise(resolve => {
		const form = new FormData();
		form.append("songFileName", songFileName);

		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => {
			const xhrIsDone = (xhr.readyState === 4);
			if(xhrIsDone){
				if(xhr.status === 200){
					resolve(JSON.parse(xhr.response));
				}
				else{
					console.error(`Failed to get song info from server.
								\nFailed with xhr status: ${xhr.status}`);
				}
			}
		};
		xhr.open("POST", "/getSongInfo", true);
	 	xhr.send(form);
	});
	const songObj = JSON.parse(dataPromise["songObj"]);
	return songObj;
}