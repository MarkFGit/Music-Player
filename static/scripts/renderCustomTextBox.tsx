import * as React from 'react';
import * as ReactDOM from 'react-dom';


export function renderCustomTextBox(customText: string) {
    const container = document.getElementById("successBoxContainer");

    ReactDOM.render(
        <div className="successBox">
            <span className="addToPlaylistSuccessMessage"> {customText} </span>
        </div>,
        container
    );

    const sevenSeconds = 7000;

    setTimeout(() => {
        ReactDOM.unmountComponentAtNode(container);
    },
        sevenSeconds
    );
}
