// Notes:
	// As the name suggests, this file is solely responsible for communicating with the backend
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

	for(const file of files){
		await sendFile(file); //this await is necessary, otherwise the SQL server recieves to many requests and will crash.

		const newSongObj = await getSongInfoFromDB(file.name);
		const newTotalTime = await getUpdatedPlaylistTime(getPlaylistName());
		const script_js = await require('./script.js');
		script_js.updatePageForNewRow(newSongObj, newTotalTime);
	}
}



async function sendFile(file){
	if(file === null){
		return;
	}
	
	// Checking if a file is of acceptable type should be done on the backend, not client-side.
	if(isNotAcceptedFileUploadType(file.type)) return;

	const form = new FormData();
	form.append("file", file);

	return fetch(
		"/uploadSongFile",
		{
			method: "POST",
			body: form,
		}
	)
	.then(response => {
		if(!response.ok){
			throw new Error(`Failed to upload song. Failed with status: ${response.status}`);
		}
	})
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
	return fetch(
		"/updatePlays",
		{
			method: "POST",
			body: currentSongObject.songFileName
		}
	)
	.then(async (response) => {
		if(!response.ok){
			throw new Error(`Failed to update play count. Failed with status: ${response.status}.`);
		}
		const script_js = await require('./script.js');
		const playsInRow = script_js.getSongRow(currentSongObject.songNum).querySelector('.play');
		const currentPlayNum = parseInt(playsInRow.innerText);
		playsInRow.innerText =  currentPlayNum + 1;
	})
	.catch(error => {
		console.error(`${error} Offending song file name: ${currentSongObject.songFileName}`)
	})
}


export function deleteOrAddNewPlaylistToServer(playlistName, op){
	let URL;
	let successText;
	let errorText;
	if(op === "add"){
		URL = "/addPlaylist";
		successText = "Playlist added succesfully";
		errorText = `Failed to add playlist: "${playlistName}".`
	}
	if(op === "delete"){
		URL = "/deletePlaylist";
		successText = "Playlist dropped succesfully";
		errorText = `Failed to drop playlist: "${playlistName}".`
	}

	return fetch(
		URL,
		{
			method: "POST",
			body: playlistName
		}
	)
	.then(async (response) => {
		if(!response.ok){
			throw new Error(`${errorText} Failed with status: ${response.status}`)
		}

		const isHomePage = (document.getElementById('playlistGrid') !== null);
		if(isHomePage){
			const homePageScript = await require('./homePageScript.js');
			homePageScript.createPlaylistGrid();
		}
		
		renderCustomTextBox(successText);
	})
}



export async function resolve_playlist_names(){
	return await fetch(
		"/getPlaylists",
		{
			method: "POST",
		}
	)
	.then(response => {
		if(response.ok){
			return response.json()	
		}
		throw new Error("Failed to retrieve playlist names from server.")
	})
	.then(data => {
		return data["PlaylistNames"]
	})
}



export function addSongToPlaylistInDB(songFileName, playlistName){
	const form = new FormData();
	form.append('fileName', songFileName);
	form.append('playlistName', playlistName);

	return fetch(
		"/insertNewSong",
		{
			method: "POST",
			body: form,
		}
	)
	.then(response => {
		if(!response.ok){
			return renderCustomTextBox(`Failed to add song to playlist. Failed with status: ${response.status}`);
		}
		renderCustomTextBox("Added to Playlist");
	})
}



export async function removeSongFromPlaylist(indexInDB, indexInPage){
	const form = new FormData();
	form.append('songPlaylistIndex', indexInDB);
	const playlist_name = getPlaylistName();
	form.append('playlistName', playlist_name);

	return await fetch(
		"/removeSong",
		{
			method: "POST",
			body: form,
		}
	)
	.then(async (response) => {
		if(!response.ok){
			throw new Error("Failed to remove song from playlist.");
		}
		const script_js = await require('./script.js');
		const newTotalTime = await getUpdatedPlaylistTime(getPlaylistName());
		script_js.updatePageForDeletedRow(indexInPage, newTotalTime);
	})
	.catch(error => {
		`${error} Current playlist name: ${playlist_name}. Index of song in DB: ${indexInDB}`
	})
}


export function deleteSongFromDB(songFileName, songName){
	const form = new FormData();
	form.append('songFileName', songFileName);
	form.append('songName', songName);

	return fetch(
		"/deleteSong",
		{
			method: "POST",
			body: form,
		}
	)
	.then(async (response) => {
		if(!response.ok){
			throw new Error(`An error was encounted while deleting a song. Failed with status ${response.status}.`)
		}
		const script_js = await require('./script.js');
		const newTotalTime = await getUpdatedPlaylistTime(getPlaylistName());
		script_js.updatePageForDeletedSong(songFileName, newTotalTime);
	})
	.catch(error => {
		console.error(`${error} Offending song file name: ${songFileName}`)
	})
}


async function getUpdatedPlaylistTime(playlistName){
	return await fetch(
		"/getPlaylistTime",
		{
			method: "POST",
			body: playlistName,
		}
	)
	.then(response => {
		if(response.ok){
			return response.json();
		}
		throw new Error(`Failed to update playlist time. Failed with status: ${response.status}`);
	})
	.then(data => {
		return data["totalTime"]
	})
	.catch(error => {
		console.error(
			`${error} \nRequested playlist name: ${playlistName}`
		)
	});
}


export async function updateSongInfoInDB(newInfo, song_img, songFileName){
	const form = new FormData();
	form.append("songFileName", songFileName);
	form.append("newInfo", JSON.stringify(newInfo));
	if(song_img !== null){
		form.append("newSongImg", song_img, songFileName);
	}

	return fetch(
		"/updateSongInfo",
		{
			method: "POST",
			body: form
		}
	)
	.then(response => {
		if(!response.ok){
			throw new Error(
				`Failed to update song info from server. Failed with status: ${response.status}`
			);
		}
	})
	.catch(error => {
		console.error(
			`${error} \nRequested song file name: ${songFileName}`
		);
	});
}


export async function getSongInfoFromDB(songFileName){
	return fetch(
		"/getSongInfo",
		{
			method: "POST",
			body: songFileName
		}
	)
	.then(response => {
		if(response.ok){
			return response.json();
		}
		throw new Error(
			`Failed to get song info from server with status: ${response.status}`
		);
	})
	.then(data => {
		return data["songObj"]
	})
	.catch(error => {
		console.error(
			`${error} \nRequested song file name: ${songFileName}`
		);
	});
}