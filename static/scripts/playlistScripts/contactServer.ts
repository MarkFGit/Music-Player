// As the name suggests, this file is solely responsible for communicating with the backend


import { Song, table, currPlaylistName, } from './playlistGlobals';
import { renderCustomTextBox } from "./../renderCustomTextBox";
import { handleServerError, } from "./../contactServerGlobals";


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
		if(response.ok){
			renderCustomTextBox("Song successfully uploaded!");
			return;
		}
		throw new Error(`Failed with status: ${response.status}.`);
	})
	.catch(error => {
		const firstPart = `Failed to upload song with filename: "${songFile.name}". `;
		const secondPart = "It is likely this file name already exists in the DB which is causing the error.";
		const userErr = firstPart + secondPart;
		handleServerError(error, userErr);
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


export async function incrementPlayCount(song: Song): Promise<void> {
	return fetch(
		"/updatePlays",
		{
			method: "POST",
			body: song.fileName
		}
	)
	.then(response => {
		if(!response.ok){
			throw new Error(`Failed to update with status: ${response.status}. `);
		}

		const row = table.rows[song.rowNum];
		const plays = row.querySelector(".plays");

		if(plays instanceof HTMLSpanElement){
			song.plays += 1;
			plays.innerText = song.plays.toString();
			return;
		}

		throw new TypeError(
			"Tried to update the row's play's count text but it failed. "
			+
			`Instead got element "${plays}" of type "${plays.constructor.name}". `
			+
			`Row given: ${row}, with song: ${song.fileName}`
		);
	})
	.catch(error => {
		handleServerError(error, `Failed to update play count on song: "${song.fileName}". Song had ${song.plays} plays.`);
	})
}


export async function addSongToPlaylist(songFileName: string, playlistName: string): Promise<void> {
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
		if(response.ok){
			renderCustomTextBox(`Successfully added to playlist: ${playlistName}`);
			return;
		}
		throw new Error(`Failed with status: ${response.status}`);
	})
	.catch(error => {
		handleServerError(error, `Failed to add song "${songFileName}" to playlist: "${playlistName}"`);
	})
}



export async function removeSongFromCurrPlaylist(song: Song): Promise<void> {
	const form = new FormData();
	form.append('songPlaylistIndex', song.dbIndex.toString());
	form.append('playlistName', currPlaylistName);

	return fetch(
		"/removeSong",
		{
			method: "POST",
			body: form,
		}
	)
	.then(response => {
		if(response.ok){
			renderCustomTextBox("Song removed from the current playlist successfully.");
			return;
		}

		throw new Error(`Failed with status ${response.status}. Index of song in DB: ${song.dbIndex}.`);
	})
	.catch(error => {
		handleServerError(error, `Failed to remove song "${song.fileName}" from the current playlist: "${currPlaylistName}"`);
	})
}


export async function deleteSongFromDB(songFileName: string, songName: string): Promise<void> {
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
		if(response.ok){
			renderCustomTextBox("Song successfully deleted.");
			return;
		}
		
		throw new Error(`Failed with status ${response.status}.`);
	})
	.catch(error => {
		handleServerError(error, `An error was encounted while deleting song: "${songFileName}"`);
	})
}


export async function getUpdatedPlaylistTime(playlistName: string): Promise<string> {
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
		throw new Error(`Failed with status: ${response.status}.`);
	})
	.then(data => {
		return data["totalTime"];
	})
	.catch(error => {
		handleServerError(error, `Failed to get most recent playlist time for playlist: ${playlistName}.`);
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
			throw new Error(`Failed with status: ${response.status}.`);
		}
	})
	.catch(error => {
		handleServerError(error, `Failed to update song with filename: "${songFileName}"`);
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
		throw new Error(`Failed with status: ${response.status}.`);
	})
	.then(data => {
		return data["songObj"];
	})
	.catch(error => {
		handleServerError(error, `Failed to retrieve song with filename: "${songFileName}"`);
	});
}