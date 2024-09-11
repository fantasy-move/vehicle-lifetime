var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var App = function () {
    return (_jsxs("div", __assign({ className: "flex flex-col items-center justify-center min-h-screen bg-gray-100" }, { children: [_jsx("h1", __assign({ className: "text-4xl font-bold text-blue-600" }, { children: "Vehicle Life Journey" })), _jsx("p", __assign({ className: "mt-4 text-xl text-gray-600" }, { children: "Welcome to your vehicle's life journey!" }))] })));
};
export default App;
