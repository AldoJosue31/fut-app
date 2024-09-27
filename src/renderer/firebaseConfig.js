// Importar las funciones necesarias de Firebase SDK
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore, collection, addDoc } from 'firebase/firestore'; // Importar Firestore y las funciones necesarias

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyDg3a06owYH1qdXPoADvc_VOvkU8kl9JMk',
  authDomain: 'fut-app-4d5c4.firebaseapp.com',
  projectId: 'fut-app-4d5c4',
  storageBucket: 'fut-app-4d5c4.appspot.com',
  messagingSenderId: '419684818101',
  appId: '1:419684818101:web:1de054504d6b0569da72fc',
  measurementId: 'G-4LFLWLP86Y',
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const analytics = getAnalytics(app); // Solo si estás usando analytics

// Inicializar Firestore
const db = getFirestore(app);

// Función para agregar un documento a una colección
const addUserToFirestore = async (userData) => {
  try {
    // Referencia a la colección 'Usuarios'
    const docRef = await addDoc(collection(db, 'Usuarios'), userData);
    console.log('Usuario agregado con ID: ', docRef.id);
  } catch (e) {
    console.error('Error al agregar el documento: ', e);
  }
};

// Exportar las funciones que necesitas
export { db, addUserToFirestore };
