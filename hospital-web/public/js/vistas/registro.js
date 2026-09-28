export const vistaRegistro = () => `
    <div>
        <h2>Registro de Nuevo Paciente</h2>
        <form id="form-registro">
            <input type="text" id="nombre" placeholder="Nombre completo" required><br><br>
            <input type="number" id="edad" placeholder="Edad" min="0" required><br><br>
            <input type="email" id="correo" placeholder="Correo electrónico" required><br><br>
            <input type="tel" id="telefono" placeholder="Teléfono" required><br><br>
            <input type="password" id="contrasena" placeholder="Contraseña" required><br><br>
            <button type="submit">Registrarse</button>
        </form>
        <p id="mensaje-estado" style="font-size: 14px; margin-top: 10px;"></p>
        <br>
        <button onclick="navegar('/')" class="btn-secundario">Volver al Inicio</button>
    </div>
`;

// Función auxiliar que se ejecuta una vez que la vista se ha inyectado en el DOM
export const inicializarRegistro = () => {
    const formulario = document.getElementById('form-registro');
    if (!formulario) return;

    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();

        const datos = {
            nombre: document.getElementById('nombre').value,
            edad: parseInt(document.getElementById('edad').value),
            correo: document.getElementById('correo').value,
            telefono: document.getElementById('telefono').value,
            contrasena: document.getElementById('contrasena').value
        };

        const estado = document.getElementById('mensaje-estado');
        estado.style.color = 'black';
        estado.textContent = 'Registrando...';

        try {
            const respuesta = await fetch('/api/registro-paciente', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });

            const resultado = await respuesta.json();

            if (resultado.exito) {
                estado.style.color = 'green';
                estado.textContent = '¡Registro exitoso! Redirigiendo al login...';
                setTimeout(() => {
                    window.navegar('/login');
                }, 2000);
            } else {
                estado.style.color = 'red';
                estado.textContent = resultado.mensaje;
            }
        } catch (error) {
            estado.style.color = 'red';
            estado.textContent = 'Error de conexión con el servidor.';
        }
    });
};