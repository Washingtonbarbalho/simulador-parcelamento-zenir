// Módulo de Inicialização do Firebase
// Configura e exporta as instâncias do Firebase para serem usadas em outros módulos.

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
    getFirestore, collection, addDoc, getDocs, getDoc, doc, deleteDoc,
    query, orderBy, limit, updateDoc, setDoc, where
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    onAuthStateChanged, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

// Configuração do seu web app do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBQlkGBnifmKmuVO_F1zDQoMClGvidvS8M",
    authDomain: "simulador-parcelameto-zenir.firebaseapp.com",
    projectId: "simulador-parcelameto-zenir",
    storageBucket: "simulador-parcelameto-zenir.appspot.com",
    messagingSenderId: "1033254543995",
    appId: "1:1033254543995:web:415e32c9070e5e40a038de"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta instâncias do Firestore e Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Exporta funções do Firebase para fácil acesso
export const firebase = {
    collection, addDoc, getDoc, doc, deleteDoc, getDocs,
    query, orderBy, limit, updateDoc, setDoc, where,
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    onAuthStateChanged, signOut, updateProfile
};
