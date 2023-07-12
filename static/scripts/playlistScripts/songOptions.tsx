import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as contactServer from './contactServer';
import { 
	removeFileExtension, getInputElemByID, getImgElemByID, 
} from './../globals';

import { 
	getRowIndexByEventTarget, fillPlaylistPreviewImages, revertPageToNoSong, setToCoverImg,
} from './playlist';

import { table, currPlaylistName, isLastAddedPlaylist, audio, currentRow, } from './playlistGlobals';

import { Song, playlistSongs, prioritySongs, } from './songs';


import { renderScreenPrompt, removeScreenPrompt, } from "./../renderScreenPrompt";
import { ScreenPromptCancelButton, } from '../ScreenPromptCancelButton';
import { resolvePlaylistNames, } from './../contactServerGlobals';
import { getSongImage, } from './findImages';


/** Generic prompt which is generated for a particular row.
 * So far this is only for:
 * 
 *  - the base song options
 * 
 *  - the playlist names (when adding a song to another playlist) */
export function renderSongOptionsDropDown(customPrompt: JSX.Element){
	const container = document.getElementById("song-options-prompt-container");
	
	ReactDOM.render(
		<div 
			className="song-drop-down-invisible-background"
			onClick={e => {
				const t = e.target;
				if(t instanceof HTMLDivElement && t.className === "song-drop-down-invisible-background"){
					ReactDOM.unmountComponentAtNode(container);
				}
			}}
		>
			{customPrompt}
		</div>,
		container
	);
}


export function unmountSongOptionsContainer(){
	const container = document.getElementById("song-options-prompt-container");
	ReactDOM.unmountComponentAtNode(container);
}


function SongOption(optionText: string, onClickFunc: React.MouseEventHandler){
	return(
		<div className="song-option" onClick={onClickFunc} key={optionText}> {optionText} </div>
	)
}


export function SongOptionsDropDown({e}: {e: React.MouseEvent}): JSX.Element {
	const button = e.target as HTMLButtonElement;
	const buttonPos = button.getBoundingClientRect();
	const renderNearClickPosition = {
		left: buttonPos.x + 'px',
		top: (buttonPos.y + 20) + 'px'
	};

	const rowNum = getRowIndexByEventTarget(e.target);
	const song = playlistSongs.getSong(rowNum);

	const removeSongOption = SongOption("Remove Song From Playlist", async () => {
		await contactServer.removeSongFromCurrPlaylist(song);
		const newPlaylistTime = await contactServer.getUpdatedPlaylistTime(currPlaylistName);
		updatePageForDeletedRow(rowNum, newPlaylistTime);
		unmountSongOptionsContainer();
	});

	const editSongOption = SongOption("Edit Song Info", () => {
		renderEditSongWindow(song.rowIndex);
		unmountSongOptionsContainer();
	}) ;

	return(
		<div 
			className="song-drop-down" 
			style={renderNearClickPosition}
		>
			{SongOption("Add to Priority Queue", () => {
				prioritySongs.addSong(song);
				unmountSongOptionsContainer();
			})}

			{SongOption("Add Song to Playlist", e => renderPlaylistNamesDropDown(e, song.fileName))}
			{isLastAddedPlaylist? null : removeSongOption}
			{SongOption("Delete Song", () => {
				renderDeleteSongScreenPrompt(song.rowIndex, song.fileName);
				unmountSongOptionsContainer();
			})}
			{isLastAddedPlaylist? editSongOption : null}
		</div>
	);
}


async function renderPlaylistNamesDropDown(e: React.SyntheticEvent, songFileName: string): Promise <void> {
	const playlistNames = await resolvePlaylistNames();
	const index = playlistNames.indexOf("Last Added");
	if(index > -1){
		playlistNames.splice(index, 1);
	}

	const currentPlaylistIndex = playlistNames.indexOf(currPlaylistName);
	if(currentPlaylistIndex !== -1){
		playlistNames.splice(currentPlaylistIndex, 1); //remove current playlist from playlists to choose from
	}

	const songOption = e.target as HTMLSpanElement;
	const optionsDropDown = songOption.parentElement as HTMLDivElement;
	const parentPos = optionsDropDown.getBoundingClientRect();
	const stylePos = Object.freeze({
		left: parentPos.left + 'px',
		top: parentPos.top + 'px'
	});

	renderSongOptionsDropDown(
		<div className="song-drop-down" style={stylePos}>
			{playlistNames.map((name: string) => {
				return(SongOption(name, () => contactServer.addSongToPlaylist(songFileName, name)))
			})}
		</div>
	);
}


function updatePageForDeletedRow(rowIndex: number, newTotalTime: string){
	if(currentRow.getIndex() === rowIndex){
		revertPageToNoSong();
	}

	playlistSongs.removeSong(rowIndex);
	table.deleteRow(rowIndex);
	fillPlaylistPreviewImages();

	document.getElementById("playlist-total-time").innerText = newTotalTime;
}



