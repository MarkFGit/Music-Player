const React = require('react');
const ReactDOM = require('react-dom');

import {resolvePlaylistNames, getPlaylistNamesFromDB,
		deleteOrAddNewPlaylistToServer} from './contactServer.js';
import {removeScreenPrompt, DropPlaylistScreenPrompt} from './globalEventListener.js';

const iconsFolderPath = "http://127.0.0.1:5000/static/media/icons/";

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


function CreatePlaylistCard({name}){
	const playlistURL = `/playlists/${name}`;
	return(
		<div className="playlistCard">
			<div className="divSpacers" style={{justifyContent: "flex-end"}}>
				<a href={playlistURL} className="divSpacers" style={{width: "100%"}}> </a>
				<img 
					className="playlistCardOptionsButton" 
					style={{cursor: "pointer"}} 
					src={`${iconsFolderPath}options.png`}
					onClick={() => DropPlaylistScreenPrompt(name)}
					onMouseEnter={e => e.target.src = `${iconsFolderPath}optionsHover.png`}
					onMouseLeave={e => e.target.src = `${iconsFolderPath}options.png`}
				/>
			</div>
			<a href={playlistURL} className="divSpacers link-text" style={{height: "100%"}}>
				<span className="playlistPreviewTitle link-text"> {name} </span>
			</a>
		</div>
	);
}