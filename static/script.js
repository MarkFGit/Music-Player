// songNums/lastSongNum are 0 indexed

/* import scss so webpack builds composite css file */
import './main.scss';
import './homePage.scss';
import './lowerBarStyles.scss';
import './globalComponentStyles.scss';
import './notFoundPage.scss';
/* ************************************************ */

import {DeleteSongScreenPrompt, renderScreenPrompt,
		ScreenPromptCancelButton, removeScreenPrompt} from './globalEventListener.js';

import updateEventScriptSongNum, {prepareHeaderButtonListeners, 
	   prepareFooterButtonListeners} from './eventScript.js';

import dragOverHandler, {fileDropHandler, incrementPlayCount,
		createNewPlaylistToServer, resolveCustomPlaylistNames, 
		addSongToPlaylistInDB, removeSongFromPlaylist,
		updateSongInfoInDB, getSongInfoFromDB} from './contactServer.js'

import setSongImage, {getSongImage, fillPlaylistPreviewImages, 
	determineFooterPlayImgSrc, setSongImageByElem} from './findImages.js';


import {getPlaylistName, removeFileExtension, addToSongObjectsList,
		removeObjFromSongObjectsList, getSongObjectsList,
		getImgByRow, getSongObjectBySongRow, replaceObjInSongObjList} from './globals.js';

const iconFolderPath = 'http://127.0.0.1:5000/static/media/icons/';
const staticFolderURL = 'http://127.0.0.1:5000/static';
const globalPlayImgSrc = `${iconFolderPath}play.png`;
const globalPlayingGifSrc = `${iconFolderPath}playing.gif`;
const noCoverImgSrc = `${iconFolderPath}noCoverImg.png`;


const table = document.getElementById("songTable");
const mainAudio = document.getElementById("mainAudio");
const playlistName = getPlaylistName();
const isLastAddedPlaylist = (playlistName === "Last Added");


const React = require('react');
const ReactDOM = require('react-dom');

let lastSongNum = null;
let draggingSong = false;

window.dragOverHandler = dragOverHandler;
window.fileDropHandler = fileDropHandler;
window.createPage = createPage;
window.mouseDown = mouseDown;


export function clickSongBySongNum(songNum){
	table.rows[songNum].firstElementChild.firstElementChild.click();
}


function getNextSongObject(lastSongNum){
	return getSongObjectBySongRow(lastSongNum + 1);
}


export function getSongRow(songRow){
	return table.rows[songRow].firstElementChild;
}

function updateSongNum(currentSongNum){
	lastSongNum = currentSongNum;
	updateEventScriptSongNum(lastSongNum);
}


mainAudio.addEventListener('timeupdate', () => {
	const songPosition = mainAudio.currentTime / mainAudio.duration;
	if(isNaN(songPosition)) return;

	updatePlayingSongTimestamp(songPosition);

	const playingSongEndedNaturally = (songPosition == 1 && !draggingSong);
	if(playingSongEndedNaturally){
		seekBarProgress.style.width = '0%';

		const currentSongObject = getSongObjectBySongRow(lastSongNum);
		incrementPlayCount(currentSongObject);

		const isLastPlaylistSong = (currentSongObject.songNum === table.rows.length-1);
		if(isLastPlaylistSong){
			currentSongObject.isPlaying = false;
			setSongImage(lastSongNum);
			revertPageToNoSong();
			return;
		}

		const nextSongNum = lastSongNum + 1;
		clickSongBySongNum(nextSongNum);
	}
});

function updatePlayingSongTimestamp(songPosition){
	seekBarProgress.style.width = `${songPosition * 100}%`;

	const minutes = Math.floor(mainAudio.currentTime / 60);
	let seconds = Math.floor(mainAudio.currentTime % 60);

	if(seconds < 10){
		seconds = `0${seconds}`;
	}

	const updateCurrentTime = document.getElementById('currentTimeStamp');
	updateCurrentTime.innerText = `${minutes}:${seconds}`;
}



