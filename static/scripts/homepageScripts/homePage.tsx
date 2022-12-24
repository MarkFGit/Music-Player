import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as contactServer from './../contactServerGlobals';
import { addNewPlaylistScreenPromptEventlistener, } from './../newPlaylistScreenPrompt';
import { checkElemIsImgElem, IMG_PATHS, } from './../globals';
import { renderScreenPrompt, removeScreenPrompt, } from './../renderScreenPrompt';
import { ScreenPromptCancelButton } from './../ScreenPromptCancelButton';


addNewPlaylistScreenPromptEventlistener(renderPlaylistGrid);

renderPlaylistGrid();

export async function renderPlaylistGrid(){
	const names = await contactServer.resolve_playlist_names();

	const container = document.getElementById("playlist-grid");

	ReactDOM.render(
		<>
			<PlaylistCard key={"Last Added"} name={"Last Added"}/>
			{names.map((name: string) => {
				if(name !== "Last Added"){
					return <PlaylistCard key={name} name={name}/>
				}
			})}
		</>,
		container
	)
}


function PlaylistCard({name}: {name: string}): JSX.Element {
	return(
		<div className="playlist-card">
			<div className="space-between">
				<a 
					className="full-width-and-height link-color" 
					href={`/playlists/${name}`}
					onMouseEnter={e => getPlaylistCardFromEvent(e).classList.add("link-text")}
					onMouseLeave={e => getPlaylistCardFromEvent(e).classList.remove("link-text")}
				>
				</a>
				<img 
					className="playlist-card-options-button" 
					src={IMG_PATHS.playlistCardOption}
					onMouseEnter={e => (e.target as HTMLImageElement).src = IMG_PATHS.playlistCardOptionHover}
					onMouseLeave={e => (e.target as HTMLImageElement).src = IMG_PATHS.playlistCardOption}
					onClick={() => dropPlaylistScreenPrompt(name)}
				/>
			</div>
			<a className="link-color link-text playlist-preview-title" href={`/playlists/${name}`}> {name} </a>
		</div>
	);
}


/** This function grabs the playlist card from an event when the mouse enters/leaves the extraneous anchor tag. */
function getPlaylistCardFromEvent(e: React.SyntheticEvent): HTMLDivElement{
	const anchor = e.target as HTMLAnchorElement;
	return anchor.parentElement.parentElement as HTMLDivElement;
}


/** Screen prompt which makes the interface for dropping a specific playlist. */
export function dropPlaylistScreenPrompt(playlistName: string): void {
    renderScreenPrompt(
        <>
            <span className="screen-prompt-text"> Are you sure you want to drop "{playlistName}"? </span>
            <button
                className="screen-prompt-positive-button"
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