import * as React from 'react';
import * as contactServer from './contactServerGlobals';
import { getInputElemByID, } from './globals'; 
import { renderScreenPrompt, removeScreenPrompt, } from './renderScreenPrompt';
import { ScreenPromptCancelButton, } from './ScreenPromptCancelButton';


/** This function should only ever be run once per page load.
 * @param renderGrid - Renders the home page grid. Only provide a function here
 * if this is being called from the home page script. Otherwise provide null. */
export function addNewScreenPromptEventlistener(renderGrid: Function | null){
    document.getElementById('newPlaylistButton')
    .addEventListener('click', _ => renderNewPlaylistScreenPrompt(renderGrid));
}


/** Screen prompt which makes the interface for creating a new playlist. */
function renderNewPlaylistScreenPrompt(renderGrid: Function | null) {
    renderScreenPrompt(
        <>
            <div className="screenPromptText"> Create New Playlist </div>
            <input id="createPlaylistTextbox" className="small-generic-textbox" type="text" />
            <button
                className="screenPromptPositiveButton"
                onClick={async () => {
                    // RENAME THIS ELEMENT TO "newPlaylistNameInputField"
                    const textBox = getInputElemByID("createPlaylistTextbox");
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