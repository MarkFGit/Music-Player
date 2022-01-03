const React = require('react');
const ReactDOM = require('react-dom');
import {deleteOrAddNewPlaylistToServer, resolvePlaylistNames,
		deleteSongFromDB} from './contactServer.js';
import {removeFileExtension} from './globals.js';


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
	document.getElementById('screenPromptContainer').style.height = '100vh';
	document.getElementById('screenPromptContainer').style.position = 'fixed';
	
	ReactDOM.render(
		<div className="playlistBox" id="playlistBox"> 
			{customPrompt}
			<button 
				className="screenPromptCancelButton" 
				onClick={removeScreenPrompt}
			> 
				Cancel 
			</button>
		</div>,
		document.getElementById('screenPromptContainer')
	);

	addEscapeFeature();
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
		</>
	);
}


export function DeleteSongScreenPrompt(songFileName){
	const songName = removeFileExtension(songFileName);
	renderScreenPrompt(
		<>
			<span className="screenPromptText"> Are you sure you want to delete the song "{songName}" from your account? </span>
			<button 
				className="screenPromptPositiveButton" 
				onClick={ () => {
					deleteSongFromDB(songFileName, songName);
				}}
			> 
				Delete Song 
			</button>
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