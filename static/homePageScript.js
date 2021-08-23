var React = require('react');
var ReactDOM = require('react-dom');

import './globalEventListener.js';
import {resolvePlaylistNames, getPlaylistNamesFromDB} from './contactServer.js';

createPlaylistGrid();

export async function createPlaylistGrid(){
	const names = await resolvePlaylistNames();
	const namesLen = names.length;

	ReactDOM.render(
		<>
			{names.map(name => {
				return <CreatePlaylistCard key={name} name={name}/>
			})}
		</>, 
		document.getElementById('playlistGrid')
	)
}


function CreatePlaylistCard(nameObject){
	return(
		<a href='/lastAdded' className="playlistCard">
			<span className="playlistPreviewTitle"> {nameObject.name} </span>
		</a>
	);
}

console.log("homePageLoaded");
export function requireTest(){
	console.log("Test Imported");
}