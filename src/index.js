import { jsx as _jsx } from "react/jsx-runtime";
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
var container = document.getElementById('root');
if (container) {
    var root = createRoot(container);
    root.render(_jsx(App, {}));
}
else {
    console.error('Root element not found');
}
