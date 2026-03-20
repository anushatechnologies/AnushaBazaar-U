import firebase from "firebase/compat/app";
import "firebase/compat/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD0HxBUfMEMgphKoXvZIOOySmdABZF5bdA",
  authDomain: "phoneauth-ff032.firebaseapp.com",
  projectId: "phoneauth-ff032",
  storageBucket: "phoneauth-ff032.firebasestorage.app",
  messagingSenderId: "314843029433",
  appId: "1:314843029433:android:ff54f01a2471e3d3742068",
};

// Initialize Firebase (only once)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export { firebase };
export default firebase;