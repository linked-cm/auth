import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';
export const RequireAuth = ({ children, signinRoute, renderLoading, }) => {
    const auth = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
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
//# sourceMappingURL=RequireAuth.js.map