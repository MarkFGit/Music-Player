import * as React from 'react';
import * as ReactDOM from 'react-dom';


export function renderCustomTextBox(customText: string) {
    const container = document.getElementById("notification-box-container");

    ReactDOM.render(
        <div className="notification-box">
            <span className="notification-text"> {customText} </span>
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
