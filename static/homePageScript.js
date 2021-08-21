var React = require('react');
var ReactDOM = require('react-dom');

import './globalEventListener.js';

function getSqlPlaylists(){
	// retrieve playlist names
	// set testNamesList to retrievedPlaylistNames
	return;
}

createPlaylistGrid();


function createPlaylistGrid(){
	const testNamesList = ["lastAdded","otherPlaylist","doesThisWork"];

	ReactDOM.render(
		<>
			{
				testNamesList.map(name => {
					return <CreatePlaylistCard key={name} name={name}/>
				})
			}
		</>, 
		document.getElementById('playlistGridContainer')
	)
}


function CreatePlaylistCard(nameObject){
	return(
		<>
			<div className="playlistBasicInfoContainer">
				<span className="playlistPreviewTitle"> {nameObject.name} </span>
			</div>
		</>
	);
}