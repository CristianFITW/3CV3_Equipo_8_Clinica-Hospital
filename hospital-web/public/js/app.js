import { vistaInicio } from './vistas/inicio.js';
import { vistaLogin, inicializarLogin } from './vistas/login.js';
import { vistaRegistro, inicializarRegistro } from './vistas/registro.js';
import { vistaPaciente, inicializarPaciente } from './vistas/paciente.js'; 
import { vistaAgendar, inicializarAgendar } from './vistas/agendar.js'; 
import { vistaDoctor, inicializarDoctor } from './vistas/doctor.js';
import { vistaAtender, inicializarAtender } from './vistas/atender.js';
import { vistaReceta, inicializarReceta } from './vistas/receta.js';
import { vistaAdmin, inicializarAdmin } from './vistas/admin.js';
import { vistaAltaDoctor, inicializarAltaDoctor } from './vistas/alta-doctor.js';
import { vistaFarmacia, inicializarFarmacia } from './vistas/farmacia.js';
import { vistaCobros, inicializarCobros } from './vistas/cobros.js';
import { vistaBitacoras, inicializarBitacoras } from './vistas/bitacoras.js';

const contenedor = document.getElementById('app');

const enrutador = () => {
    const ruta = window.location.pathname;

    if (ruta === '/' || ruta === '/inicio') {
        contenedor.innerHTML = vistaInicio();
    } else if (ruta === '/login') {
        contenedor.innerHTML = vistaLogin();
        inicializarLogin();
    } else if (ruta === '/registro') {
        contenedor.innerHTML = vistaRegistro();
        inicializarRegistro();
    } else if (ruta === '/paciente') {
        contenedor.innerHTML = vistaPaciente();
        inicializarPaciente();
    } else if (ruta === '/agendar') {
        contenedor.innerHTML = vistaAgendar();
        inicializarAgendar();
    } else if (ruta === '/doctor') {
        contenedor.innerHTML = vistaDoctor();
        inicializarDoctor();
    } else if (ruta === '/atender') {               // <-- NUEVA RUTA
        contenedor.innerHTML = vistaAtender();
        inicializarAtender();
    } else if (ruta === '/receta') {
        contenedor.innerHTML = vistaReceta();
        inicializarReceta();
    } else if (ruta === '/admin') {
        contenedor.innerHTML = vistaAdmin();
        inicializarAdmin();
    } else if (ruta === '/admin/alta-doctor') {
        contenedor.innerHTML = vistaAltaDoctor();
        inicializarAltaDoctor();
    } else if (ruta === '/admin/farmacia') {
        contenedor.innerHTML = vistaFarmacia();
        inicializarFarmacia();
    } else if (ruta === '/admin/cobros') {
        contenedor.innerHTML = vistaCobros();
        inicializarCobros();
    } else if (ruta === '/admin/bitacoras') {        // <-- NUEVA (Y ÚLTIMA) RUTA
        contenedor.innerHTML = vistaBitacoras();
        inicializarBitacoras();
    } else {
        contenedor.innerHTML = `<h2>Error 404: Página no encontrada</h2><button onclick="navegar('/')">Ir al inicio</button>`;
    }
};

window.navegar = (ruta) => {
    window.history.pushState({}, '', ruta);
    enrutador();
};

window.addEventListener('popstate', enrutador);
document.addEventListener('DOMContentLoaded', enrutador);