"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitAccountWillBeRemovedEvent = exports.onAccountWillBeRemoved = exports.onNewUser = exports.emitNewUserEvent = void 0;
const events_1 = require("events");
const authEvents = new events_1.EventEmitter();
const NEW_USER_EVENT = '@_linked/auth/new-user';
const ACCOUNT_REMOVED_EVENT = '@_linked/auth/account-removed';
function emitNewUserEvent(person, account) {
    return new Promise((resolve) => {
        authEvents.emit(NEW_USER_EVENT, person, account);
        resolve();
    });
}
exports.emitNewUserEvent = emitNewUserEvent;
function onNewUser(callback) {
    authEvents.on(NEW_USER_EVENT, callback);
}
exports.onNewUser = onNewUser;
function onAccountWillBeRemoved(callback) {
    authEvents.on(ACCOUNT_REMOVED_EVENT, callback);
}
exports.onAccountWillBeRemoved = onAccountWillBeRemoved;
function emitAccountWillBeRemovedEvent(account) {
    return new Promise((resolve) => {
        authEvents.emit(ACCOUNT_REMOVED_EVENT, account);
        resolve();
    });
}
exports.emitAccountWillBeRemovedEvent = emitAccountWillBeRemovedEvent;
//# sourceMappingURL=events.js.map