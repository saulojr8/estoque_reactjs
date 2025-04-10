import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'


const firebaseConfig = {
    apiKey: "AIzaSyB1EQTrvzh7z4EnayCiaABaPMQbsMkKIWk",
    authDomain: "controle-loja-2fd41.firebaseapp.com",
    projectId: "controle-loja-2fd41",
    storageBucket: "controle-loja-2fd41.firebasestorage.app",
    messagingSenderId: "187486348645",
    appId: "1:187486348645:web:07263bed61c4b0965fad8c",
    measurementId: "G-BZG5FKNXQP"
};

const firebaseApp = initializeApp(firebaseConfig);

const db = getFirestore(firebaseApp);

export {db};