function renderDeleteSongScreenPrompt(songRowIndex: number, songFileName: string): void {
	const songName = removeFileExtension(songFileName);
	renderScreenPrompt(
        <>
            <span className="screen-prompt-text"> 
            	Are you sure you want to delete the song "{songName}" from your account? 
            </span>
            <button
                className="screen-prompt-positive-button"
                onClick={async () => {
                    await contactServer.deleteSongFromDB(songFileName, songName);
                    const newTotalTime = await contactServer.getUpdatedPlaylistTime(currPlaylistName);
                    updatePageForDeletedSong(songRowIndex, songFileName, newTotalTime);
                    removeScreenPrompt();
                }}
            >
                Delete Song
            </button>
            <ScreenPromptCancelButton />
        </>
    );
}


function updatePageForDeletedSong(songRowIndex: number, deletedSongFileName: string, newTotalTime: string){
	document.getElementById("playlist-total-time").innerText = newTotalTime;

	if(songRowIndex === currentRow.getIndex()){
		revertPageToNoSong();
	}

	// Iterating over the whole playlist must be done, because in all playlists other than 'Last Added' a particular song could appear multiple times.
	Array.from(table.rows).forEach(row => {
		const song = playlistSongs.getSong(row.rowIndex);

		if(song.fileName === deletedSongFileName){
			playlistSongs.removeSong(row.rowIndex);
			table.deleteRow(row.rowIndex);
		}
	});

	// need to go through priority songs too
	prioritySongs.updateForDeletedSong(deletedSongFileName);

	fillPlaylistPreviewImages();
}

function renderEditSongWindow(rowNum: number): void {
	const song = playlistSongs.getSong(rowNum);

	renderScreenPrompt(
		<>
			<span className="screen-prompt-text"> Edit Song Info </span>
			<input 
				type="file" 
				accept="image/*" 
				id="img-upload" 
				style={{display: "none"}}
				onChange={() => {
					const newImgFile = getInputElemByID("img-upload").files[0];
					const previewImg = getImgElemByID("edit-prompt-img");
					const fr = new FileReader();
					fr.onload = () => (previewImg.src = fr.result.toString());					
					fr.readAsDataURL(newImgFile);
				}}
			>
			</input>
			<label htmlFor="img-upload">
				<span> Change Picture: </span>
				<img 
					id="edit-prompt-img"
					className="row-img"
					/* will want some onHover effect in the future */
				>
				</img>
			</label>

			<SongEditTextField props={{fieldName: "Title", defaultVal: song.title}}/>
			<SongEditTextField props={{fieldName: "Artist", defaultVal: song.artist}}/>
			<SongEditTextField props={{fieldName: "Album", defaultVal: song.album}}/>

			<div className="generic-attrs">
				<span className="generic-attrs"> Date: </span>
				<input className="generic-textbox" type="date"></input>
			</div>
			
			<div className="generic-attrs">
				<button 
					className="screen-prompt-positive-button"
					onClick={async () => {
						await handleSongEdit(rowNum);
						removeScreenPrompt();
					}}
				>
					Confirm
				</button>
				<ScreenPromptCancelButton/>
			</div>
		</>
	);

	const setImgSrc = async () => {
		const editPreviewImg = getImgElemByID("edit-prompt-img");
		editPreviewImg.src = await getSongImage(song.fileName);
	};

	setImgSrc();
}


/** Component which describes any text field within the Edit Song Info screen prompt. */
function SongEditTextField({props}: {props: {fieldName: string, defaultVal: string}}): JSX.Element {
	const {fieldName, defaultVal} = props;

	return(
		<div className="generic-attrs">
			<span className="generic-attrs"> {fieldName}: </span>
			<input
				className="generic-textbox"
				type="text" 
				defaultValue={defaultVal}>
			</input>
		</div>
	);
}


function hasFieldBeenEditted(field: HTMLTextAreaElement): boolean {
	return (field.defaultValue !== field.value);
}


/** Gathers data from all fields, sends it to the backend.
 * Retrieve the new song information and update local page. 
 * 
 * @param rowNum - index of the row that is having its data updated.
 * 
 * */
async function handleSongEdit(rowNum: number): Promise<void> {
	
	const promptElem = document.getElementById("base-screen-prompt");
	const editFields: NodeListOf<HTMLTextAreaElement> = promptElem.querySelectorAll(".generic-textbox");

	const [titleField, artistField, albumField, dateField] = editFields;

	const song = playlistSongs.getSong(rowNum);

	if(hasFieldBeenEditted(titleField)) await song.setTitle(titleField.value);

	if(hasFieldBeenEditted(artistField)) await song.setArtist(artistField.value);

	if(hasFieldBeenEditted(albumField)) await song.setAlbum(albumField.value);

	if(hasFieldBeenEditted(dateField)) await song.setDate(dateField.value);

	const files = getInputElemByID("img-upload").files;

	if(files.length > 1){
		throw new Error(`Got more than one song image file while trying to edit song with filename: ${song.fileName}`);
	}

	if(files.length === 1){
		await song.setSongCoverImage(files[0]);

		if(audio.paused || rowNum !== currentRow.getIndex()){
			setToCoverImg(rowNum);
		}
		fillPlaylistPreviewImages();
	}
}