// Función auxiliar para obtener fechas exactas en la zona horaria local
const obtenerFechaLocal = (diasExtra = 0, mesesExtra = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + diasExtra);
    d.setMonth(d.getMonth() + mesesExtra);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const vistaAgendar = () => {
    const minString = obtenerFechaLocal(2, 0); // Hoy + 48 hrs
    const maxString = obtenerFechaLocal(0, 3); // Hoy + 3 meses

    return `
        <!-- Le agregamos el ID 'vista-agendar-container' para poder reemplazarlo por el ticket -->
        <div id="vista-agendar-container" style="width: 500px; text-align: left;">
            <h2>Agendar Nueva Cita</h2>
            <form id="form-agendar">
                <label><b>1. Selecciona la Especialidad:</b></label><br>
                <select id="select-especialidad" required>
                    <option value="" disabled selected>Cargando especialidades...</option>
                </select><br><br>

                <label><b>2. Selecciona el Doctor:</b></label><br>
                <select id="select-doctor" required disabled>
                    <option value="" disabled selected>Primero elige una especialidad</option>
                </select><br><br>

                <label><b>3. Fecha de la cita:</b></label><br>
                <input type="date" id="fecha-cita" min="${minString}" max="${maxString}" required><br>
                <small style="color: #666;">Mínimo 48 hrs de anticipación.</small><br><br>

                <label><b>4. Hora de la cita:</b></label><br>
                <select id="select-hora" required disabled>
                    <option value="" disabled selected>Primero elige doctor y fecha</option>
                </select><br>
                <small style="color: #666;">Intervalos de 30 minutos según disponibilidad del médico.</small><br><br>

                <button type="submit" style="background-color: #28a745;">Confirmar Cita</button>
            </form>
            <p id="mensaje-agendar" style="font-size: 14px; margin-top: 10px;"></p>
            <br>
            <button onclick="navegar('/paciente')" class="btn-secundario">Cancelar y Volver</button>
        </div>
    `;
};

