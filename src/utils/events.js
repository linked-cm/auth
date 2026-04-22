"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitNewUserEvent = emitNewUserEvent;
exports.onNewUser = onNewUser;
exports.onAccountWillBeRemoved = onAccountWillBeRemoved;
exports.emitAccountWillBeRemovedEvent = emitAccountWillBeRemovedEvent;
var events_1 = require("events");
var authEvents = new events_1.EventEmitter();
var NEW_USER_EVENT = '@_linked/auth/new-user';
var ACCOUNT_REMOVED_EVENT = '@_linked/auth/account-removed';
function emitNewUserEvent(person, account) {
    return new Promise(function (resolve) {
        authEvents.emit(NEW_USER_EVENT, person, account);
        resolve();
    });
}
function onNewUser(callback) {
    authEvents.on(NEW_USER_EVENT, callback);
}
function onAccountWillBeRemoved(callback) {
    authEvents.on(ACCOUNT_REMOVED_EVENT, callback);
}
function emitAccountWillBeRemovedEvent(account) {
    return new Promise(function (resolve) {
        authEvents.emit(ACCOUNT_REMOVED_EVENT, account);
        resolve();
    });
}
//# sourceMappingURL=events.js.map