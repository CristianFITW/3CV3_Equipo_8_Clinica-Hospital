export const vistaPaciente = () => {
    const sesion = localStorage.getItem('pacienteSesion');
    
    if (!sesion) {
        setTimeout(() => window.navegar('/login'), 100);
        return `<h2>Acceso denegado. Redirigiendo...</h2>`;
    }

    const paciente = JSON.parse(sesion);

    return `
        <div style="width: 850px; text-align: left;">
            <h2>Panel del Paciente</h2>
            <div style="background: #e9ecef; padding: 15px; border-radius: 5px;">
                <h3>Datos Personales</h3>
                <p><strong>Nombre:</strong> ${paciente.nombre}</p>
                <p><strong>Correo:</strong> ${paciente.correo}</p>
                <p><strong>ID Paciente:</strong> ${paciente.id_paciente}</p>
            </div>
            
            <div style="margin-top: 20px;">
                <h3>Mis Citas</h3>
                
                <!-- BARRA DE FILTROS -->
                <div style="background: #f8f9fa; padding: 10px; border: 1px solid #ddd; margin-bottom: 10px; border-radius: 5px;">
                    <strong>Filtros:</strong> 
                    <select id="filtro-estatus" style="margin-left: 10px; padding: 3px;">
                        <option value="">Todos los estatus</option>
                        <option value="Agendada">Agendadas / Pendientes</option>
                        <option value="Cancelada">Canceladas</option>
                        <option value="Atendida">Atendidas</option>
                    </select>
                    
                    <input type="date" id="filtro-fecha" style="margin-left: 10px; padding: 3px;">
                    
                    <button id="btn-limpiar" style="margin-left: 10px; padding: 4px 8px; cursor:pointer;">Limpiar Filtros</button>
                </div>

                <div id="contenedor-citas">Cargando historial de citas...</div>
            </div>

            <div style="margin-top: 20px; text-align: center;">
                <button onclick="navegar('/agendar')" style="background-color: #28a745;">Agendar Nueva Cita</button>
                <button onclick="cerrarSesion()" class="btn-secundario">Cerrar Sesión</button>
            </div>
        </div>
    `;
};