export const inicializarAgendar = async () => {
    const selectEspecialidad = document.getElementById('select-especialidad');
    const selectDoctor = document.getElementById('select-doctor');
    const inputFecha = document.getElementById('fecha-cita');
    const selectHora = document.getElementById('select-hora');
    const formAgendar = document.getElementById('form-agendar');
    const mensajeEstado = document.getElementById('mensaje-agendar');
    const contenedorPrincipal = document.getElementById('vista-agendar-container');

    const sesion = JSON.parse(localStorage.getItem('pacienteSesion'));

    // 1. Cargar especialidades
    try {
        const respuesta = await fetch('/api/especialidades');
        const datos = await respuesta.json();
        if (datos.exito) {
            selectEspecialidad.innerHTML = '<option value="" disabled selected>Elige una opción...</option>';
            datos.especialidades.forEach(esp => {
                selectEspecialidad.innerHTML += `<option value="${esp.id_especialidad}">${esp.nombre_especialidad} ($${esp.costo_consulta})</option>`;
            });
        }
    } catch (error) {
        selectEspecialidad.innerHTML = '<option value="" disabled>Error al cargar</option>';
    }

    // 2. Al cambiar la especialidad, cargar doctores
    selectEspecialidad.addEventListener('change', async (e) => {
        const idEspecialidad = e.target.value;
        selectDoctor.innerHTML = '<option value="" disabled selected>Cargando doctores...</option>';
        selectDoctor.disabled = true;
        selectHora.innerHTML = '<option value="" disabled selected>Primero elige doctor y fecha</option>';
        selectHora.disabled = true;

        try {
            const respuesta = await fetch(`/api/doctores/${idEspecialidad}`);
            const datos = await respuesta.json();

            if (datos.exito && datos.doctores.length > 0) {
                selectDoctor.innerHTML = '<option value="" disabled selected>Elige un doctor...</option>';
                datos.doctores.forEach(doc => {
                    const inicio = doc.hora_inicio.substring(0, 5);
                    const fin = doc.hora_fin.substring(0, 5);
                    selectDoctor.innerHTML += `<option value="${doc.id_doctor}" data-inicio="${inicio}" data-fin="${fin}">${doc.nombre} (${inicio} - ${fin})</option>`;
                });
                selectDoctor.disabled = false;
            } else {
                selectDoctor.innerHTML = '<option value="" disabled selected>No hay doctores disponibles</option>';
            }
        } catch (error) {
            selectDoctor.innerHTML = '<option value="" disabled>Error al cargar</option>';
        }
    });

    // 3. Generador dinámico de intervalos de 30 minutos
    const actualizarHorarios = () => {
        const doctorSeleccionado = selectDoctor.options[selectDoctor.selectedIndex];
        const fechaElegida = inputFecha.value;

        if (!doctorSeleccionado || !doctorSeleccionado.value || !fechaElegida) {
            selectHora.innerHTML = '<option value="" disabled selected>Primero elige doctor y fecha</option>';
            selectHora.disabled = true;
            return;
        }

        const horaInicio = doctorSeleccionado.getAttribute('data-inicio');
        const horaFin = doctorSeleccionado.getAttribute('data-fin');

        const [hInicio, mInicio] = horaInicio.split(':').map(Number);
        const [hFin, mFin] = horaFin.split(':').map(Number);

        const fechaMinimaLimit = obtenerFechaLocal(2, 0); 
        const hoy = new Date(); 

        selectHora.innerHTML = '<option value="" disabled selected>Elige un horario...</option>';
        let opcionesDisponibles = 0;

        let horaIter = hInicio;
        let minIter = mInicio === 30 ? 30 : 0; 

        while (horaIter < hFin || (horaIter === hFin && minIter === 0)) {
            const horaFormat = horaIter.toString().padStart(2, '0') + ':' + (minIter === 0 ? '00' : '30');
            let bloqueado = false;

            if (fechaElegida === fechaMinimaLimit) {
                if (horaIter < hoy.getHours() || (horaIter === hoy.getHours() && minIter < hoy.getMinutes())) {
                    bloqueado = true;
                }
            }

            if (!bloqueado) {
                const ampm = horaIter >= 12 ? 'p.m.' : 'a.m.';
                const hora12 = horaIter % 12 === 0 ? 12 : horaIter % 12;
                const visual = `${hora12.toString().padStart(2, '0')}:${minIter === 0 ? '00' : '30'} ${ampm}`;
                
                selectHora.innerHTML += `<option value="${horaFormat}">${visual}</option>`;
                opcionesDisponibles++;
            }

            minIter += 30;
            if (minIter >= 60) {
                minIter = 0;
                horaIter++;
            }
        }

        if (opcionesDisponibles === 0) {
            selectHora.innerHTML = '<option value="" disabled selected>Turno no disponible para esta fecha</option>';
            selectHora.disabled = true;
        } else {
            selectHora.disabled = false;
        }
    };

    selectDoctor.addEventListener('change', actualizarHorarios);
    inputFecha.addEventListener('change', actualizarHorarios);

    // 4. Guardar Cita y Generar Comprobante
    formAgendar.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id_doctor = selectDoctor.value;
        const hora_elegida = selectHora.value;

        if (!id_doctor) {
            mensajeEstado.style.color = 'red';
            mensajeEstado.textContent = 'Error: No se pudo capturar el ID del doctor.';
            return;
        }

        if (!hora_elegida) {
            mensajeEstado.style.color = 'red';
            mensajeEstado.textContent = 'Error: Por favor selecciona un horario.';
            return;
        }

        const datosCita = {
            id_paciente: parseInt(sesion.id_paciente), 
            id_doctor: parseInt(id_doctor),
            fecha: inputFecha.value,
            hora: hora_elegida
        };

        mensajeEstado.style.color = 'black';
        mensajeEstado.textContent = 'Procesando cita...';

        try {
            const respuesta = await fetch('/api/agendar-cita', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosCita)
            });

            const resultado = await respuesta.json();

            if (resultado.exito) {
                // Extraemos los textos exactos para el ticket
                const folioAsignado = resultado.mensaje.match(/CIT-\d+/)[0];
                const nombreEspecialidad = selectEspecialidad.options[selectEspecialidad.selectedIndex].text.split(' ($')[0];
                const nombreDoctor = selectDoctor.options[selectDoctor.selectedIndex].text.split(' (')[0];
                
                // Generamos una línea de captura aleatoria de 15 dígitos
                const lineaPago = Math.floor(100000000000000 + Math.random() * 900000000000000);

                // DIBUJAMOS EL TICKET EN PANTALLA
                contenedorPrincipal.innerHTML = `
                    <div style="border: 2px dashed #28a745; padding: 25px; background-color: #f8f9fa; width: 100%; box-sizing: border-box; border-radius: 8px;">
                        <h2 style="color: #28a745; margin-top: 0; text-align: center;">¡Cita Agendada con Éxito!</h2>
                        <h3 style="margin-bottom: 10px; text-align: center;">🏥 Comprobante HospitalESCOM</h3>
                        <hr style="border: 1px solid #ccc;">
                        <div style="padding: 10px 0;">
                            <p style="margin: 5px 0;"><strong>Folio:</strong> ${folioAsignado}</p>
                            <p style="margin: 5px 0;"><strong>Paciente:</strong> ${sesion.nombre}</p>
                            <p style="margin: 5px 0;"><strong>Especialidad:</strong> ${nombreEspecialidad}</p>
                            <p style="margin: 5px 0;"><strong>Doctor:</strong> ${nombreDoctor}</p>
                            <p style="margin: 5px 0;"><strong>Fecha:</strong> ${datosCita.fecha}</p>
                            <p style="margin: 5px 0;"><strong>Hora:</strong> ${datosCita.hora}</p>
                            <p style="margin: 5px 0;"><strong>Consultorio:</strong> (Por asignar en recepción)</p>
                        </div>
                        <hr style="border: 1px solid #ccc;">
                        
                        <div style="text-align: center; margin-top: 15px;">
                            <h4 style="margin: 0 0 5px 0;">💳 LÍNEA DE PAGO</h4>
                            <p style="font-family: monospace; font-size: 22px; font-weight: bold; margin: 0; letter-spacing: 2px;">${lineaPago}</p>
                        </div>
                        
                        <div style="background-color: #fff3cd; color: #856404; padding: 15px; font-size: 13px; margin-top: 20px; border-radius: 5px; border: 1px solid #ffeeba;">
                            <b>⏳ TIEMPO DE PAGO:</b> Tienes un máximo de 8 hrs para realizar tu pago en caja, de lo contrario la cita será liberada automáticamente.<br><br>
                            <b>📜 POLÍTICA DE CANCELACIÓN:</b><br>
                            • 48 hrs de anticipación -> Devolución del 100%<br>
                            • 24 hrs de anticipación -> Devolución del 50%<br>
                            • Menos de 24 hrs -> Sin devolución
                        </div>
                        
                        <div style="text-align: center; margin-top: 20px;">
                            <button onclick="navegar('/paciente')" style="background-color: #007bff; color: white; padding: 10px 20px; border: none; cursor: pointer; border-radius: 5px; font-weight: bold;">Volver a mi panel</button>
                        </div>
                    </div>
                `;
            } else {
                mensajeEstado.style.color = 'red';
                mensajeEstado.textContent = resultado.mensaje;
            }
        } catch (error) {
            mensajeEstado.style.color = 'red';
            mensajeEstado.textContent = 'Error de conexión con el servidor.';
        }
    });
};