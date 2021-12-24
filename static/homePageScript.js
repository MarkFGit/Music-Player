const React = require('react');
const ReactDOM = require('react-dom');

import {resolvePlaylistNames, getPlaylistNamesFromDB,
		deleteOrAddNewPlaylistToServer} from './contactServer.js';
import {removeAddPlaylistMenu} from './globalEventListener.js';

const URLforStaticFolder = 'http://127.0.0.1:5000/static';

createPlaylistGrid();

export async function createPlaylistGrid(){
	const names = ["Last Added"];
	names.push(...await resolvePlaylistNames());

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
	const playlistURL = `/playlists/${nameObject.name}`;
	return(
		<div className="playlistCard">
			<div className="divSpacers" style={{justifyContent: "flex-end"}}>
				<a href={playlistURL} className="divSpacers" style={{width: "100%"}}> </a>
				<img 
					className="playlistCardOptionsButton" 
					style={{cursor: "pointer"}} 
					src={`${URLforStaticFolder}/media/icons/options.png`}
					onClick={() => renderRemovePlaylistBox(nameObject.name)}
				/>
			</div>
			<a href={playlistURL} className="divSpacers" style={{display: "grid", height: "inherit", textDecoration: "none"}}>
				<div className="divSpacers" style={{justifyContent: "center"}}>
					<span className="playlistPreviewTitle"> {nameObject.name} </span>
				</div>
			</a>
		</div>
	);
}

function renderRemovePlaylistBox(playlistName){
	document.getElementById('addPlaylistBoxContainer').style.height = '100vh';
	document.getElementById('addPlaylistBoxContainer').style.position = 'fixed';

	ReactDOM.render(
		<div className="playlistBox" id="playlistBox"> 
			<div style={{ width: "100%", fontSize: "large" }}> Are you sure you want to drop "{playlistName}"? </div>
			<button 
				className="positiveButtonClass" 
				onClick={ () => {
					deleteOrAddNewPlaylistToServer(playlistName, "delete");
					removeAddPlaylistMenu();
				} }> 
				Drop Playlist 
			</button>
			<button 
				className="cancelButtonClass" 
				onClick={ () => {removeAddPlaylistMenu()} }> 
				Cancel 
			</button>
		</div>,
		document.getElementById('addPlaylistBoxContainer')
	);
}