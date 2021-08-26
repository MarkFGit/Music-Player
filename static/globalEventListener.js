const React = require('react');
const ReactDOM = require('react-dom');

document.getElementById('newPlaylistButton').addEventListener('click', () => {
	document.getElementById('addPlaylistBoxContainer').style.height = '100vh';
	document.getElementById('addPlaylistBoxContainer').style.position = 'fixed';

	ReactDOM.render(
		<div className="playlistBox" id="playlistBox"> 
			<div style={{ width: "100%", fontSize: "large" }}> Create New Playlist </div>
			<input id="createPlaylistTextbox" type="text" />
			<button 
				className="positiveButtonClass" 
				onClick={ () => {createNewPlaylistInDatabase()} }> 
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

	document.addEventListener('keydown', function escPlaylistmenu(e){
		if(e.key === 'Escape'){
			removeAddPlaylistMenu(); 
			document.removeEventListener('keydown', escPlaylistmenu);
		}
	});
});

import {createNewPlaylistToServer} from './contactServer.js';

function createNewPlaylistInDatabase(){
	const textBox = document.getElementById("createPlaylistTextbox");
	if(textBox.value.length > 100) return console.error("Playlist names cannot exceed 100 characters.") 
	createNewPlaylistToServer(textBox.value);
	removeAddPlaylistMenu();
}


function removeAddPlaylistMenu(){
	ReactDOM.unmountComponentAtNode(addPlaylistBoxContainer);
	document.getElementById('addPlaylistBoxContainer').style.height = '0';
}
