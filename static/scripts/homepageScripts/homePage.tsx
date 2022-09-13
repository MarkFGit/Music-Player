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
		<div 
			className="playlist-card link-color link-text"
			id={name}
			onClick={e => handlePlaylistCardClick(e, name)}>
			<img 
				className="playlist-card-options-button" 
				src={IMG_PATHS.playlistCardOption}
				onMouseEnter={e => optionsImgEnter(e, name)}
				onMouseLeave={e => optionsImgLeave(e, name)}
			/>
			<span className="playlist-preview-title"> {name} </span>
		</div>
	);
}

/** This function handles what happens when the mouse enters the options image for a playlist card. */
function optionsImgEnter(e: React.SyntheticEvent, name: string){
	const img = checkElemIsImgElem(e.target);
	img.src = IMG_PATHS.playlistCardOptionHover;
	const elem = document.getElementById(name);
	elem.classList.remove("link-text");
}

/** This function handles what happens when the mouse enters the options image for a playlist card. */
function optionsImgLeave(e: React.SyntheticEvent, name: string){
	const img = checkElemIsImgElem(e.target);
	img.src = IMG_PATHS.playlistCardOption;
	const elem = document.getElementById(name);
	elem.classList.add("link-text");
}


function handlePlaylistCardClick(e: React.SyntheticEvent, playlistName: string){
	const target = e.target;
	if(target instanceof HTMLSpanElement){
		window.location.href = `/playlists/${playlistName}`;
		return;
	}
	if(target instanceof HTMLImageElement){
		dropPlaylistScreenPrompt(playlistName);
		return;
	}
	throw new DOMException(
		"Tried to grab target of either type HTMLAnchorElement or type HTMLImageElement. " +
		`However the target recieved is an instanceof ${target.constructor.name}`
	);
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