function revertPageToNoSong(){
	document.getElementById('footerPlayImg').src = globalPlayImgSrc;
	document.getElementById('currentTimeStamp').innerText = '-:--';
	document.getElementById('playingTitleID').innerText = 'Playing:';
	document.getElementById('playingTimeLength').innerText = '-:--';
	table.rows[table.rows.length - 1].style = "background-color: ;";
	mainAudio.src = "";

	updateSongNum(null);
}



function mouseDown(event) {
	const noSelectedAudioSrc = `http://127.0.0.1:5000/playlists/${playlistName}`;
	if(mainAudio.src === noSelectedAudioSrc){
		return console.error("Error: Cannot use seekbar when no song is selected.");
	}

	draggingSong = true;
	mainAudio.pause();

	const e = event || window.event;
	e.preventDefault();

	calculateDragWidth();
	calculateCurrentTime();

	document.onmouseup = stopDragElement;
	document.onmousemove = dragElement;
}

function dragElement(event) {
	const e = event || window.event;
	e.preventDefault();

	calculateDragWidth();
	calculateCurrentTime();
}

function calculateCurrentTime(){
	mainAudio.currentTime = (parseFloat(seekBarProgress.style.width) / 100) * mainAudio.duration;
}


function stopDragElement() {
	document.onmouseup = null;
	document.onmousemove = null;
	
	draggingSong = false;

	const currentSongSrc = getImgByRow(lastSongNum).src;
	const pausedFromDragging = (currentSongSrc === globalPlayingGifSrc);
	if(pausedFromDragging) mainAudio.play();
}


function calculateDragWidth(){
	const seekBar = document.getElementById('seekBar');
	const seekBarWidth = parseFloat(window.getComputedStyle(seekBar).getPropertyValue('width'));

	const clickedPos = event.clientX;
	const seekBarLeftOffset = seekBar.getBoundingClientRect().left;
	const middleOfHandle = seekBarHandle.getBoundingClientRect().width / 2;
	const clickedWidth = clickedPos - seekBarLeftOffset - middleOfHandle;

	seekBarProgress.style.width = `${(clickedWidth / seekBarWidth) * 100}%`;
}

const numOfPlaylistSongs = parseInt(document.getElementById('scriptTag').getAttribute('numOfSongs'));
function createPage(){
	const songNums = [...Array(numOfPlaylistSongs).keys()];
	ReactDOM.render(
		<>
			{songNums.map((value, index) => {
				const returnItem = <Row key={index} songNum={index}/>;
				setSongImage(index); // Song image src's will be set in Row func at a later point...
				return returnItem;
			})}
		</>,
		document.getElementById('tableBody')
	);

	fillPlaylistPreviewImages();
	prepareHeaderButtonListeners();
	prepareFooterButtonListeners();
}



function Row({songNum}){
	return(
		<tr className = "songRowClass">
			<RowContent songNum={songNum}/>
		</tr>
	);
}



function RowContent({songNum}){
	const songObject = new addSongObject(songNum);

	const songObjectsList = getSongObjectsList();
	const currentSongObject = songObjectsList[songNum];

	let songDiv = <div className="songDivider"></div>;
	const isLastSong = (songNum + 1 === numOfPlaylistSongs);
	if(isLastSong){
		songDiv = null;
	}

	let dateSpan = null;
	if(playlistName === "Last Added"){
		dateSpan = <span className="date-field-container"> {currentSongObject['date']} </span>;
	}

	return(
		<>
			<td className = "songContainer">
				<img 
					className = "coverImg" 
					getsongobject = {songObject} 
					onClick = {songImgEventListener}
				>
				</img>
				<span className = "large-field-container"> {currentSongObject['title']} </span>
				<button 
					className = "songRowAddPlaylistButton" 
					onClick={e => createSongOptionsDropDown(e, songObject)}
				>
					+
				</button>
				<span> {currentSongObject['duration']} </span>
				<span className = "medium-field-container"> {currentSongObject['artist']} </span>
				<span className = "medium-field-container"> {currentSongObject['album']} </span>
				<span className = "play small-field-container"> {currentSongObject['plays']} </span>
				{dateSpan}
			</td>
			{songDiv}
		</>
	);
}



