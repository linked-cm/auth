export declare function emitNewUserEvent(person: any, account: any): Promise<void>;
export declare function onNewUser<PersonType, AccountType>(callback: (person: PersonType, account: AccountType) => void): void;
export declare function onAccountWillBeRemoved<AccountType>(callback: (account: AccountType) => void): void;
export declare function emitAccountWillBeRemovedEvent(account: any): Promise<void>;
