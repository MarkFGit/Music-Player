const React = require('react');
const ReactDOM = require('react-dom');

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

export function requireTest(){
	console.log("Test Imported");
}