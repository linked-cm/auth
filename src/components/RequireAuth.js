"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireAuth = void 0;
var react_1 = require("react");
var useAuth_js_1 = require("../hooks/useAuth.js");
var react_router_dom_1 = require("react-router-dom");
var RequireAuth = function (_a) {
    var children = _a.children, signinRoute = _a.signinRoute, renderLoading = _a.renderLoading;
    var auth = (0, useAuth_js_1.useAuth)();
    var navigate = (0, react_router_dom_1.useNavigate)();
    (0, react_1.useEffect)(function () {
        if (!auth.userAccount && !auth.validating) {
            navigate(signinRoute || '/signin');
        }
    }, [auth.userAccount]);
    // If the user is not logged in and we are still validating, we can show a loading state
    if (!auth.userAccount && auth.validating) {
        return renderLoading ? renderLoading() : '...';
    }
    // If the user is logged in, we render the children components
    //Note: components wrapped in RequireAuth will never render on the first request, this is to match the server side
    //where login will always be false
    return auth.userAccount ? children : null;
};
exports.RequireAuth = RequireAuth;
//# sourceMappingURL=RequireAuth.js.map