import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

import { TResponseWrapper } from '../utilsLibrary/responseWrapper';

export function getFirestoreClient(): TResponseWrapper {
    if (!process.env.FIREBASE_CONFIG || process.env.FIREBASE_CONFIG == "") {
        return {
            Ok: false, 
            Status: 500,
            StatusText: 'Internal Server',
            Message: 'FIREBASE_CONFIG env not set.',
            RawMessage: 'In getFirestoreClient.',  
        }
    }

    try {
        let cfg = JSON.parse(process.env.FIREBASE_CONFIG)      
        const app = initializeApp(cfg);
        const firestore = getFirestore(app);

        return {
            Ok: true,
            Status: 200, 
            StatusText: 'Ok',
            Message: firestore, 
            RawMessage: firestore,
        }
    } catch (error: any) {
        return {
            Ok: false,
            Status: 500, 
            StatusText: 'Internal Server',
            Message: error.message || error.Message || `Error initializing firestore client`,
            RawMessage: error.cause || 'In getFirestoreClient'
        }
    }
}