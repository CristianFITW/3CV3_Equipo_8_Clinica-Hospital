export const vistaAltaDoctor = () => {
    const sesion = localStorage.getItem('adminSesion');
    if (!sesion) {
        setTimeout(() => window.navegar('/login'), 100);
        return `<h2>Acceso denegado.</h2>`;
    }

    return `
        <div style="width: 600px; text-align: left; margin: 0 auto;">
            <h2>👨‍⚕️ Dar de Alta a Médico</h2>
            <form id="form-alta-doctor" style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                <label>Número de Empleado (Ej. DOC-004):</label><br>
                <input type="text" id="num-empleado" required style="width: 100%; margin-bottom: 10px;"><br>
                
                <label>Nombre Completo (Ej. Dr. Juan Pérez):</label><br>
                <input type="text" id="nombre-doc" required style="width: 100%; margin-bottom: 10px;"><br>
                
                <label>Cédula Profesional:</label><br>
                <input type="text" id="cedula" required style="width: 100%; margin-bottom: 10px;"><br>
                
                <label>CURP:</label><br>
                <input type="text" id="curp" required style="width: 100%; margin-bottom: 10px;"><br>
                
                <label>Especialidad Asignada:</label><br>
                <select id="especialidad-doc" required style="width: 100%; margin-bottom: 10px; padding: 5px;">
                    <option value="" disabled selected>Cargando especialidades...</option>
                </select><br>

                <div style="display: flex; gap: 10px;">
                    <div style="flex: 1;">
                        <label>Hora Inicio (Turno):</label><br>
                        <input type="time" id="hora-inicio" required style="width: 100%; margin-bottom: 10px;">
                    </div>
                    <div style="flex: 1;">
                        <label>Hora Fin (Turno):</label><br>
                        <input type="time" id="hora-fin" required style="width: 100%; margin-bottom: 10px;">
                    </div>
                </div>

                <label>Contraseña de Acceso para el Doctor:</label><br>
                <input type="password" id="pass-doc" required style="width: 100%; margin-bottom: 20px;"><br>
                
                <button type="submit" style="background-color: #0056b3; color: white; width: 100%; padding: 10px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Guardar Médico en Base de Datos</button>
            </form>
            <p id="mensaje-alta" style="text-align: center; font-weight: bold; margin-top: 10px;"></p>
            
            <div style="text-align: center; margin-top: 15px;">
                <button onclick="window.navegar('/admin')" class="btn-secundario">Volver al Panel Principal</button>
            </div>
        </div>
    `;
};

export const inicializarAltaDoctor = async () => {
    const selectEspecialidad = document.getElementById('especialidad-doc');
    const formAlta = document.getElementById('form-alta-doctor');
    const mensajeEstatus = document.getElementById('mensaje-alta');

    // 1. Cargar las especialidades al select
    try {
        const respuesta = await fetch('/api/especialidades');
        const datos = await respuesta.json();
        if (datos.exito) {
            selectEspecialidad.innerHTML = '<option value="" disabled selected>Selecciona una especialidad...</option>';
            datos.especialidades.forEach(esp => {
                selectEspecialidad.innerHTML += `<option value="${esp.id_especialidad}">${esp.nombre_especialidad}</option>`;
            });
        }
    } catch (error) {
        selectEspecialidad.innerHTML = '<option value="" disabled>Error al cargar especialidades</option>';
    }

    // 2. Enviar formulario al servidor
    formAlta.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const datos = {
            numero_empleado: document.getElementById('num-empleado').value.trim(),
            nombre: document.getElementById('nombre-doc').value.trim(),
            cedula_profesional: document.getElementById('cedula').value.trim(),
            curp: document.getElementById('curp').value.trim(),
            id_especialidad: selectEspecialidad.value,
            hora_inicio: document.getElementById('hora-inicio').value,
            hora_fin: document.getElementById('hora-fin').value,
            contrasena: document.getElementById('pass-doc').value
        };

        mensajeEstatus.style.color = 'black';
        mensajeEstatus.textContent = 'Procesando...';

        try {
            const respuesta = await fetch('/api/registro-doctor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });

            const resultado = await respuesta.json();

            if (resultado.exito) {
                mensajeEstatus.style.color = 'green';
                mensajeEstatus.textContent = resultado.mensaje;
                formAlta.reset(); // Limpia el formulario
            } else {
                mensajeEstatus.style.color = 'red';
                mensajeEstatus.textContent = resultado.mensaje;
            }
        } catch (error) {
            mensajeEstatus.style.color = 'red';
            mensajeEstatus.textContent = 'Error de conexión con el servidor.';
        }
    });
};