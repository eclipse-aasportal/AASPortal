/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

const guestToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiZ3Vlc3QiLCJpYXQiOjE2OTA4ODgwMjd9.mUnIUXDwWOlE89QmgXjAVryZY_qWPL-ai-i76ClLTH8';
const johnToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqb2huLmRvZUBlbWFpbC5jb20iLCJyb2xlIjoiZWRpdG9yIiwibmFtZSI6IkpvaG4ifQ.L-RbuQQdjgFOhiFqGVxXBBjnyUaAXvMeu9PM-fMshN0';
const johnDoeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqb2huLmRvZUBlbWFpbC5jb20iLCJyb2xlIjoiZWRpdG9yIiwibmFtZSI6IkpvaG4gRG9lIn0.JNBzGftOKu4HY9VzSS5ArWwBrgOc1rHi1ooFcMwcXvw';

export function getToken(name: string): string {
    switch (name) {
        case 'John':
            return johnToken;
        case 'John Doe':
            return johnDoeToken;
        default:
            throw new Error('Not implemented.');
    }
}

export function getGuestToken(): string {
    return guestToken;
}