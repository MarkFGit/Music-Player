import * as React from 'react';
import * as ReactDOM from 'react-dom';


import { addNewScreenPromptEventlistener, } from './../newPlaylistScreenPrompt';
import './playlistPageEvents';

import { ScreenPromptCancelButton, } from "./../ScreenPromptCancelButton";
import { renderScreenPrompt, removeScreenPrompt, } from "./../renderScreenPrompt";

import * as contactServer from './contactServer';

import { resolve_playlist_names, } from './../contactServerGlobals'

import setSongImageByRowNum, { fillPlaylistPreviewImages, 
	determineFooterPlayImgSrc, getSongImage, } from './findImages';

import { removeFileExtension, PAGE_PROPERTIES, IMG_PATHS, getImgElemByID,
		getInputElemByID, checkElemIsCellElem, checkElemIsSpanElem,
		checkElemIsDivElem, } from './../globals';

import { Song, lastSongNum, updateLastSongNum, isDraggingSong, table, 
		currPlaylistName, isLastAddedPlaylist, audio, getImgByRow,
		removeObjFromSongObjectsList, replaceObjInSongObjList, getSongObjectByRowNum,
		getRowIndexByEventTarget, setDraggingSong, clickSongBySongNum,
		addNewSongObjectFromDictData, getNumOfSongs, } from './playlistGlobals';

