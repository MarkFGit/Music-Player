// File for anything that both the playlist and songs can read/write to.
// For example, the current playlist name is

import { getSpanElemByID, removeFileExtension, } from "../globals";


export const currPlaylistName = (() => {
	// On a playlist page the pathArr should be ["", "playlists", "<playlist_name>"]
	const pathArr = window.location.pathname.split("/");
	return decodeURI(pathArr[2]);
})();


export const isLastAddedPlaylist = (currPlaylistName === "Last Added");


/** This const refers to the element with id "songTable".
 * 
 * - This is the table that contains all the songs for the playlist. */
export const table = (() => {
	const elem = document.getElementById("song-table");
	if(elem instanceof HTMLTableElement){
		return elem;
	}
	throw new DOMException(`Failed to retrieve songTable element.`)
})();


/** This const refers to the element with id "mainAudio".
 * 
 * - This is the element which is responsible for the current playing song. */
export const audio = (() => {
	const elem = document.getElementById("main-audio");
	if(elem instanceof HTMLAudioElement){
		return elem;
	}
	throw new DOMException(`Failed to retrieve the "main-audio" element.`)
})();



export const currentRow = (() => {
	let _currentRow = null;

	return {
		set: function(rowIndex: number | null): void {
			if(rowIndex === null){
				_currentRow = null;
				return;
			}

			_currentRow = table.rows[rowIndex];
		},

		getIndex: function(): number | null {
			if(_currentRow === null) return null;
			return _currentRow.rowIndex;
		},
	};
})();



/** Keeps track of the last used non-priority song row. */
export const currentNonPriorityRow = (() => {
	/** Example of how this is used:
	 * 	 Say that song #2 is playing (not a priority song)
	 * 	 Before that song has finished, song #4 is queued. 
	 * 	 Song #4 will play next, and when it finishes it should move to song #3, NOT song #5. */
	let _currentNonPriorityRow: HTMLTableRowElement | null = null;

	return {
		set: function(rowIndex: number | null): void {
			if(rowIndex === null){
				_currentNonPriorityRow = null;
				return;
			}

			_currentNonPriorityRow = table.rows[rowIndex];
		},

		getIndex: function(): number | null {
			if(_currentNonPriorityRow === null) return null;
			return _currentNonPriorityRow.rowIndex;
		},
	};
})();


export function setPlayingDisplayTitle(artist: string, title: string, fileName: string){
	const playingTitle = getSpanElemByID("playing-title");
	if(artist === "" || title === ""){
		playingTitle.innerText = `Playing: ${removeFileExtension(fileName)}`;
	}
	else{
		playingTitle.innerText = `Playing: ${artist} - ${title}`;
	}
}