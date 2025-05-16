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

// TODO: Mover estas configurações para variáveis de ambiente em produção
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

// Email do administrador
export const ADMIN_EMAIL = "washington.wn8@gmail.com";

// Fatores de parcelamento
export const FATORES = {
    cartao: [1.0292, 0.5220, 0.3530, 0.2685, 0.2179, 0.1841, 0.1600, 0.1420, 0.1280, 0.1168, 0.1076, 0.1000],
    carne: [1.0690, 0.5523, 0.3804, 0.2946, 0.2432, 0.2091, 0.1849, 0.1668, 0.1528, 0.1417, 0.1327, 0.1252]
};

// Variável global para controle da seção atual
export let currentSection = 'simulator';

// Variável global para armazenar os resultados da simulação
export let simulationResults = {
    inputs: {},
    results: {}
};

// Variável para armazenar dados do usuário atual
export let currentUser = null;

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

export { 
    db, 
    auth, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    limit,
    where,
    getDoc,
    doc,
    deleteDoc,
    Timestamp,
    updateDoc,
    setDoc,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut,
    updateProfile
};
