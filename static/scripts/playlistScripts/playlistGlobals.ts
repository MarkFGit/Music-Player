// This file is used for globals which are used *only* within pages that start with /playlist/

/** Object used to store a song's attributes. So far only data is kept here, no functions yet. 
 * This class is exported only for typing purposes. Do not use this constructor outside this file! */
export class Song{
	album: string;
	artist: string;
	date: string;
	/** This var is the index of the song in corresponding playlist table. 
	 * Note: indices are not in `Last Added` so this is null for Last Added */
	dbIndex: number;
	duration: string;
	fileName: string;
	isPlaying: boolean = false; // Default is false because when page loads nothing is playing!
	plays: number;
	title: string;
	/** This value is zero indexed. Additionally, the default rowNum is 0.
	 * This value will be incorrect for all songs except the first in a playlist.
	 * To fix this error, retrieve song objects ONLY via the "getSongObjectByRowNum" function.
	 * This function sets the rowNum to the appropriate number before returning. 
	 * Having the rowNum set up this way means rowNums never need to be updated when
	 * deleting/adding new songs. (or when songs get rearranged, this will be in the future) */
	rowNum: number = 0; 

	constructor(songObj: object){
		this.album = songObj["album"];
		this.artist = songObj["artist"];
		this.date = songObj["date"];
		this.dbIndex = songObj["dbIndex"];
		this.duration = songObj["duration"];
		this.fileName = songObj["fileName"];  
		this.plays = songObj["plays"];
		this.title = songObj["title"];
	}
}


/** Number of the song that was last playing. Or current playing????? */
/** Only import this var to compare. Update its val with updateLastSongNum().
 * This var is zero indexed. */
export let lastSongNum: null | number = null;


/** Keeps track of if the seekBarHandle is being dragged. 
 * i.e. the song time is being moved manually. */
/* Rename this to isDraggingSong or something else... */
export let isDraggingSong = false;

export const currPlaylistName = _getPlaylistName();

export const isLastAddedPlaylist = (_getPlaylistName() === "Last Added");


/** This const refers to the element with id "songTable".
 * 
 * - This is the table which is the playlist that a user interacts with. */
export const table = _getPlaylistTable();

/** This const refers to the element with id "mainAudio".
 * 
 * - This is the element which is responsible for the current playing song. */
export const audio = _getMainAudio();



/** List of all song objects for the entire page.
 * This list is in the same order as the playlist. */
const _songs: Array<Song> = JSON.parse(
		document.getElementById('scriptTag').getAttribute('songObjectList')
	).map((dictSongObject: object) => new Song(dictSongObject));


export function updateLastSongNum(newNum: number | null): void {
	lastSongNum = newNum;
}


export function setDraggingSong(isDraggingSong: boolean): void {
	isDraggingSong = isDraggingSong;
}


export function getNumOfSongs(){
	return _getPlaylistTable().rows.length;
}


/** Grabs the "songTable" element. This element should really be renamed to playlistTable.
 * This table throws a NoSongTableError if the element is not found.
 * The function is designed as such so it always returns a HTMLTableElement.
 * Thus there is never a need to check for null.*/
function _getPlaylistTable(): HTMLTableElement {
	const elem = document.getElementById("songTable");
	if(elem instanceof HTMLTableElement){
		return elem;
	}
	throw new DOMException(`Failed to retrieve songTable element.`)
}


/** This is denoted as private since this should only be used to get the 'mainAudio' element. */
function _getMainAudio(): HTMLAudioElement {
	const elem = document.getElementById("mainAudio");
	if(elem instanceof HTMLAudioElement){
		return elem;
	}
	throw new DOMException(`Failed to retrieve the "mainAudio" element.`)
}


/** Returns the image for a song for the given row in the playlist table. */
export function getImgByRow(songRow: number): HTMLImageElement {
	const elem = table.rows[songRow].firstElementChild.firstElementChild;
	if(elem instanceof HTMLImageElement){
		return elem;
	}
	throw new DOMException(`Failed to retrieve song Img for the row with row number: ${songRow}`)
}


export function getRowIndexByEventTarget(t: EventTarget): number {
	if(t instanceof HTMLButtonElement || t instanceof HTMLImageElement){
		t = t.parentElement;
		if(t instanceof HTMLTableCellElement){
			t = t.parentElement;
			if(t instanceof HTMLTableRowElement){
				return t.rowIndex;
			}
		}
	}

	throw new DOMException(`Failed to get rowIndex. Failed with t: ${t}`);
}


function _getPlaylistName(): string {
	/** On a playlist page the pathArr should be
	 * ["", "playlists", "<playlist_name>] */
	const pathArr = window.location.pathname.split("/");
	return decodeURI(pathArr[2]);
}


export function addNewSongObjectFromDictData(dictSong: object): void {
	addToSongObjectsList(new Song(dictSong));
}


/** Adds a new song object to the list at the beginning of the array. */
function addToSongObjectsList(newSongObj: Song): void {
	_songs.unshift(newSongObj);
}


export function clickSongBySongNum(songNum: number): void {
	getImgByRow(songNum).click();
}


export function removeObjFromSongObjectsList(index: number): void {
	_songs.splice(index, 1);
}


export function getSongObjectByRowNum(rowNum: number): Song {
	const song = _songs[rowNum];
	// Assigns correct rowNum to the song object here.
	song.rowNum = rowNum;
	return song;
}


export function replaceObjInSongObjList(newSongObj: Song, index: number): void {
	_songs[index] = newSongObj;
}