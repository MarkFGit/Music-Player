import * as React from 'react';
import { removeScreenPrompt, } from './renderScreenPrompt';


export function ScreenPromptCancelButton() {
    return (
        <button
            className="screen-prompt-cancel-button"
            onClick={removeScreenPrompt}
        >
            Cancel
        </button>
    );
}
