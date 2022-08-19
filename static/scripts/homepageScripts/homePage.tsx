import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as contactServer from './../contactServerGlobals';
import { addNewScreenPromptEventlistener, } from './../newPlaylistScreenPrompt';
import { checkElemIsImgElem, IMG_PATHS, } from './../globals';
import { renderScreenPrompt, removeScreenPrompt, } from './../renderScreenPrompt';
import { ScreenPromptCancelButton } from './../ScreenPromptCancelButton';


addNewScreenPromptEventlistener(renderPlaylistGrid);

renderPlaylistGrid();

export async function renderPlaylistGrid(){
	const names = await contactServer.resolve_playlist_names();

	const container = document.getElementById('playlistGrid');

	ReactDOM.render(
		<>
			{<PlaylistCard key={"Last Added"} name={"Last Added"}/>}
			{names.map((name: string) => {
				if(name !== "Last Added"){
					return <PlaylistCard key={name} name={name}/>
				}
			})}
		</>,
		container
	)
}


function PlaylistCard({name}): JSX.Element {
	const playlistURL = `/playlists/${name}`;
	return(
		<div className="playlistCard">
			<div className="divSpacers" style={{justifyContent: "flex-end"}}>
				<a href={playlistURL} className="divSpacers" style={{width: "100%"}}> </a>
				<img 
					className="playlistCardOptionsButton" 
					style={{cursor: "pointer"}} 
					src={IMG_PATHS.playlistCardOption}
					onClick={() => dropPlaylistScreenPrompt(name)}
					
					onMouseEnter={e => {
						const img = checkElemIsImgElem(e.target);
						img.src = IMG_PATHS.playlistCardOptionHover;
					}}
					onMouseLeave={e => {
						const img = checkElemIsImgElem(e.target);
						img.src = IMG_PATHS.playlistCardOption;
					}}
				/>
			</div>
			<a href={playlistURL} className="divSpacers link-text" style={{height: "100%"}}>
				<span className="playlistPreviewTitle link-text"> {name} </span>
			</a>
		</div>
	);
}


/** Screen prompt which makes the interface for dropping a specific playlist. */
export function dropPlaylistScreenPrompt(playlistName: string): void {
    renderScreenPrompt(
        <>
            <span className="screenPromptText"> Are you sure you want to drop "{playlistName}"? </span>
            <button
                className="screenPromptPositiveButton"
                onClick={async () => {
                    removeScreenPrompt();
                    await contactServer.deletePlaylist(playlistName);
                    renderPlaylistGrid();
                }}
            >
                Drop Playlist
            </button>
            <ScreenPromptCancelButton/>
        </>
    );
}