import { EventEmitter } from 'events';
const authEvents = new EventEmitter();
const NEW_USER_EVENT = '@_linked/auth/new-user';
const ACCOUNT_REMOVED_EVENT = '@_linked/auth/account-removed';
export function emitNewUserEvent(person, account) {
    return new Promise((resolve) => {
        authEvents.emit(NEW_USER_EVENT, person, account);
        resolve();
    });
}
export function onNewUser(callback) {
    authEvents.on(NEW_USER_EVENT, callback);
}
export function onAccountWillBeRemoved(callback) {
    authEvents.on(ACCOUNT_REMOVED_EVENT, callback);
}
export function emitAccountWillBeRemovedEvent(account) {
    return new Promise((resolve) => {
        authEvents.emit(ACCOUNT_REMOVED_EVENT, account);
        resolve();
    });
}
//# sourceMappingURL=events.js.map