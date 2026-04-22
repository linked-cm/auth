"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./types.js");
require("./ontologies/auth.js");
//SHAPES FIRST
require("./shapes/IdentityToken.js");
require("./shapes/RefreshToken.js");
require("./shapes/AuthCredential.js");
require("./shapes/Authentication.js");
require("./shapes/Password.js");
//THEN COMPONENTS
require("./components/RequireAuth.js");
require("./components/RemoveAccountButton.js");
require("./components/SigninWithPasswordForm.js");
require("./components/CreateAccountForm.js");
require("./components/ForgotPasswordForm.js");
require("./components/ForgotPasswordCallback.js");
require("./components/CreateNewPasswordForm.js");
require("./components/EditPasswordButton.js");
//# sourceMappingURL=index.js.map