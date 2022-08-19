// As the name suggests, this file is solely responsible for communicating with the backend


import { Song, currPlaylistName, } from './playlistGlobals';
import { renderCustomTextBox } from "./../renderCustomTextBox";


export async function sendSongFile(songFile: File): Promise<void> {
	if(songFile === null){
		return;
	}
	
	// Checking if a file is of acceptable type should be done on the backend, not client-side.
	if(isNotAcceptedFileUploadType(songFile.type)) return;

	const form = new FormData();
	form.append("file", songFile);

	return fetch(
		"/uploadSongFile",
		{
			method: "POST",
			body: form,
		}
	)
	.then(response => {
		if(!response.ok){
			throw new Error(
				`Failed to upload song with filename: "${songFile.name}". `
				+ `Failed with status: ${response.status}.`
				+ `It is probable this file name already exists in the DB which is causing the error.`
			);
		}
	})
}


// This should really be checked on the backend
function isNotAcceptedFileUploadType(fileType: string){
	const allowedFileTypes = ["audio/mpeg", "audio/x-m4a"];

	if(allowedFileTypes.includes(fileType)){
		return false;
	}
	return true;
}


export async function incrementPlayCount(currentSongObject: Song): Promise<void> {
	return fetch(
		"/updatePlays",
		{
			method: "POST",
			body: currentSongObject.fileName
		}
	)
	.then(response => {
		if(!response.ok){
			throw new Error(`Failed to update play count. Failed with status: ${response.status}.`);
		}
	})
	.catch(error => {
		console.error(`${error} Offending song has attributes: file name: ${currentSongObject.fileName}\
			Failed with playcount: ${currentSongObject.plays}`)
	})
}


export async function addSongToPlaylist(songFileName: string, playlistName: string){
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
			return renderCustomTextBox(
				`Failed to add song, ${songFileName}, to playlist, ${playlistName}. `
				+ `Failed with status: ${response.status}`);
		}
		renderCustomTextBox("Added to Playlist");
	})
}



export async function removeSongFromCurrPlaylist(indexInDB: number){
	const form = new FormData();
	form.append('songPlaylistIndex', indexInDB.toString());
	form.append('playlistName', currPlaylistName);

	return fetch(
		"/removeSong",
		{
			method: "POST",
			body: form,
		}
	)
	.then(response => {
		if(!response.ok){
			throw new Error("Failed to remove song from playlist.");
		}
	})
	.catch(error => {
		`${error} Current playlist name: ${currPlaylistName}. Index of song in DB: ${indexInDB}`
	})
}


export async function deleteSongFromDB(songFileName: string, songName: string){
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
	})
	.catch(error => {
		console.error(`${error} Offending song file name: ${songFileName}`)
	})
}


export async function getUpdatedPlaylistTime(playlistName: string): Promise<any>{
	return fetch(
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


export async function updateSongInfo(newInfo: object, song_img: File | null, songFileName: string){
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


export async function getSong(songFileName: string){
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
		return data["songObj"];
	})
	.catch(error => {
		console.error(
			`${error} \nRequested song file name: ${songFileName}`
		);
	});
}