// This is used when the page is already loaded, a song is dropped and added to the table
export function updatePageForNewRow(newSongObj, newTotalTime){
	document.getElementById("totalTimeText").innerText = newTotalTime;

	addToSongObjectsList(newSongObj);
	if(lastSongNum !== null){
		updateSongNum(lastSongNum + 1);
	}
	
	const newRow = table.insertRow(0);
	newRow.className = "songRowClass";
	ReactDOM.render(<RowContent songNum={0}/>, newRow);

	updateTableSongNums();
	setSongImage(0);
	fillPlaylistPreviewImages();	
}


function updateTableSongNums(){
	// Essentially, this just keeps the songNums in check after a new song is added 
		// this will probably also be used when deleting a song
	for(let newSongNum = 0; newSongNum < table.rows.length; newSongNum++){
		getSongObjectBySongRow(newSongNum).songNum = newSongNum;
	}
}



export function updatePageForDeletedRow(rowIndex, newTotalTime){
	document.getElementById("totalTimeText").innerText = newTotalTime;

	removeObjFromSongObjectsList(rowIndex);
	table.deleteRow(rowIndex);
	updateTableSongNums();
	fillPlaylistPreviewImages();

	if(lastSongNum === null){
		return;
	}
	if(lastSongNum === rowIndex){
		revertPageToNoSong();
		return;
	}
	if(lastSongNum > rowIndex){
		updateSongNum(lastSongNum - 1);
	}
}


export function updatePageForDeletedSong(songFileName, newTotalTime){
	document.getElementById("totalTimeText").innerText = newTotalTime;

	let i = 0;
	while(i < table.rows.length){
		const currSongFileName = getSongObjectBySongRow(i).songFileName;
		if(currSongFileName === songFileName){
			removeObjFromSongObjectsList(i);
			table.deleteRow(i);
			if(lastSongNum === null){
				continue;
			}
			if(lastSongNum > i){
				updateSongNum(lastSongNum-1);
				continue;
			}
			if(lastSongNum === i){
				revertPageToNoSong();
			}

			i = 0;
		}
		i++;
	}

	updateTableSongNums();
	fillPlaylistPreviewImages();
}


const songOptionsPromptContainer = document.getElementById("songOptionsPromptContainer")
songOptionsPromptContainer.addEventListener('click', e => {
	if(e.target.className === "addSongToPlaylistPrompt"){	
		removeAddSongPrompt();
	}
});


export function removeAddSongPrompt(){
	ReactDOM.unmountComponentAtNode(songOptionsPromptContainer);
}


function createSongOptionsDropDown(e, songObject){
	const buttonPos = e.target.getBoundingClientRect();
	const stylePos = {
		left: buttonPos.x + 'px',
		top: (buttonPos.y + 20) + 'px'
	};
	const songFileName = songObject.songFileName;
	const indexInDB = songObject.songPlaylistIndex;
	const indexInPage = songObject.songNum;

	let removeSongOption = null;
	if(!isLastAddedPlaylist){
		removeSongOption 
		  = <span 
				className="playlistSongOption" 
				onClick={() => {
					removeSongFromPlaylist(indexInDB, indexInPage);
					removeAddSongPrompt();
					fillPlaylistPreviewImages();
				}}
			>
				Remove song from playlist 
			</span>;
	}

	let editSongOption = null;
	if(isLastAddedPlaylist){
		editSongOption
		  = <span 
				className="playlistSongOption"
				onClick={e => {
					removeAddSongPrompt();
					renderEditSongWindow(e, songObject.songNum);
				}}
			>
				Edit Song Info
			</span>;
	}

	ReactDOM.render(
		<div className="addSongToPlaylistPrompt">
			<div 
				className="playlistDropDown" 
				style={stylePos}
			>
				{removeSongOption}
				<span 
					className="playlistSongOption" 
					onClick={() => {
						removeAddSongPrompt();
						DeleteSongScreenPrompt(songFileName);
					}}
				> 
					Delete song 
				</span>
				<span 
					className="playlistSongOption" 
					onClick={e => createPlaylistNamesDropDown(e, songFileName)}
				> 
					Add song to playlist
				</span>
				{editSongOption}
			</div>
		</div>,
		songOptionsPromptContainer
	);
}


