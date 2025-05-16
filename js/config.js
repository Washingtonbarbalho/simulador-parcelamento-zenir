// Firebase configuration
// IMPORTANTE: Este arquivo contém informações sensíveis e deve ser adicionado ao .gitignore

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs,
    getDoc,
    doc,
    deleteDoc,
    query, 
    orderBy, 
    limit,
    Timestamp,
    updateDoc,
    setDoc,
    where
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQlkGBnifmKmuVO_F1zDQoMClGvidvS8M",
  authDomain: "simulador-parcelameto-zenir.firebaseapp.com",
  projectId: "simulador-parcelameto-zenir",
  storageBucket: "simulador-parcelameto-zenir.firebasestorage.app",
  messagingSenderId: "1033254543995",
  appId: "1:1033254543995:web:415e32c9070e5e40a038de"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Authentication
const auth = getAuth(app);

// Exportar para a janela global para usar em outras partes do código
window.db = db;
window.auth = auth;
window.firebase = { 
    collection, 
    addDoc,
    getDoc,
    doc,
    deleteDoc,
    getDocs, 
    query, 
    orderBy, 
    limit,
    Timestamp,
    updateDoc,
    setDoc,
    where,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut,
    updateProfile
};

// Constantes da aplicação
window.ADMIN_EMAIL = "washington.wn8@gmail.com";
