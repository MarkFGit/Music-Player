const React = require('react');
const ReactDOM = require('react-dom');
import {deleteOrAddNewPlaylistToServer, resolvePlaylistNames,
		deleteSongFromDB} from './contactServer.js';
import {removeFileExtension, getSongObjectsList, getImgByRow,
		getSongObjectBySongRow} from './globals.js';


const iconFolderPath = 'http://127.0.0.1:5000/static/media/icons/';
const noCoverImgSrc = `${iconFolderPath}noCoverImg.png`;


function addEscapeFeature(){
	document.addEventListener('keydown', function escScreenPrompt(e){
		if(e.key === 'Escape'){
			removeScreenPrompt(); 
			document.removeEventListener('keydown', escScreenPrompt);
		}
	});
}


document.getElementById('newPlaylistButton').addEventListener('click', NewPlaylistScreenPrompt);

export function renderScreenPrompt(customPrompt){
	ReactDOM.render(
		<div className="screen-prompt-blur">
			<div className="base-screen-prompt" id="base-screen-prompt">
				{customPrompt}
			</div>
		</div>,
		document.getElementById('screenPromptContainer')
	);

	addEscapeFeature();
}


export function ScreenPromptCancelButton(){
	return(
		<button 
			className="screenPromptCancelButton" 
			onClick={removeScreenPrompt}
		> 
			Cancel 
		</button>
	);
}


function NewPlaylistScreenPrompt(){
	renderScreenPrompt(
		<>
			<div className="screenPromptText"> Create New Playlist </div>
			<input id="createPlaylistTextbox" type="text" />
			<button 
				className="screenPromptPositiveButton" 
				onClick={ () => {
					const textBox = document.getElementById("createPlaylistTextbox");
					deleteOrAddNewPlaylistToServer(textBox.value, "add");
					removeScreenPrompt();
				}}
			> 
				Add Playlist 
			</button>
			<ScreenPromptCancelButton/>
		</>
	);
}


export function DropPlaylistScreenPrompt(playlistName){
	renderScreenPrompt(
		<>
			<span className="screenPromptText"> Are you sure you want to drop "{playlistName}"? </span>
			<button 
				className="screenPromptPositiveButton" 
				onClick={ () => {
					deleteOrAddNewPlaylistToServer(playlistName, "delete");
					removeScreenPrompt();
				}}
			> 
				Drop Playlist 
			</button>
			<ScreenPromptCancelButton/>
		</>
	);
}


export async function DeleteSongScreenPrompt(songFileName){
	const songName = removeFileExtension(songFileName);
	const script_js = await require('./script.js');
	renderScreenPrompt(
		<>
			<span className="screenPromptText"> Are you sure you want to delete the song "{songName}" from your account? </span>
			<button 
				className="screenPromptPositiveButton" 
				onClick={ () => {
					deleteSongFromDB(songFileName, songName);
					removeScreenPrompt();
				}}
			> 
				Delete Song 
			</button>
			<ScreenPromptCancelButton/>
		</>
	);
}


export function removeScreenPrompt(){
	ReactDOM.unmountComponentAtNode(screenPromptContainer);
	document.getElementById('screenPromptContainer').style.height = '0';
}


export function renderCustomTextBox(customText){
 	ReactDOM.render(
 		<div className="successBox">
 			<span className="addToPlaylistSuccessMessage"> {customText} </span>
 		</div>,
 		document.getElementById("successBoxContainer")
 	);

 	const sevenSeconds = 7000;

 	setTimeout(() => {
 		ReactDOM.unmountComponentAtNode(successBoxContainer);
 	},
 		sevenSeconds
 	);
}