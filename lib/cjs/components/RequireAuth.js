"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireAuth = void 0;
const react_1 = require("react");
const useAuth_js_1 = require("../hooks/useAuth.js");
const react_router_dom_1 = require("react-router-dom");
const RequireAuth = ({ children, signinRoute, renderLoading, }) => {
    const auth = (0, useAuth_js_1.useAuth)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    (0, react_1.useEffect)(() => {
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