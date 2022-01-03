const React = require('react');
const ReactDOM = require('react-dom');

import {resolvePlaylistNames, getPlaylistNamesFromDB,
		deleteOrAddNewPlaylistToServer} from './contactServer.js';
import {removeScreenPrompt, DropPlaylistScreenPrompt} from './globalEventListener.js';

const URLforStaticFolder = 'http://127.0.0.1:5000/static';

createPlaylistGrid();

export async function createPlaylistGrid(){
	const names = ["Last Added"];
	names.push(...await resolvePlaylistNames());

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
					onClick={() => DropPlaylistScreenPrompt(nameObject.name)}
				/>
			</div>
			<a href={playlistURL} className="divSpacers playlistCardLink">
				<div className="divSpacers" style={{justifyContent: "center"}}>
					<span className="playlistPreviewTitle"> {nameObject.name} </span>
				</div>
			</a>
		</div>
	);
}