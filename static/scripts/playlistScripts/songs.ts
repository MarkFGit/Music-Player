import { handleError as handleError } from "../contactServerGlobals";
import { formatTime, IMG_PATHS, isPlaylistPage, removeFileExtension } from "../globals";

import { 
	currPlaylistName, isLastAddedPlaylist, table, setPlayingDisplayTitle, currentRow, audio,
} from "./playlistGlobals";



/** Object used to store a song's attributes. So far only data is kept here, no functions yet. 
 * This class is exported only for typing purposes. Do not use this constructor outside this file! 
 * 
 * */
export class Song{
	private _album: string;
	private _artist: string;
	// Should probably change this to Date type in the future...
	private _date: string;
	/** This attribute is the index of the song in corresponding playlist table. 
	 * Note: indices are not in `Last Added` so this is null for Last Added */
	private _dbIndex: number;
	readonly duration: string;
	readonly duration_seconds: number; 
	readonly fileName: string;
	private _hasCoverImage: boolean;
	/** This attribute should only be read in 'get coverImagePath'. It's used to avoid the caching problem in browsers. */
	private _coverImageNumberOfUpdates: number;
	/** This attribute will be used in the future when viewing a playlist as a queue is possible.  */
	isSkipped: boolean = false;
	private _plays: number;
	/** This attribute points the song's respective row in a table and is used solely to acccess the rowIndex via the rowIndex function.
	 * It allows for a song's rowIndex to be updated automatically via the inner workings of how a table manages its rows, so
	 * this means deleting/adding a song to the table requires no extra effort to maintain correct row indexes. */
	private readonly row: HTMLTableRowElement;
	private _title: string;


	constructor(songObj: object, index: number){
		this._album = songObj["album"];
		this._artist = songObj["artist"];
		this._date = songObj["date"];
		this._dbIndex = songObj["indexInPlaylist"];
		this.duration = formatTime(songObj["duration"]);
		this.duration_seconds = songObj["duration"];
		this.fileName = songObj["fileName"];
		this._hasCoverImage = songObj["hasCoverImage"];
		this._coverImageNumberOfUpdates = 0;
		this._plays = songObj["plays"];
		this.row = table.rows[index];
		this._title = songObj["title"];
	}

	get rowIndex(): number {
		return this.row.rowIndex;
	}

	get isThisSongCurrent(): boolean {
		return (currentRow.getIndex() === this.rowIndex);
	}

	get album(): string {
		return this._album;
	}

	get artist(): string {
		return this._artist;
	}

	get date(): string {
		return this._date;
	}

	get coverImagePath(): string {
		if(this._hasCoverImage) return `/static/media/songCovers/${removeFileExtension(this.fileName)}.jpeg?${this._coverImageNumberOfUpdates}`;
		
		return IMG_PATHS.noCoverImgSrc;
	}

	get dbIndex(): number {
		return this._dbIndex;
	}

	get hasCoverImage(): boolean {
		return this._hasCoverImage;
	}

	get plays(): number {
		return this._plays;
	}

	get title(): string {
		return this._title;
	}

	async setAlbum(newAlbum: string): Promise<void> {
		const response = await this.updateAttribute("album", newAlbum);

		if(!response.ok){
			this.handleUpdatingSongServerError("Unable to update album.", newAlbum, response);
			return;
		}

		this._album = newAlbum;

		this.updateSongRowText(".album", newAlbum);

		if(this.isThisSongCurrent){
			updateMediaSessionMetadata(this);
		}
	}

	async setArtist(newArtist: string): Promise<void> {
		const response = await this.updateAttribute("artist", newArtist);

		if(!response.ok){
			this.handleUpdatingSongServerError("Failed to update artist.", newArtist, response);
			return;
		}

		this._artist = newArtist;

		this.updateSongRowText(".artist", newArtist);
		
		if(this.isThisSongCurrent){
			// update the lower bar info
			setPlayingDisplayTitle(this._artist, this._title, this.fileName);

			updateMediaSessionMetadata(this);
		}
	}

	async setDate(newDate: string): Promise<void> {
		const response = await this.updateAttribute("date", newDate);

		if(!response.ok){
			this.handleUpdatingSongServerError("Failed to update date.", newDate, response);
			return;
		}

		// Example, with '2023-09-02' this obtains '23'
		const year = newDate.substring(2,4);
		let month = newDate.substring(5,7);
		let day = newDate.substring(8,10);
		if(parseInt(month) < 10) month = month[1]
		if(parseInt(day) < 10) day = day[1]

		// Final date is '9/2/23'
		const newTextDate = `${month}/${day}/${year}`;

		this._date = newTextDate;

		if(!isLastAddedPlaylist) return;

		this.updateSongRowText(".date", newTextDate)
	}

	async setTitle(newTitle: string): Promise<void> {
		const response = await this.updateAttribute("title", newTitle);

		if(!response.ok){
			this.handleUpdatingSongServerError("Failed to update title.", newTitle, response)
			return;
		}

		this._title = newTitle;

		if(this.isThisSongCurrent){
			// update the lower bar info
			setPlayingDisplayTitle(this._artist, this._title, this.fileName);

			updateMediaSessionMetadata(this);
		}
		
		this.updateSongRowText(".title", newTitle)
	}


