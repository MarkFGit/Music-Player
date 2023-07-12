import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { fillPlaylistPreviewImages, } from './playlist';
import { playlistSongs, } from './songs';

import { currPlaylistName, table, currentRow, } from './playlistGlobals';

import { renderCustomTextBox, } from '../renderCustomTextBox';
import { handleError, } from '../contactServerGlobals';


import { RowContent, } from './RowContent';
import * as contactServer from "./contactServer";

export async function handleFileDrop(e: DragEvent){
	e.preventDefault();

	if(e.dataTransfer === null) return;
	if(!e.dataTransfer.items) return;

	const files = [...e.dataTransfer.items].map(item => item.getAsFile());

	for(const songFile of files){
		if(songFile === null) break;

		// Checking if a file is of acceptable type should be done on the backend, not client-side.
		const allowedFileTypes = ["audio/mpeg", "audio/x-m4a"];

		if(!allowedFileTypes.includes(songFile.type)){
			break;
		}

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

		const newSongObj = await contactServer.getSong(songFile.name);
		const newTotalTime = await contactServer.getUpdatedPlaylistTime(currPlaylistName);
		updatePageForNewRow(newSongObj, newTotalTime);
	}
};



// This is used when the page is already loaded, a song is dropped and added to the table
function updatePageForNewRow(newSongObj: object, newTotalTime: string): void {
	document.getElementById("playlist-total-time").innerText = newTotalTime;

	playlistSongs.addSong(newSongObj);
	if(currentRow.getIndex() !== null){
		currentRow.set(currentRow.getIndex() + 1);
	}
	
	// rowIndex here is 0 because adding a song adds it to Last Added.
	// Obviously, the song just added is the most recent, so it will be at the top of Last Added.
	const newRow = table.insertRow(0);
	newRow.classList.add("song-row");

	ReactDOM.render(<RowContent rowIndex={0}/>, newRow);

	fillPlaylistPreviewImages();	
}