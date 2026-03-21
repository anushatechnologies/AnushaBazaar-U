import firebase from "firebase/compat/app";
import "firebase/compat/auth";

const firebaseConfig = {
  apiKey: "AIzaSyChxzqLaLTuN5cV1LV92yF6tRPh8ZV7FeI",
  authDomain: "anushabazaar-2288e.firebaseapp.com",
  projectId: "anushabazaar-2288e",
  storageBucket: "anushabazaar-2288e.firebasestorage.app",
  messagingSenderId: "64875938387",
  appId: "1:64875938387:android:92945e5b265d394aba7ca6",
};

// Initialize Firebase (only once)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export { firebase };
export default firebase;