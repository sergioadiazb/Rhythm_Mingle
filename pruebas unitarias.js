import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-sdssoundcloud-app';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

function App() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [musicFiles, setMusicFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
      } else {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("Error al autenticar:", error);
          setMessage(`Error al autenticar: ${error.message}`);
        }
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthReady && userId) {
      const musicCollectionRef = collection(db, `artifacts/${appId}/public/data/music`);
      const q = query(musicCollectionRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const musicList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMusicFiles(musicList);
      }, (error) => {
        console.error("Error al cargar la música:", error);
        setMessage(`Error al cargar la música: ${error.message}`);
      });

      return () => unsubscribe();
    }
  }, [isAuthReady, userId]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setMessage("No se seleccionó ningún archivo.");
      return;
    }

    if (!userId) {
      setMessage("Debe iniciar sesión para subir música.");
      return;
    }

    setUploading(true);
    setMessage('Subiendo archivo...');

    try {
      const storageRef = ref(storage, `artifacts/${appId}/public/music/${userId}/${file.name}`);

      const uploadTask = uploadBytes(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Error durante la subida:", error);
          setMessage(`Error al subir el archivo: ${error.message}`);
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(storageRef);

          await addDoc(collection(db, `artifacts/${appId}/public/data/music`), {
            name: file.name,
            url: downloadURL,
            uploadedBy: userId,
            createdAt: serverTimestamp(),
          });

          setMessage('Archivo subido y registrado exitosamente!');
          setUploading(false);
          setUploadProgress(0);
          setCurrentView('myMusic');
        }
      );
    } catch (error) {
      console.error("Error al subir el archivo:", error);
      setMessage(`Error al subir el archivo: ${error.message}`);
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserId(null);
      setMessage('Sesión cerrada.');
      setCurrentView('home');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setMessage(`Error al cerrar sesión: ${error.message}`);
    }
  };

  const UploadMusicView = () => (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Subir Nueva Música</h2>
      {message && <p className="text-sm text-red-500 mb-4">{message}</p>}
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        disabled={uploading}
      />
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${uploadProgress}%` }}
          ></div>
          <p className="text-sm text-gray-600 mt-1">{Math.round(uploadProgress)}% completado</p>
        </div>
      )}
      <button
        onClick={() => setCurrentView('home')}
        className="mt-6 px-4 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition duration-300 ease-in-out"
      >
        Volver
      </button>
    </div>
  );

  const MusicListView = () => (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Toda la Música</h2>
      {musicFiles.length === 0 ? (
        <p className="text-gray-600">No hay música disponible. ¡Sube la primera canción!</p>
      ) : (
        <ul className="space-y-4">
          {musicFiles.map((music) => (
            <li key={music.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                <span className="text-lg font-medium text-gray-900">{music.name}</span>
              </div>
              <audio controls src={music.url} className="w-64"></audio>
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={() => setCurrentView('home')}
        className="mt-6 px-4 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition duration-300 ease-in-out"
      >
        Volver
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center p-4 font-sans">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      <script src="https://cdn.tailwindcss.com"></script>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <header className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6 flex justify-between items-center mt-4">
        <h1 className="text-3xl font-extrabold text-blue-600">SDSSoundcloud</h1>
        <nav className="flex space-x-4">
          <button
            onClick={() => setCurrentView('home')}
            className={`px-4 py-2 rounded-full text-lg font-semibold transition duration-300 ease-in-out ${currentView === 'home' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-700 hover:bg-blue-100'}`}
          >
            Inicio
          </button>
          {userId && (
            <>
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-4 py-2 rounded-full text-lg font-semibold transition duration-300 ease-in-out ${currentView === 'upload' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-700 hover:bg-blue-100'}`}
              >
                Subir Música
              </button>
              <button
                onClick={() => setCurrentView('myMusic')}
                className={`px-4 py-2 rounded-full text-lg font-semibold transition duration-300 ease-in-out ${currentView === 'myMusic' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-700 hover:bg-blue-100'}`}
              >
                Mi Música
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-full text-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition duration-300 ease-in-out shadow-md"
              >
                Cerrar Sesión
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="w-full max-w-4xl mt-8">
        {message && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{message}</span>
          </div>
        )}

        {userId && (
          <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm mb-4">
            Tu ID de Usuario: <span className="font-mono break-all">{userId}</span>
          </div>
        )}

        {currentView === 'home' && (
          <div className="p-8 bg-white rounded-lg shadow-md text-center mt-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Bienvenido a SDSSoundcloud</h2>
            <p className="text-gray-600 text-lg mb-6">
              Tu plataforma para gestionar, reproducir y cargar contenido musical en línea.
            </p>
            <button
              onClick={() => setCurrentView('myMusic')}
              className="px-6 py-3 bg-blue-500 text-white rounded-full text-xl font-bold hover:bg-blue-600 transition duration-300 ease-in-out shadow-lg"
            >
              Explorar Música
            </button>
          </div>
        )}

        {currentView === 'upload' && <UploadMusicView />}
        {currentView === 'myMusic' && <MusicListView />}
      </main>
    </div>
  );
}

export default App;
