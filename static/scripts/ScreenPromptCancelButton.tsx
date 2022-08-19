import * as React from 'react';
import { removeScreenPrompt, } from './renderScreenPrompt';


export function ScreenPromptCancelButton() {
    return (
        <button
            className="screenPromptCancelButton"
            onClick={removeScreenPrompt}
        >
            Cancel
        </button>
    );
}