async function createPlaylistNamesDropDown(e, songFileName){
	const playlistNames = await resolveCustomPlaylistNames();
	const currentPlaylistIndex = playlistNames.indexOf(playlistName);
	if(currentPlaylistIndex !== -1){
		playlistNames.splice(currentPlaylistIndex, 1); //remove current playlist from playlists to choose from
	}

	const optionsDropDown = e.target.parentElement;
	const parentPos = optionsDropDown.getBoundingClientRect();
	const stylePos = {
		left: parentPos.left + 'px',
		top: parentPos.top + 'px'
	};

	ReactDOM.render(
		<div className="addSongToPlaylistPrompt">
			<div 
				className="playlistDropDown" 
				style={stylePos}
			>
				{playlistNames.map(name => {
					return (
						<span 
							className="playlistSongOption"
							key={name}
							onClick={() => addSongToPlaylistInDB(songFileName, name)}
						> 
							{name} 
						</span>
					)
				})}
			</div>
		</div>,
		songOptionsPromptContainer
	);
}


function addSongObject(songCount){
	const songObjectsList = getSongObjectsList();

	//way to reference the object itself in other functions. Probably a cleaner solution to this
	this.getSongObject = this; 
	this.songFileName = songObjectsList[songCount]['fileName'];
	this.songNum = songCount;
	this.songPlaylistIndex = songObjectsList[songCount]['index'];
	this.isPlaying = false;
}


function songImgEventListener(e){
	const songObjectsList = getSongObjectsList();

	const songImg = e.target;
	const songObject = Object.values(songImg)[1]['getsongobject'];
	const currentSongNum = songObject.songNum;

	const clickedOnAnotherSong = (lastSongNum !== currentSongNum);
	if(clickedOnAnotherSong){
		const songIsSelected = (lastSongNum !== null);
		if(songIsSelected){ //revert previous song/row
			setSongImage(lastSongNum);
			songObject.isPlaying = false;
			table.rows[lastSongNum].style = "";
		}
		mainAudio.src = `${staticFolderURL}/media/songs/${songObject.songFileName}`;

		const playingTitleDiv = document.getElementById('playingTitleID');
		const songNameWithoutExtension = removeFileExtension(songObject.songFileName);
		playingTitleDiv.innerText = `Playing: ${songNameWithoutExtension}`;

		const playingTimeLengthDiv = document.getElementById('playingTimeLength');
		playingTimeLengthDiv.innerText = songObjectsList[songObject.songNum]['duration'];

		table.rows[currentSongNum].style = "background-color: #161616;";
		
		playlistScrollIfNeeded(currentSongNum);
	}

	if(songObject.isPlaying) return pauseSong(songObject);

	updateSongNum(currentSongNum);
	playSong(songObject);
}


function pauseSong(songObject){
	const playPromise = mainAudio.play();

	if(playPromise !== undefined){
		playPromise.then(() => {
			mainAudio.pause();
			songObject.isPlaying = false;
			setSongImage(songObject.songNum);
			document.getElementById('footerPlayImg').src = determineFooterPlayImgSrc(songObject.isPlaying);
		})
		.catch(error => {
			console.error(`Error from pausing is: ${error}`);
		});
	}
}


function playSong(){
	mainAudio.play();
	const songObject = getSongObjectBySongRow(lastSongNum);
	songObject.isPlaying = true;
	const imgForRow = getImgByRow(lastSongNum);
	imgForRow.src = globalPlayingGifSrc;
	document.getElementById('footerPlayImg').src = determineFooterPlayImgSrc(songObject.isPlaying);
}


function playlistScrollIfNeeded(currentSongNum){
	const playlistContainer = document.getElementById('playlistContentContainer');
	const playlistContainerCoords = playlistContainer.getBoundingClientRect();
	const currentRowCoords = table.rows[currentSongNum].getBoundingClientRect();

	if(currentRowCoords.bottom > playlistContainerCoords.bottom){
		table.rows[currentSongNum].scrollIntoView(false);
		return;
	}

	if(currentRowCoords.top < playlistContainerCoords.top){
		table.rows[currentSongNum].scrollIntoView();
	}
}


