// As the name suggests, this file is solely responsible for communicating with the backend

import { Song, } from './songs';
import { currPlaylistName, } from './playlistGlobals';
import { renderCustomTextBox } from "./../renderCustomTextBox";
import { handleError, } from "./../contactServerGlobals";


export async function addSongToPlaylist(songFileName: string, playlistName: string): Promise<void> {
	const form = new FormData();
	form.append('fileName', songFileName);
	form.append('playlistName', playlistName);

	const response = await fetch("/insertNewSong", {method: "POST", body: form});

	if(response.ok){
		renderCustomTextBox(`Successfully added to playlist: ${playlistName}`);
		return;
	}

	handleError(`Failed to add song to playlist: ${playlistName}`, `Failed to add song: "${songFileName}" Failed with status: ${response.status}`);
}



export async function removeSongFromCurrPlaylist(song: Song): Promise<void> {
	const form = new FormData();
	form.append('indexInPlaylist', song.dbIndex.toString());
	form.append('playlistName', currPlaylistName);

	const response = await fetch("/removeSong", {method: "POST", body: form});

	if(response.ok){
		renderCustomTextBox("Song removed from the current playlist successfully.");
		return;
	}

	handleError("Failed to remove song from current playlist.", 
		`Failed with status: ${response.status}, index of song in DB: ${song.dbIndex},` +
		`song filename: ${song.fileName}, current playlist: ${currPlaylistName}`);
}


export async function deleteSongFromDB(songFileName: string): Promise<void> {
	const form = new FormData();
	form.append('songFileName', songFileName);

	const response = await fetch("/deleteSong", {method: "POST", body: form});

	if(response.ok){
		renderCustomTextBox("Song successfully deleted.");
		return;
	}

	handleError("Failed to delete song.", `Failed with status: ${response.status} and on song with filename: ${songFileName}`);
}


export async function getSong(songFileName: string){
	const response = await fetch("/getSongInfo", {method: "POST", body: songFileName});
	
	const result = await response.json();
	return result["songObj"];
}


export async function uploadSongFile(songFile: File){
	const form = new FormData();
	form.append("file", songFile);

	// This await is necessary, otherwise the SQL server recieves to many requests and will crash.
	// Wrap the this function call in a try catch block.
	// That way if uploading multiple files, one fails but the rest can attempt to go through.
	const response = await fetch("/uploadSongFile", { method: "POST", body: form });

	if(!response.ok){
		handleError(
			`Failed to upload song with filename: "${songFile.name}".` 
			+ "It is likely this file name already exists in the DB which is causing the error.",
			`Failed with status: ${response.status}.`
		);
		return;
	}

	renderCustomTextBox("Song successfully uploaded!");
}