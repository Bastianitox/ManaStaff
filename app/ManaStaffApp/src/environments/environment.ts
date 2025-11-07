// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyDrogTFQNg_BNb1qmkIhJ6cpppzPw-DLOo",
    authDomain: "manastaff-7ef1d.firebaseapp.com",
    databaseURL: "https://manastaff-7ef1d-default-rtdb.firebaseio.com",
    projectId: "manastaff-7ef1d",
    storageBucket: "manastaff-7ef1d.firebasestorage.app",
    messagingSenderId: "409038016605",
    appId: "1:409038016605:web:0ff9ded9533dcc28c1fdb4",
  },
  apiBaseUrl: 'http://127.0.0.1:8000/api/',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