	async setSongCoverImage(songImg: File): Promise<void> {
		const form = new FormData();
		form.append('songFileName', this.fileName);
		form.append('newSongImage', songImg);

		const response = await fetch('/updateSongImage', {method: "POST", body: form});

		if(!response.ok){
			throw new Error();
		}

		this._hasCoverImage = true;
		this._coverImageNumberOfUpdates += 1;

		if(this.isThisSongCurrent){
			updateMediaSessionMetadata(this);
		}
	}

	/** Used to change the play count of a song. Right now this is only used for incrementing the play count when a song ends. */
	async setPlayCount(newPlayCount: number): Promise<void> {
		const response = await this.updateAttribute("plays", newPlayCount.toString())

		if(!response.ok){
			this.handleUpdatingSongServerError("Failed to update play count.", newPlayCount.toString(), response);
			return;
		}

		this._plays += 1;

		if(!isPlaylistPage) return;

		this.updateSongRowText(".plays", newPlayCount.toString());
	}


	private updateSongRowText(selector: string, newValue: string){
		const elem = this.row.querySelector(selector);

		if(elem instanceof HTMLSpanElement){
			elem.innerText = newValue;
			return;
		}

		handleError(
			`Updating ${selector} field on frontend failed.`, 
			
			`Instead got element "${elem}" of type "${elem?.constructor.name}". `
			+
			`Row given: ${this.rowIndex}, with song: ${this.fileName}, within playlist: ${currPlaylistName}`
		);
	}


	/** Appends songFileName, attribute, and newValue to a form and sends it up to the server.
	 * A response is returned to validate that the update to the server was succesful.*/
	private async updateAttribute(attributeType: string, newValue: string): Promise<Response> {
		const form = new FormData();
		form.append('songFileName', this.fileName);
		form.append('attribute', attributeType);
		form.append('newValue', newValue);

		return await fetch('/updateSongInfo', {method: "POST", body: form});
	}


	/** Only invoke this function when a server error occured while trying to update an attribute of the song. 
	 * @param userError - A basic description of the error that will be displayed to the user as a notification.
	 * 
	 * @param attemptedNewValue - The value that was attempted to put into the database.
	 * This value will be the most likely cause for the error (violation of a schema's rules).
	 * 
	 * @param response - Used to display the response.status */
	private handleUpdatingSongServerError(userError: string, attemptedNewValue: string, response: Response): void {
		handleError(userError, `Attempted to change this attribute to a value of: ${attemptedNewValue}` + 
			`\nFailed with:\n\tStatus: ${response.status}\n\tFile name of song: ${this.fileName}\n\tPlaylist name: ${currPlaylistName}`);
	}
}


export const playlistSongs = (() => {
	/** List of all song objects for the entire page. This list is in the same order as the playlist. */
	const _allSongs: Array<Song> = [];
	let _initialized: boolean = false;

	return {
		/** Called ONLY on page load AFTER the basic table structure has been created. 
		 * Throws error if intialize is called more than once. */
		initialize: function(): void {
			if(_initialized === true){
				throw Error("Tried to initilize playlist songs more than once.")
			}

			const dictObjects: Array<object> = JSON.parse(
				document.getElementById("script-tag").getAttribute("songObjectList")
			);

			dictObjects.forEach((dictSongObject: object, index: number) => _allSongs.push(new Song(dictSongObject, index)));
			
			_initialized = true;
			// No longer need the information of this attribute once the songs array is initialized.
			document.getElementById("script-tag").removeAttribute("songObjectList");
		},

		addSong: function(dictionarySong: object): void {
			_allSongs.unshift(new Song(dictionarySong, 0));
		},

		removeSong: function(rowIndex: number): void {
			_allSongs.splice(rowIndex, 1);
		},

		getSong: function(rowIndex: number): Song {
			return _allSongs[rowIndex];
		},

		getPlaylistTimeInSeconds: function(): number {
			let sum = 0
			for(const song of _allSongs){
				sum += song.duration_seconds;
			}

			return sum;
		}
	};
})();


/** List of songs in the priority "queue" used for the "play next" feature.
 * This is not an actual "queue" data structure. Just referred as one for the user. */
export const prioritySongs = (() => {
	/** List of songs in the priority "queue" used for the "play next" feature.
	* This is not an actual "queue" data structure. Just referred as one for the user. */
	const _prioritySongs: Array<Song> = [];

	return {
		isEmpty: function(): boolean {
			return (_prioritySongs.length === 0);
		},

		addSong: function(song: Song): void {
			_prioritySongs.push(song);
		},

		getNextRowIndex: function(): number {
			if(this.isEmpty()){ // will want to check that this works properly...
				throw new Error("Tried to get next priority song, but priority songs is empty.")
			}

			return _prioritySongs[0].rowIndex;
		},

		dequeueNextSong: function(): void {
			_prioritySongs.splice(0, 1);
		},

		updateForDeletedSong: function(deletedSongFileName: string): void {
			// If the array.filter method didn't return a new array, it would be used here.
			let i = 0;
			for(const prioritySong of _prioritySongs){
				if(prioritySong.fileName === deletedSongFileName){
					_prioritySongs.splice(i, 1);
				}

				i++;
			}
		},
	}
})();



/** This function changes the mediasession information. Mediasession information is displayed via media control pop-ups on different platforms
(i.e. Windows/iOS/Android, etc.) */
export async function updateMediaSessionMetadata(song: Song){
	navigator.mediaSession.metadata = new MediaMetadata({
		title: song.title,
		artist: song.artist,
		album: song.album,
		artwork: [{src: song.coverImagePath}]
	})
}