import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {
	table, lastSongNum, updateLastSongNum, currPlaylistName,
	addNewSongObjectFromDictData,
} from './playlistGlobals';

import { fillPlaylistPreviewImages, } from './findImages';

import { RowContent, } from './RowContent';
import * as contactServer from "./contactServer";

export async function handleFileDrop(e: DragEvent){
	e.preventDefault();

	if(e.dataTransfer === null) return;
	if(!e.dataTransfer.items) return;

	const files = [...e.dataTransfer.items].map(item => item.getAsFile());

	for(const file of files){
		if(file === null) break;

		// This await is necessary, otherwise the SQL server recieves to many requests and will crash.
		// Wrap the this function call in a try catch block.
		// That way if uploading multiple files, one fails but the rest can attempt to go through.
		await contactServer.sendSongFile(file); 

		const newSongObj = await contactServer.getSong(file.name);
		const newTotalTime = await contactServer.getUpdatedPlaylistTime(currPlaylistName);
		updatePageForNewRow(newSongObj, newTotalTime);
	}
};



// This is used when the page is already loaded, a song is dropped and added to the table
function updatePageForNewRow(newSongObj: object, newTotalTime: string): void {
	document.getElementById("playlist-total-time").innerText = newTotalTime;

	addNewSongObjectFromDictData(newSongObj);
	if(lastSongNum !== null){
		updateLastSongNum(lastSongNum + 1);
	}
	
	// rowNums here are all 0 because adding a song adds it to Last Added.
	// Obviously, the song just added is the most recent. So it will be at the top of Last Added.
	const newRow = table.insertRow(0);
	newRow.classList.add("song-row");

	const rowNum = 0;
	const container = newRow;
	ReactDOM.render(<RowContent rowNum={rowNum}/>, container);

	fillPlaylistPreviewImages();	
}