export const inicializarPaciente = async () => {
    window.cerrarSesion = () => {
        localStorage.removeItem('pacienteSesion');
        window.navegar('/inicio');
    };

    const contenedorCitas = document.getElementById('contenedor-citas');
    const filtroEstatus = document.getElementById('filtro-estatus');
    const filtroFecha = document.getElementById('filtro-fecha');
    const btnLimpiar = document.getElementById('btn-limpiar');
    
    const sesion = JSON.parse(localStorage.getItem('pacienteSesion'));
    if (!sesion) return;

    let todasLasCitas = []; // Guardamos el historial en memoria para filtrar rápido

    // FUNCIÓN: Dibuja la tabla con los datos que le pasemos
    const renderizarTabla = (citasAMostrar) => {
        if (citasAMostrar.length === 0) {
            contenedorCitas.innerHTML = '<p style="padding: 10px; background: #fff3cd; color: #856404; border: 1px solid #ffeeba;">No se encontraron citas con estos filtros.</p>';
            return;
        }

        let tabla = `
            <table border="1" style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead style="background-color: #f2f2f2;">
                    <tr>
                        <th style="padding: 8px;">Folio</th>
                        <th style="padding: 8px;">Especialidad</th>
                        <th style="padding: 8px;">Doctor</th>
                        <th style="padding: 8px;">Fecha</th>
                        <th style="padding: 8px;">Hora</th>
                        <th style="padding: 8px;">Estatus</th>
                        <th style="padding: 8px;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        citasAMostrar.forEach(cita => {
            const fechaLimpia = String(cita.fecha_cita).split('T')[0];
            let horaLimpia = String(cita.hora_cita).includes('T') ? 
                             String(cita.hora_cita).split('T')[1].substring(0, 5) : 
                             String(cita.hora_cita).substring(0, 5);
            
            let contenidoAcciones = '';
            if (cita.estatus_cita.includes('Cancelada Paciente')) {
                contenidoAcciones = '<span style="color: #6c757d; font-size: 14px; font-style: italic;">Cancelada por ti</span>';
            } else if (cita.estatus_cita.includes('Cancelada Doctor')) {
                contenidoAcciones = '<span style="color: #6c757d; font-size: 14px; font-style: italic;">Cancelada por el médico</span>';
            } else if (cita.estatus_cita.includes('Falta de pago')) {
                contenidoAcciones = '<span style="color: #6c757d; font-size: 14px; font-style: italic;">Expiró tiempo de pago</span>';
            } else if (cita.estatus_cita.includes('Atendida')) {
                contenidoAcciones = `<button onclick="verRecetaPaciente('${cita.folio_cita}')" style="background-color: #28a745; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Ver Receta</button>`;
            } else if (cita.estatus_cita.includes('No acudió')) {
                contenidoAcciones = '<span style="color: #dc3545; font-size: 14px; font-style: italic;">Paciente ausente</span>';
            } else {
                contenidoAcciones = `<button onclick="cancelarCitaPaciente('${cita.folio_cita}')" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Cancelar Cita</button>`;
            }

            tabla += `
                <tr>
                    <td style="padding: 8px;">${cita.folio_cita}</td>
                    <td style="padding: 8px;">${cita.nombre_especialidad}</td>
                    <td style="padding: 8px;">${cita.nombre_doctor}</td>
                    <td style="padding: 8px;">${fechaLimpia}</td>
                    <td style="padding: 8px;">${horaLimpia}</td>
                    <td style="padding: 8px;"><b>${cita.estatus_cita}</b></td>
                    <td style="padding: 8px;">${contenidoAcciones}</td>
                </tr>
            `;
        });

        tabla += `</tbody></table>`;
        contenedorCitas.innerHTML = tabla;
    };

    // FUNCIÓN: Lee los filtros y decide qué citas mostrar
    const aplicarFiltros = () => {
        const estatusBuscado = filtroEstatus.value;
        const fechaBuscada = filtroFecha.value;

        const citasFiltradas = todasLasCitas.filter(cita => {
            const fechaLimpia = String(cita.fecha_cita).split('T')[0];
            
            let coincideEstatus = true;
            if (estatusBuscado !== "") {
                coincideEstatus = cita.estatus_cita.includes(estatusBuscado);
            }

            let coincideFecha = true;
            if (fechaBuscada !== "") {
                coincideFecha = (fechaLimpia === fechaBuscada);
            }

            return coincideEstatus && coincideFecha;
        });

        renderizarTabla(citasFiltradas);
    };

    // Escuchadores de eventos para la barra de filtros
    filtroEstatus.addEventListener('change', aplicarFiltros);
    filtroFecha.addEventListener('change', aplicarFiltros);
    
    btnLimpiar.addEventListener('click', () => {
        filtroEstatus.value = "";
        filtroFecha.value = "";
        renderizarTabla(todasLasCitas);
    });

    // Petición al servidor al cargar la página
    try {
        const respuesta = await fetch(`/api/citas/${sesion.id_paciente}`);
        if (!respuesta.ok) throw new Error(`El servidor devolvió código ${respuesta.status}`);

        const datos = await respuesta.json();

        if (datos.exito && datos.citas.length > 0) {
            todasLasCitas = datos.citas; // Guardamos la copia de seguridad
            renderizarTabla(todasLasCitas); // Dibujamos la tabla inicial
        } else {
            contenedorCitas.innerHTML = '<p>No tienes citas registradas en el sistema.</p>';
        }
    } catch (error) {
        console.error("Error exacto detectado:", error);
        contenedorCitas.innerHTML = `<p style="color: red;">Error técnico detectado: ${error.message}</p>`;
    }

    // --- FUNCIÓN GLOBAL PARA CANCELAR LA CITA ---
    window.cancelarCitaPaciente = async (folio) => {
        if (!confirm(`¿Estás seguro de que deseas cancelar la cita con folio ${folio}?`)) return;

        try {
            const respuesta = await fetch(`/api/citas/cancelar/${folio}`, { method: 'PUT' });
            const resultado = await respuesta.json();

            if (resultado.exito) {
                alert(resultado.mensaje);
                navegar('/paciente'); 
            } else {
                alert(resultado.mensaje);
            }
        } catch (error) {
            alert('Error de conexión al intentar cancelar la cita.');
        }
    };
    
    window.verRecetaPaciente = (folio) => {
        localStorage.setItem('folioRecetaActiva', folio);
        window.navegar('/receta');
    };
};