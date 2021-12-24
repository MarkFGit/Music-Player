const React = require('react');
const ReactDOM = require('react-dom');
import {deleteOrAddNewPlaylistToServer, resolvePlaylistNames} from './contactServer.js';


function addEscapeFeature(){
	document.addEventListener('keydown', function escPlaylistmenu(e){
		if(e.key === 'Escape'){
			removeAddPlaylistMenu(); 
			document.removeEventListener('keydown', escPlaylistmenu);
		}
	});
}

document.getElementById('newPlaylistButton').addEventListener('click', () => {
	document.getElementById('addPlaylistBoxContainer').style.height = '100vh';
	document.getElementById('addPlaylistBoxContainer').style.position = 'fixed';

	ReactDOM.render(
		<div className="playlistBox" id="playlistBox"> 
			<div style={{ width: "100%", fontSize: "large" }}> Create New Playlist </div>
			<input id="createPlaylistTextbox" type="text" />
			<button 
				className="positiveButtonClass" 
				onClick={ () => {
					const textBox = document.getElementById("createPlaylistTextbox");
					deleteOrAddNewPlaylistToServer(textBox.value, "add");
					removeAddPlaylistMenu();
				} }> 
				Add Playlist 
			</button>
			<button 
				className="cancelButtonClass" 
				onClick={ () => {removeAddPlaylistMenu()} }> 
				Cancel 
			</button>
		</div>,
		document.getElementById('addPlaylistBoxContainer')
	);

	addEscapeFeature();
});



export function removeAddPlaylistMenu(){
	ReactDOM.unmountComponentAtNode(addPlaylistBoxContainer);
	document.getElementById('addPlaylistBoxContainer').style.height = '0';
}


export function renderSuccessBox(){
 	ReactDOM.render(
 		<div className="successBox">
 			<span className="addToPlaylistSuccessMessage"> Added to Playlist </span>
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