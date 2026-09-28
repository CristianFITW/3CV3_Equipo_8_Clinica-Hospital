export const vistaLogin = () => `
    <div>
        <h2>Iniciar Sesión</h2>
        <form id="form-login">
            <input type="text" id="usuario" placeholder="Usuario (Ej. Correo o Boleta)" required><br><br>
            <input type="password" id="contrasena" placeholder="Contraseña" required><br><br>
            <button type="submit">Entrar</button>
        </form>
        <p id="mensaje-login" style="font-size: 14px; margin-top: 10px;"></p>
        <br>
        <button onclick="navegar('/')" class="btn-secundario">Volver al Inicio</button>
    </div>
`;

export const inicializarLogin = () => {
    const formulario = document.getElementById('form-login');
    if (!formulario) return;

    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Usamos trim() para eliminar espacios en blanco accidentales al inicio o final
        const datos = {
            usuario: document.getElementById('usuario').value.trim(),
            contrasena: document.getElementById('contrasena').value.trim()
        };

        const estado = document.getElementById('mensaje-login');
        estado.style.color = 'black';
        estado.textContent = 'Verificando credenciales...';

        try {
            const respuesta = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });

            const resultado = await respuesta.json();

            if (resultado.exito) {
                // CORRECCIÓN AQUÍ: Usar la variable 'estado' correcta
                estado.style.color = 'green';
                estado.textContent = resultado.mensaje;
                
                // Guardamos la sesión y el rol
                // Guardamos la sesión y el rol
                if (resultado.rol === 'paciente') {
                    localStorage.setItem('pacienteSesion', JSON.stringify(resultado.usuario));
                    setTimeout(() => navegar('/paciente'), 1500);
                } else if (resultado.rol === 'doctor') {
                    localStorage.setItem('doctorSesion', JSON.stringify(resultado.usuario));
                    setTimeout(() => navegar('/doctor'), 1500); 
                } else if (resultado.rol === 'admin') {
                    localStorage.setItem('adminSesion', JSON.stringify(resultado.usuario));
                    setTimeout(() => navegar('/admin'), 1500); 
                }
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