window["createPage"] = createPage;
window["dragOverHandler"] = (e: DragEvent) => {e.preventDefault()};
window["fileDropHandler"] = async (e: DragEvent) => {
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


addNewScreenPromptEventlistener(null);


audio.addEventListener('timeupdate', () => {
	const songPosition = audio.currentTime / audio.duration;
	if(isNaN(songPosition)) return;

	updatePlayingSongTimestamp(songPosition);

	const playingSongEndedNaturally = (songPosition == 1 && !isDraggingSong);
	if(playingSongEndedNaturally){
		document.getElementById("seekBarProgress").style.width = '0%';

		const currentSong = getSongObjectByRowNum(lastSongNum);

		contactServer.incrementPlayCount(currentSong);

		const currRow = table.rows[currentSong.rowNum];
		const incrementedPlayCount = currentSong.plays + 1;
		updateRowPlay(currRow, incrementedPlayCount.toString());

		const isLastPlaylistSong = (currentSong.rowNum === table.rows.length-1);
		if(isLastPlaylistSong){
			currentSong.isPlaying = false;
			setSongImageByRowNum(lastSongNum);
			revertPageToNoSong();
			return;
		}

		const nextSongNum = lastSongNum + 1;
		clickSongBySongNum(nextSongNum);
	}
});

function updatePlayingSongTimestamp(songPosition: number){
	const seekBarProgress = document.getElementById("seekBarProgress");
	seekBarProgress.style.width = `${songPosition * 100}%`;

	const minutes = Math.floor(audio.currentTime / 60);
	let seconds = Math.floor(audio.currentTime % 60);
	let secondsStr = seconds.toString();

	if(seconds < 10){
		secondsStr = `0${seconds}`;
	}

	const updateCurrentTime = document.getElementById('currentTimeStamp');
	updateCurrentTime.innerText = `${minutes}:${secondsStr}`;
}


function revertPageToNoSong(){
	getImgElemByID('footerPlayImg').src = IMG_PATHS.globalPlayImgSrc;
	document.getElementById('currentTimeStamp').innerText = '-:--';
	document.getElementById('playingTitleID').innerText = 'Playing:';
	document.getElementById('playingTimeLength').innerText = '-:--';
	document.getElementById("seekBarProgress").style.width = '0%';

	table.rows[table.rows.length - 1].setAttribute('style', "background-color: ;");
	audio.src = "";

	updateLastSongNum(null);
}


document.getElementById("seekBar").addEventListener("mousedown", (e: MouseEvent) => {
	const noSelectedAudioSrc = `${PAGE_PROPERTIES.websiteOrigin}/playlists/${currPlaylistName}`;
	if(audio.src === noSelectedAudioSrc){
		return console.error("Error: Cannot use seekbar when no song is selected.");
	}

	setDraggingSong(true);
	audio.pause();

	e.preventDefault();

	setSeekBarWidth(e);
	updateCurrentSongTime();

	document.onmouseup = stopDragElement;
	document.onmousemove = dragElement;
});

function dragElement(e: MouseEvent) {
	e.preventDefault();

	setSeekBarWidth(e);
	updateCurrentSongTime();
}

function updateCurrentSongTime(){
	const seekBarProgress = document.getElementById("seekBarProgress");
	audio.currentTime = (parseFloat(seekBarProgress.style.width) / 100) * audio.duration;
}


function stopDragElement() {
	document.onmouseup = null;
	document.onmousemove = null;
	
	setDraggingSong(false);

	const currentSongSrc = getImgByRow(lastSongNum).src;
	const pausedFromDragging = (currentSongSrc === IMG_PATHS.globalPlayingGifSrc);
	if(pausedFromDragging) audio.play();
}


function setSeekBarWidth(e: MouseEvent){
	const seekBar = document.getElementById('seekBar');
	const seekBarWidth = parseFloat(window.getComputedStyle(seekBar).getPropertyValue('width'));

	const clickedPos = e.clientX;
	const seekBarLeftOffset = seekBar.getBoundingClientRect().left;
	const seekBarHandle = document.getElementById("seekBarHandle");
	const middleOfHandle = seekBarHandle.getBoundingClientRect().width / 2;
	const clickedWidth = clickedPos - seekBarLeftOffset - middleOfHandle;

	const seekBarProgress = document.getElementById("seekBarProgress");
	seekBarProgress.style.width = `${(clickedWidth / seekBarWidth) * 100}%`;
}



function createPage(){
	const numOfPlaylistSongs = parseInt(document.getElementById('scriptTag').getAttribute('numOfSongs'));
	const songNums = [...Array(numOfPlaylistSongs).keys()];

	const container = document.getElementById('tableBody');
	ReactDOM.render(
		<>
			{songNums.map((_, rowNum) => {
				const returnItem = <Row key={rowNum} props={{rowNum, numOfPlaylistSongs}}/>;
				setSongImageByRowNum(rowNum); // Song image src's will be set in Row func at a later point...
				return returnItem;
			})}
		</>,
		container
	);

	fillPlaylistPreviewImages();
}



function Row({props}){
	return(
		<tr className="songRowClass">
			<RowContent props={props}/>
		</tr>
	);
}



function RowContent({props}: {props: {rowNum: number, numOfPlaylistSongs: number}}){
	const {rowNum, numOfPlaylistSongs} = props;

	const song = getSongObjectByRowNum(rowNum);

	// Put songDiv in the Row function? This would eliminate the need for songRowClass
	// Current hierarchy:
		// <table row>
			// <Row> 
				// <RowContent> </RowContent>
				// <songDiv> </songDiv>
			// </Row>
		// </table row>
	// Could have instead:
		// <table row>
			// <RowContent> </RowContent>
			// <songDiv> </songDiv>    // songDiv should be renamed to rowDiv
	const isLastSong = (rowNum + 1 === numOfPlaylistSongs);

	// Both of the following components are used conditionally in the return statement.
	const songDiv = <div className="songDivider"></div>;
	const dateSpan = <span className="date-field-container"> {song.date} </span>;

	return(
		<>
			<td className="songContainer">
				<img 
					className="coverImg" 
					onClick = {songImgEventListener}
				>
				</img>
				<span className="large-field-container"> {song.title} </span>
				<button 
					className="songRowAddPlaylistButton" 
					onClick={e => renderSongDropDown(<SongOptionsDropDown e={e}/>)}
				>
					+
				</button>
				<span className="generic-attrs"> {song.duration} </span>
				<span className="medium-field-container"> {song.artist} </span>
				<span className="medium-field-container"> {song.album} </span>
				<span className="small-field-container"> {song.plays} </span>
				{isLastAddedPlaylist? dateSpan : null}
			</td>
			{isLastSong? null : songDiv}
		</>
	);
}


// This is used when the page is already loaded, a song is dropped and added to the table
function updatePageForNewRow(newSongObj: object, newTotalTime: string): void {
	document.getElementById("totalTimeText").innerText = newTotalTime;

	addNewSongObjectFromDictData(newSongObj);
	if(lastSongNum !== null){
		updateLastSongNum(lastSongNum + 1);
	}
	
	// rowNums here are all 0 because adding a song adds it to Last Added.
	// Obviously, the song just added is the most recent. So it will be at the top of Last Added.
	const newRow = table.insertRow(0);
	newRow.className = "songRowClass";

	const rowNum = 0;
	const numOfPlaylistSongs = getNumOfSongs();
	const container = newRow;
	ReactDOM.render(<RowContent props={{rowNum, numOfPlaylistSongs}}/>, container);

	setSongImageByRowNum(0);
	fillPlaylistPreviewImages();	
}


function updatePageForDeletedRow(rowIndex: number, newTotalTime: string){
	document.getElementById("totalTimeText").innerText = newTotalTime;

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


export function updatePageForDeletedSong(deletedSongFileName: string, newTotalTime: string){
	document.getElementById("totalTimeText").innerText = newTotalTime;

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



function unmountSongOptionsContainer(){
	const container = document.getElementById("songOptionsPromptContainer");
	ReactDOM.unmountComponentAtNode(container);
}


/** Generic prompt which is generated for a particular row.
 * So far this is only for:
 * 
 *  - the base song options
 * 
 *  - the playlist names */
function renderSongDropDown(customPrompt: JSX.Element){
	const container = document.getElementById("songOptionsPromptContainer");
	
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


function SongOptionsDropDown({e}){
	const rowNum = getRowIndexByEventTarget(e.target);

	const buttonPos = e.target.getBoundingClientRect();
	const clickPos = {
		left: buttonPos.x + 'px',
		top: (buttonPos.y + 20) + 'px'
	};

	const song = getSongObjectByRowNum(rowNum);

	const removeSongOption 
		  = <span 
				className="song-option" 
				onClick={async () => {
					await contactServer.removeSongFromCurrPlaylist(song.dbIndex);
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
		<>
			<div 
				className="song-drop-down" 
				style={clickPos}
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
		</>
	);
}


async function renderPlaylistNamesDropDown(e: React.SyntheticEvent, songFileName: string){
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

	renderSongDropDown(
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


function renderDeleteSongScreenPrompt(songFileName: string){
	const songName = removeFileExtension(songFileName);
	renderScreenPrompt(
        <>
            <span className="screenPromptText"> 
            	Are you sure you want to delete the song "{songName}" from your account? 
            </span>
            <button
                className="screenPromptPositiveButton"
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


function songImgEventListener(e: React.SyntheticEvent){
	const rowNum = getRowIndexByEventTarget(e.target);
	const song = getSongObjectByRowNum(rowNum);

	const clickedOnAnotherSong = (lastSongNum !== song.rowNum);
	if(clickedOnAnotherSong){
		const songIsAlreadySelected = (lastSongNum !== null);
		if(songIsAlreadySelected){ //revert previous song/row
			setSongImageByRowNum(lastSongNum);
			song.isPlaying = false;
			table.rows[lastSongNum].setAttribute("style", "");
		}
		audio.src = `${PAGE_PROPERTIES.staticFolderURL}/media/songs/${song.fileName}`;

		const playingTitleDiv = document.getElementById('playingTitleID');
		const songNameWithoutExtension = removeFileExtension(song.fileName);
		playingTitleDiv.innerText = `Playing: ${songNameWithoutExtension}`;

		const playingTimeLengthDiv = document.getElementById('playingTimeLength');
		playingTimeLengthDiv.innerText = song.duration;

		table.rows[rowNum].setAttribute("style", "background-color: #161616;");
		
		scrollPlaylistIfNeeded(rowNum);
	}

	if(song.isPlaying){
		pauseSong(song);
	}
	else{
		updateLastSongNum(rowNum);
		playSong(song);
	}
}


function pauseSong(song: Song){
	const playPromise = audio.play();

	// In browsers that don’t yet support this functionality, playPromise won’t be defined
	if(playPromise !== undefined){
		playPromise.then(() => {
			audio.pause();
			song.isPlaying = false;
			setSongImageByRowNum(song.rowNum);
			getImgElemByID('footerPlayImg').src = determineFooterPlayImgSrc(song.isPlaying);
		})
		.catch(error => {
			console.error(`${error}` + `Failed to pause song object with properties: ${JSON.stringify(song)}`);
		});
	}
}


function playSong(song: Song){
	audio.play();
	song.isPlaying = true;
	const imgForRow = getImgByRow(lastSongNum);
	imgForRow.src = IMG_PATHS.globalPlayingGifSrc;
	getImgElemByID('footerPlayImg').src = determineFooterPlayImgSrc(song.isPlaying);
}


function scrollPlaylistIfNeeded(rowNum: number){
	const playlistContainer = document.getElementById('playlistContentContainer');
	const playlistContainerCoords = playlistContainer.getBoundingClientRect();
	const currentRowCoords = table.rows[rowNum].getBoundingClientRect();

	if(currentRowCoords.bottom > playlistContainerCoords.bottom){
		table.rows[rowNum].scrollIntoView(false);
		return;
	}

	if(currentRowCoords.top < playlistContainerCoords.top){
		table.rows[rowNum].scrollIntoView();
	}
}



function renderEditSongWindow(rowNum: number){
	const song = getSongObjectByRowNum(rowNum);

	renderScreenPrompt(
		<>
			<span style={{width: "100%"}}> Edit Song Info </span>
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
					className="coverImg"
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
					className="screenPromptPositiveButton"
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
function SongEditTextField({props}: {props: {fieldName: string, defaultVal: string}}){
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


async function handleSongEdit(songFileName: string, rowNum: number): Promise<void> {
	/* gather data from all prompts, send it to backend. Retrieve the new db edits and update local page */
	const promptElem = document.getElementById("base-screen-prompt");
	const textBoxElems: NodeListOf<HTMLTextAreaElement> = promptElem.querySelectorAll(".generic-textbox");

	const newInfo = Object.freeze({
		newTitle: textBoxElems[0].value,
		newArtist: textBoxElems[1].value,
		newAlbum: textBoxElems[2].value,
		newDate: textBoxElems[3].value,
	});

	const files = getInputElemByID("img-upload").files;
	// if no image is chosen, imgFile will be of length 0.
	if(files.length === 0){
		await contactServer.updateSongInfo(newInfo, null, songFileName);
	}
	else if(files.length === 1){
		const song_img: File = files[0];
		await contactServer.updateSongInfo(newInfo, song_img, songFileName);
	}
	else{
		throw new Error(`Got more than one song image file while trying to edit song with filename: ${songFileName}`
		);
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

/** This only updates front-end text. This does not update the backend. 
 * This function, at this moment in time, should only be used to increment the plays count when a song finishes. */
function updateRowPlay(row: HTMLTableRowElement, newPlaysCount: string){
	const plays = row.querySelector(".play");
	if(plays instanceof HTMLSpanElement){
		plays.innerText = newPlaysCount;
	}
}