import * as React from 'react';
import * as ReactDOM from 'react-dom'; 
import { addEscapeFeature, } from './globals';

const _container = document.getElementById("screen-prompt-container");

export function renderScreenPrompt(customPrompt: JSX.Element): void {
    ReactDOM.render(
        <div className="screen-prompt-blur">
            <div className="base-screen-prompt" id="base-screen-prompt">
                {customPrompt}
            </div>
        </div>,
        _container
    );

    addEscapeFeature(removeScreenPrompt);
}


export function removeScreenPrompt(){
    ReactDOM.unmountComponentAtNode(_container);
}