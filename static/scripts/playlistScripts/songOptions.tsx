import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as contactServer from './contactServer';
import { 
	checkElemIsButtonElem, removeFileExtension,
	checkElemIsSpanElem, checkElemIsDivElem, checkElemIsCellElem,
	getInputElemByID, getImgElemByID, 
} from './../globals';
import {
    getRowIndexByEventTarget, getSongObjectByRowNum,
    isLastAddedPlaylist, currPlaylistName, table, Song,
    lastSongNum, removeObjFromSongObjectsList, updateLastSongNum,
    revertPageToNoSong, replaceObjInSongObjList,
} from './playlistGlobals';
import { renderScreenPrompt, removeScreenPrompt, } from "./../renderScreenPrompt";
import { ScreenPromptCancelButton, } from '../ScreenPromptCancelButton';
import { resolve_playlist_names, } from './../contactServerGlobals';
import { fillPlaylistPreviewImages, getSongImage,
	setSongImageByRowNum,
} from './findImages';


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



export function SongOptionsDropDown({e}: {e: React.MouseEvent}): JSX.Element {
	const rowNum = getRowIndexByEventTarget(e.target);

	const button = checkElemIsButtonElem(e.target);
	const buttonPos = button.getBoundingClientRect();
	const renderNearClickPos = {
		left: buttonPos.x + 'px',
		top: (buttonPos.y + 20) + 'px'
	};

	const song = getSongObjectByRowNum(rowNum);

	const removeSongOption 
		  = <span 
				className="song-option" 
				onClick={async () => {
					await contactServer.removeSongFromCurrPlaylist(song);
					const newPlaylistTime = await contactServer.getUpdatedPlaylistTime(currPlaylistName);
					updatePageForDeletedRow(rowNum, newPlaylistTime);
					unmountSongOptionsContainer();
					fillPlaylistPreviewImages();
				}}
			>
				Remove song from playlist 
			</span>;

	const editSongOption 
		  = <span 
				className="song-option"
				onClick={() => {
					renderEditSongWindow(song.rowNum);
					unmountSongOptionsContainer();
				}}
			>
				Edit Song Info
			</span>;

	return(
		<div 
			className="song-drop-down" 
			style={renderNearClickPos}
		>
			{isLastAddedPlaylist? null : removeSongOption}
			<span 
				className="song-option" 
				onClick={() => {
					renderDeleteSongScreenPrompt(song.fileName);
					unmountSongOptionsContainer();
				}}
			> 
				Delete song 
			</span>
			<span 
				className="song-option" 
				onClick={e => renderPlaylistNamesDropDown(e, song.fileName)}
			> 
				Add song to playlist
			</span>
			{isLastAddedPlaylist? editSongOption : null}
		</div>
	);
}


async function renderPlaylistNamesDropDown(e: React.SyntheticEvent, songFileName: string): Promise <void> {
	const playlistNames = await resolve_playlist_names();
	const index = playlistNames.indexOf("Last Added");
	if(index > -1){
		playlistNames.splice(index, 1);
	}

	const currentPlaylistIndex = playlistNames.indexOf(currPlaylistName);
	if(currentPlaylistIndex !== -1){
		playlistNames.splice(currentPlaylistIndex, 1); //remove current playlist from playlists to choose from
	}

	const songOption = checkElemIsSpanElem(e.target);
	const optionsDropDown = checkElemIsDivElem(songOption.parentElement);
	const parentPos = optionsDropDown.getBoundingClientRect();
	const stylePos = Object.freeze({
		left: parentPos.left + 'px',
		top: parentPos.top + 'px'
	});

	renderSongOptionsDropDown(
		<div className="song-drop-down" style={stylePos}>
			{playlistNames.map((name: string) => {
				return (
					<span 
						className="song-option"
						key={name}
						onClick={() => contactServer.addSongToPlaylist(songFileName, name)}
					> 
						{name} 
					</span>
				)
			})}
		</div>
	);
}


function updatePageForDeletedRow(rowIndex: number, newTotalTime: string){
	document.getElementById("playlist-total-time").innerText = newTotalTime;

	removeObjFromSongObjectsList(rowIndex);
	table.deleteRow(rowIndex);
	fillPlaylistPreviewImages();

	if(lastSongNum === null){
		return;
	}
	if(lastSongNum === rowIndex){
		revertPageToNoSong();
		return;
	}
	if(lastSongNum > rowIndex){
		updateLastSongNum(lastSongNum - 1);
	}
}



function renderDeleteSongScreenPrompt(songFileName: string): void {
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
                    updatePageForDeletedSong(songFileName, newTotalTime);
                    removeScreenPrompt();
                }}
            >
                Delete Song
            </button>
            <ScreenPromptCancelButton />
        </>
    );
}


function updatePageForDeletedSong(deletedSongFileName: string, newTotalTime: string){
	document.getElementById("playlist-total-time").innerText = newTotalTime;

	let i = 0;
	while(i < table.rows.length){
		const currSongFileName = getSongObjectByRowNum(i).fileName;
		if(currSongFileName === deletedSongFileName){
			removeObjFromSongObjectsList(i);
			table.deleteRow(i);
			if(lastSongNum === null){
				continue;
			}
			if(lastSongNum > i){
				updateLastSongNum(lastSongNum-1);
				continue;
			}
			if(lastSongNum === i){
				revertPageToNoSong();
			}
		}
		else{
			i++
		}
	}

	fillPlaylistPreviewImages();
}

function renderEditSongWindow(rowNum: number): void {
	const song = getSongObjectByRowNum(rowNum);

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
						await handleSongEdit(song.fileName, rowNum);
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
		editPreviewImg.src = await getSongImage(rowNum);
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

/** Gathers data from all fields, sends it to the backend.
 * Retrieve the new song information and update local page. */
async function handleSongEdit(songFileName: string, rowNum: number): Promise<void> {
	
	const promptElem = document.getElementById("base-screen-prompt");
	const editFields: NodeListOf<HTMLTextAreaElement> = promptElem.querySelectorAll(".generic-textbox");

	const newInfo = Object.freeze({
		newTitle: editFields[0].value,
		newArtist: editFields[1].value,
		newAlbum: editFields[2].value,
		newDate: editFields[3].value,
	});

	const files = getInputElemByID("img-upload").files;
	// if no image is chosen, imgFile will be of length 0.
	if(files.length === 0){
		await contactServer.updateSongInfo(newInfo, null, songFileName);
	}
	else if(files.length === 1){
		const song_img = files[0];
		await contactServer.updateSongInfo(newInfo, song_img, songFileName);
	}
	else{
		throw new Error(`Got more than one song image file while trying to edit song with filename: ${songFileName}`);
	}
	
	replaceObjInSongObjList(await contactServer.getSong(songFileName), rowNum);

	const currSong = getSongObjectByRowNum(rowNum);
	if(!currSong.isPlaying){
		setSongImageByRowNum(rowNum);
	}
	const row = checkElemIsCellElem(table.rows[rowNum].firstElementChild);
	updateSongRowProperties(row, currSong);
	fillPlaylistPreviewImages();
}

/** This only updates front-end text. This does not update the backend. */
function updateSongRowProperties(row: HTMLTableCellElement, newSong: Song){
	const rowFields: NodeListOf<HTMLSpanElement> = row.querySelectorAll("*");

	rowFields[1].innerText = newSong.title;
	rowFields[4].innerText = newSong.artist;
	rowFields[5].innerText = newSong.album;
	rowFields[7].innerText = newSong.date;
}