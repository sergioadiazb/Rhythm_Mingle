import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
        import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-analytics.js";
        import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
        const firebaseConfig = {
            apiKey: "AIzaSyD8vqVDweadKCcELrEWx9I0Hw63r11n8mU",
            authDomain: "sdsouncloud.firebaseapp.com",
            projectId: "sdsouncloud",
            storageBucket: "sdsouncloud.appspot.com",
            messagingSenderId: "104219545502",
            appId: "1:104219545502:web:7118b6151630683b45108f",
            measurementId: "G-7MM2V4VVGR"
        };
        const app = initializeApp(firebaseConfig);
        const auth = getAuth();
        function registrarse() {
            var email = document.getElementById('email-registro').value;
            var password = document.getElementById('password-registro').value;
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    var username = email.substring(0, email.indexOf('@'));
                    alert('Bienvenido ' + username + ' te has registrado satisfactoriamente.');
                    window.location.href = './inicio.html';
                })
                .catch((error) => {
                    alert('El usuario ya está registrado. Por favor, inicie sesión.');
                });
        }
        window.registrarse = registrarse;
        function iniciarSesion() {
            var email = document.getElementById('email-inicio-sesion').value;
            var password = document.getElementById('password-inicio-sesion').value;
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    var username = email.substring(0, email.indexOf('@'));
                    localStorage.setItem('username', username);
                    alert('Bienvenido ' + username + ', has iniciado sesión satisfactoriamente.');
                    window.location.href = './inicio.html';
                })
                .catch((error) => {
                    alert('Usuario no registrado. Por favor, regístrese.');
                });
        }
        window.iniciarSesion = iniciarSesion;
        