export const vistaDoctor = () => {
    const sesion = localStorage.getItem('doctorSesion');
    
    if (!sesion) {
        setTimeout(() => window.navegar('/login'), 100);
        return `<h2>Acceso denegado. Redirigiendo...</h2>`;
    }

    const doctor = JSON.parse(sesion);

    return `
        <div style="width: 850px; text-align: left;">
            <h2>Panel del Doctor</h2>
            <div style="background: #e2e3e5; padding: 15px; border-radius: 5px;">
                <h3>Datos Personales</h3>
                <p><strong>Nombre:</strong> ${doctor.nombre}</p>
                <p><strong>Número de Empleado:</strong> ${doctor.numero_empleado}</p>
                <p><strong>Cédula Profesional:</strong> ${doctor.cedula_profesional}</p>
                <p><strong>CURP:</strong> ${doctor.curp}</p>
                <p><strong>Especialidad:</strong> ${doctor.nombre_especialidad}</p>
            </div>

            <div style="margin-top: 20px;">
                <h3>Mi Agenda de Citas</h3>
                <div id="contenedor-citas-doctor">Cargando agenda...</div>
            </div>

            <div style="margin-top: 20px; text-align: center;">
                <button onclick="cerrarSesionDoctor()" class="btn-secundario">Cerrar Sesión</button>
            </div>
        </div>
    `;
};

export const inicializarDoctor = async () => {
    window.cerrarSesionDoctor = () => {
        localStorage.removeItem('doctorSesion');
        window.navegar('/inicio');
    };

    const contenedor = document.getElementById('contenedor-citas-doctor');
    const sesion = JSON.parse(localStorage.getItem('doctorSesion'));
    
    if (!sesion) return;

    try {
        const respuesta = await fetch(`/api/citas-doctor/${sesion.id_doctor}`);
        if (!respuesta.ok) throw new Error(`Error del servidor: ${respuesta.status}`);
        
        const datos = await respuesta.json();

        if (datos.exito && datos.citas.length > 0) {
            let tabla = `
                <table border="1" style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead style="background-color: #f2f2f2;">
                        <tr>
                            <th style="padding: 8px;">Folio</th>
                            <th style="padding: 8px;">Paciente</th>
                            <th style="padding: 8px;">Fecha</th>
                            <th style="padding: 8px;">Hora</th>
                            <th style="padding: 8px;">Estatus</th>
                            <th style="padding: 8px;">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            datos.citas.forEach(cita => {
                const fechaLimpia = String(cita.fecha_cita).split('T')[0];
                let horaLimpia = String(cita.hora_cita).includes('T') ? 
                                 String(cita.hora_cita).split('T')[1].substring(0, 5) : 
                                 String(cita.hora_cita).substring(0, 5);

                // BOTÓN ACTUALIZADO PARA NAVEGAR A LA CONSULTA
                let botonAtender = '';
                if (!cita.estatus_cita.includes('Cancelada') && !cita.estatus_cita.includes('Atendida')) {
                    botonAtender = `<button onclick="atenderPaciente('${cita.folio_cita}', ${cita.id_paciente}, '${cita.nombre_paciente}')" style="background-color: #17a2b8; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Atender Paciente</button>`;
                }

                tabla += `
                    <tr>
                        <td style="padding: 8px;">${cita.folio_cita}</td>
                        <td style="padding: 8px;">${cita.nombre_paciente}</td>
                        <td style="padding: 8px;">${fechaLimpia}</td>
                        <td style="padding: 8px;">${horaLimpia}</td>
                        <td style="padding: 8px;"><b>${cita.estatus_cita}</b></td>
                        <td style="padding: 8px;">${botonAtender}</td>
                    </tr>
                `;
            });
            tabla += `</tbody></table>`;
            contenedor.innerHTML = tabla;
        } else {
            contenedor.innerHTML = '<p>No tienes pacientes programados en tu agenda.</p>';
        }
    } catch (error) {
        contenedor.innerHTML = `<p style="color: red;">Error técnico: ${error.message}</p>`;
    }

    // --- FUNCIÓN GLOBAL PARA PASAR LOS DATOS A LA PANTALLA DE ATENCIÓN ---
    window.atenderPaciente = (folio, id_paciente, nombre) => {
        localStorage.setItem('citaEnAtencion', JSON.stringify({ 
            folio_cita: folio, 
            id_paciente: id_paciente, 
            nombre_paciente: nombre 
        }));
        window.navegar('/atender');
    };
};