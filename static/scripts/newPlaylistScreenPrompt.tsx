import * as React from 'react';
import * as contactServer from './contactServerGlobals';
import { getInputElemByID, } from './globals'; 
import { renderScreenPrompt, removeScreenPrompt, } from './renderScreenPrompt';
import { ScreenPromptCancelButton, } from './ScreenPromptCancelButton';


/** This function should only ever be run once per page load.
 * @param renderGrid - Renders the home page grid. Only provide a function here
 * if this is being called from the home page script. Otherwise provide null. */
export function addNewPlaylistScreenPromptEventlistener(renderGrid: Function | null){
    document.getElementById("new-playlist-button")
    .addEventListener("click", _ => renderNewPlaylistScreenPrompt(renderGrid));
}


/** Screen prompt which makes the interface for creating a new playlist. */
function renderNewPlaylistScreenPrompt(renderGrid: Function | null) {
    renderScreenPrompt(
        <>
            <div className="screen-prompt-text"> Create New Playlist </div>
            <input id="new-playlist-name-input-field" className="small-generic-textbox" type="text"/>
            <button
                className="screen-prompt-positive-button"
                onClick={async () => {
                    const textBox = getInputElemByID("new-playlist-name-input-field");
                    await contactServer.addNewPlaylist(textBox.value);
                    removeScreenPrompt();

                    if(renderGrid !== null){
                        renderGrid();
                    }
                }}
            >
                Add Playlist
            </button>
            <ScreenPromptCancelButton/>
        </>
    );
}