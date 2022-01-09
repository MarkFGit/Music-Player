const iconFolderPath = 'http://127.0.0.1:5000/static/media/icons/';
const URLforStaticFolder = 'http://127.0.0.1:5000/static';

const globalPauseImgSrc = `${iconFolderPath}pause.png`;
const globalPauseHoverImgSrc = `${iconFolderPath}hoverPause.png`;
const globalPlayImgSrc = `${iconFolderPath}playSong.png`;
const globalPlayHoverImgSrc = `${iconFolderPath}hoverPlay.png`;
const blankPlayImgSrc = `${iconFolderPath}play.png`;
const globalPlayingGifSrc = `${iconFolderPath}playing.gif`;


const table = document.getElementById("songTable");
const mainAudio = document.getElementById("mainAudio");


let lastSongNum = null;
let draggingSong = false;

window.dragOverHandler = dragOverHandler;
window.fileDropHandler = fileDropHandler;
window.createPage = createPage;
window.mouseDown = mouseDown;

const React = require('react');
const ReactDOM = require('react-dom');

/* import scss so webpack builds composite css file */
import './main.scss';
import './homePage.scss';
import './lowerBarStyles.scss';
import './globalComponentStyles.scss';
import './notFoundPage.scss';
/* ************************************************ */

import {DeleteSongScreenPrompt} from './globalEventListener.js';

import updateEventScriptSongNum, {prepareHeaderButtonListeners, 
	   prepareFooterButtonListeners} from './eventScript.js';

import dragOverHandler, {fileDropHandler, incrementPlayCount,
		createNewPlaylistToServer, resolvePlaylistNames, 
		addSongToPlaylistInDB, removeSongFromPlaylist} from './contactServer.js'

import getSongImage, {fillPlaylistPreviewImages, 
	determineFooterPlayImgSrc} from './findImages.js';


import {getPlaylistName, removeFileExtension, getSongObjectsList} from './globals.js';
const playlistName = getPlaylistName();
const songObjectsList = getSongObjectsList();


export function clickSongBySongNum(songNum){
	table.rows[songNum].firstElementChild.firstElementChild.click();
}


export function getSongObjectBySongRow(songRow){
	const currentRow = table.rows[songRow];
	const imgForRow = currentRow.firstElementChild.firstElementChild;
	const songObject = Object.values(imgForRow)[1]['getsongobject'];
	return songObject;
}

export function getImgBySongRow(songRow){
	return table.rows[songRow].firstElementChild.firstElementChild;
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

		const currentSongObject = getSongObjectBySongRow(lastSongNum-1);
		incrementPlayCount(currentSongObject);
		const isLastPlaylistSong = (currentSongObject.songNum === table.rows.length);
		if(isLastPlaylistSong){ 
			revertPageToNoSong(currentSongObject);
			return;
		}
		const nextSongNum = lastSongNum;
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



function revertPageToNoSong(songObject){
	songObject.isPlaying = false;

	document.getElementById('footerPlayImg').src = determineFooterPlayImgSrc(songObject.isPlaying);
	getSongImage(lastSongNum-1);
	document.getElementById('currentTimeStamp').innerText = '-:--';
	document.getElementById('playingTitleID').innerText = 'Playing:';
	document.getElementById('playingTimeLength').innerText = '-:--';
	table.rows[songObject.songNum - 1].style = "background-color: ;";
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

	const currentSongSrc = getImgBySongRow(lastSongNum-1).src;
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
				return <Row key={index+1} songCount={index+1}/>
			})}
		</>,
		document.getElementById('tableBody')
	);


	for(let songCount = 1; songCount <= numOfPlaylistSongs; songCount++){
		addSongImgEventListener(songCount);
		getSongImage(songCount-1);
	}

	fillPlaylistPreviewImages();
	prepareHeaderButtonListeners();
	prepareFooterButtonListeners();
}


function Row({songCount}){
	const songObject = new addSongObject(songCount);
	let songDiv = null;
	if(songCount < numOfPlaylistSongs){
		songDiv = <div className="songDivider"></div>;
	}

	return(
		<tr className="songRowClass">
			<td className="songContainer">
				<img className="coverImg" getsongobject={songObject}></img>
				<span className="songTitles"> {songObjectsList[songCount-1]['title']} </span>
				<button 
					className="songRowAddPlaylistButton" 
					onClick={e => createSongOptionsDropDown(e, songObject)}
				>
					+
				</button>
				<span className="songDurationClass"> {songObjectsList[songCount-1]['duration']} </span>
				<span className="songArtistOrAlbum"> {songObjectsList[songCount-1]['artist']} </span>
				<span className="songArtistOrAlbum"> {songObjectsList[songCount-1]['album']} </span>
				<span className="playsWidth"> {songObjectsList[songCount-1]['plays']} </span>
			</td>
			{songDiv}
		</tr>
	);
}



const addSongPromptElem = document.getElementById("addSongToPlaylistPrompt");
addSongPromptElem.addEventListener('click', e => {
	if(e.target.className === "addSongToPlaylistPrompt"){	
		removeAddSongPrompt();
	}
});