function renderEditSongWindow(e, songIndex){
	const songObjectsList = getSongObjectsList();
	const currSongObj = songObjectsList[songIndex];

	renderScreenPrompt(
		<>
			<span style={{width: "100%"}}> Edit Song Info </span>
			<input 
				type="file" 
				accept="image/*" 
				id="img-upload" 
				style={{display: "none"}}
				onChange={() => {
					const promptElem = document.getElementById("base-screen-prompt");
					const newImgFile = promptElem.querySelector("#img-upload").files[0];
					const previewImg = promptElem.querySelector("#edit-prompt-img");
					const fr = new FileReader();
					fr.onload = () => previewImg.src = fr.result;
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
			<div>
				<span> Title: </span>
				<InputBoxWithDefaultVal defaultVal={currSongObj["title"]}/>
			</div>
			<div>
				<span> Artist: </span>
				<InputBoxWithDefaultVal defaultVal={currSongObj["artist"]}/>
			</div>
			<div>
				<span> Album: </span>
				<InputBoxWithDefaultVal defaultVal={currSongObj["album"]}/>
			</div>
			<div>
				<span> Date: </span>
				<input className="generic-textbox" type="date"></input>
			</div>
			
			<div>
				<button 
					className="screenPromptPositiveButton"
					onClick={() => {
						handleSongEdit(currSongObj["fileName"], songIndex);
						removeScreenPrompt();
					}}
				>
					Confirm
				</button>
				<ScreenPromptCancelButton/>
			</div>
		</>
	);

	const editPreviewImg = document.getElementById("edit-prompt-img");
	setSongImageByElem(editPreviewImg, songIndex);
}


async function handleSongEdit(songFileName, songIndex){
	/* gather data from all prompts, send it to backend to push to server. update local page*/
	const promptElem = document.getElementById("base-screen-prompt");
	const textBoxElems = promptElem.querySelectorAll(".generic-textbox");
	const newInfo = {
		newTitle: textBoxElems[0].value,
		newArtist: textBoxElems[1].value,
		newAlbum: textBoxElems[2].value,
		newDate: textBoxElems[3].value,
		newSongImg: null
	};

	const files = promptElem.querySelector("#img-upload").files;
	// if no image is chosen, imgFile will be of length 0.
	if(files.length === 1){
		newInfo["newSongImg"] = files[0];
	}

	await updateSongInfoInDB(newInfo, songFileName);
	const newSongObj = await getSongInfoFromDB(songFileName);

	replaceObjInSongObjList(newSongObj, songIndex);

	const currSongObj = getSongObjectBySongRow(songIndex);
	if(!currSongObj.isPlaying){
		setSongImage(songIndex);
	}
	const currRow = table.rows[songIndex].firstElementChild;
	updateSongTitle(currRow, newSongObj["title"]);
	updateSongArtist(currRow, newSongObj["artist"]);
	updateSongAlbum(currRow, newSongObj["album"]);
	updateSongDate(currRow, newSongObj["date"]);
	fillPlaylistPreviewImages();
}


function updateSongTitle(currRow, newTitle){
	const songTitle = currRow.querySelectorAll("*")[1];
	songTitle.innerText = newTitle;
}

function updateSongArtist(currRow, newArtist){
	const songArtist = currRow.querySelectorAll("*")[4];
	songArtist.innerText = newArtist;
}

function updateSongAlbum(currRow, newAlbum){
	const songAlbum = currRow.querySelectorAll("*")[5];
	songAlbum.innerText = newAlbum;
}

function updateSongDate(currRow, newDate){
	const songDate = currRow.querySelectorAll("*")[7];
	songDate.innerText = newDate;
}



function InputBoxWithDefaultVal({defaultVal}){
	return(
		<input
			className="generic-textbox"
			type="text" 
			defaultValue={defaultVal}>
		</input>
	);
}