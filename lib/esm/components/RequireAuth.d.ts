import { ReactElement } from 'react';
interface RequireAuthProps {
    children: ReactElement;
    signinRoute?: string;
    renderLoading?: () => ReactElement;
}
export declare const RequireAuth: ({ children, signinRoute, renderLoading, }: RequireAuthProps) => ReactElement<any, string | import("react").JSXElementConstructor<any>> | "...";
export {};