function removeAddSongPrompt(){
	ReactDOM.unmountComponentAtNode(addSongPromptElem);
	addSongPromptElem.style = "width: 0; height: 0";
}


function createSongOptionsDropDown(e, songObject){
	const coverImgInRow = e.target.parentElement.querySelector('.coverImg');
	addSongPromptElem.style = "width: 100vw; height: 100vh";
	const buttonPos = e.target.getBoundingClientRect();
	const stylePos = {
		left: buttonPos.x + 'px',
		top: (buttonPos.y + 20) + 'px'
	};
	const songFileName = songObject.songFileName;
	const songPlaylistIndex = songObject.songPlaylistIndex;

	let removeSongOption = null;
	if(playlistName !== "Last Added"){
		removeSongOption 
		  = <span 
				className="playlistSongOption" 
				onClick={() => removeSongFromPlaylist(songPlaylistIndex)}
			>
				Remove song from playlist 
			</span>;
	}

	ReactDOM.render(
		<div 
			className="playlistDropDown" 
			style={stylePos}
		>
			{removeSongOption}
			<span 
				className="playlistSongOption" 
				onClick={() => {
					DeleteSongScreenPrompt(songFileName);
					removeAddSongPrompt();
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
		</div>,
		addSongPromptElem
	);
}


async function createPlaylistNamesDropDown(e, songFileName){
	const playlistNames = await resolvePlaylistNames();
	const currentPlaylistIndex = playlistNames.indexOf(playlistName);
	if(currentPlaylistIndex !== -1){
		playlistNames.splice(currentPlaylistIndex, 1); //remove current playlist from playlists to choose from
	}

	addSongPromptElem.style = "width: 100vw; height: 100vh";

	const optionsDropDown = e.target.parentElement;
	const parentPos = optionsDropDown.getBoundingClientRect();
	const stylePos = {
		left: parentPos.left + 'px',
		top: parentPos.top + 'px'
	};

	ReactDOM.render(
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
		</div>,
		addSongPromptElem
	);
}


function addSongObject(songCount){
	//way to reference the object itself in other functions. Probably a cleaner solution to this
	this.getSongObject = this; 
	this.songFileName = songObjectsList[songCount-1]['fileName'];
	this.songNum = songCount;
	this.songPlaylistIndex = songObjectsList[songCount-1]['index'];
	this.isPlaying = false;
}


function addSongImgEventListener(songCount){
	const imgForRow = getImgBySongRow(songCount-1);
	const songObject = getSongObjectBySongRow(songCount-1);
	imgForRow.addEventListener('click', () => {
		const currentSongNum = songObject.songNum;
		if(lastSongNum !== currentSongNum){
			if(lastSongNum !== null){ //revert previous song/row
				getSongImage(lastSongNum-1);
				songObject.isPlaying = false;
				table.rows[lastSongNum-1].style = "";
			}
			mainAudio.src = `${URLforStaticFolder}/media/songs/${songObject.songFileName}`;

			const playingTitleDiv = document.getElementById('playingTitleID');
			const songNameWithoutExtension = removeFileExtension(songObject.songFileName);
			playingTitleDiv.innerText = `Playing: ${songNameWithoutExtension}`;

			const playingTimeLengthDiv = document.getElementById('playingTimeLength');
			playingTimeLengthDiv.innerText = songObjectsList[songObject.songNum-1]['duration'];

			table.rows[currentSongNum - 1].style = "background-color: #161616;";
			
			playlistScrollIfNeeded(currentSongNum);
		}

		if(songObject.isPlaying) return pauseSong(songObject);

		updateSongNum(currentSongNum);
		playNextSong(songObject);
	});
}


function playlistScrollIfNeeded(currentSongNum){
	const playlistContainer = document.getElementById('playlistContentContainer');
	const playlistContainerCoords = playlistContainer.getBoundingClientRect();
	const currentRowCoords = table.rows[currentSongNum - 1].getBoundingClientRect();

	if(currentRowCoords.bottom > playlistContainerCoords.bottom){
		table.rows[currentSongNum - 1].scrollIntoView(false);
		return;
	}

	if(currentRowCoords.top < playlistContainerCoords.top){
		table.rows[currentSongNum - 1].scrollIntoView();
	}
}


function pauseSong(songObject){
	const playPromise = mainAudio.play();

	if(playPromise !== undefined){
		playPromise.then(() => {
			mainAudio.pause();
			songObject.isPlaying = false;
			getSongImage(songObject.songNum-1);
			document.getElementById('footerPlayImg').src = determineFooterPlayImgSrc(songObject.isPlaying);
		})
		.catch(error => {
			console.error(`Error from pausing is: ${error}`);
		});
	}
}


function playNextSong(){
	mainAudio.play();
	const songObject = getSongObjectBySongRow(lastSongNum-1);
	songObject.isPlaying = true;
	const imgForRow = getImgBySongRow(lastSongNum-1);
	imgForRow.src = globalPlayingGifSrc;
	document.getElementById('footerPlayImg').src = determineFooterPlayImgSrc(songObject.isPlaying);
}