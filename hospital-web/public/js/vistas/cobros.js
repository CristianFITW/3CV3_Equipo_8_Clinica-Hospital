export const vistaCobros = () => {
    const sesion = localStorage.getItem('adminSesion');
    if (!sesion) {
        setTimeout(() => window.navegar('/login'), 100);
        return `<h2>Acceso denegado.</h2>`;
    }

    return `
        <div style="width: 800px; text-align: left; margin: 0 auto;">
            <h2>💳 Cobro de Servicios Extras</h2>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #ffeeba;">
                <h3>Realizar Nuevo Cobro</h3>
                <form id="form-cobro">
                    <label>Seleccionar Paciente (Cita):</label><br>
                    <select id="select-cita" required style="width: 100%; padding: 8px; margin-bottom: 10px;">
                        <option value="" disabled selected>Cargando pacientes...</option>
                    </select><br>

                    <label>Concepto del cobro (Ej. Radiografía, Suturas, Examen de sangre):</label><br>
                    <input type="text" id="concepto-cobro" required style="width: 100%; padding: 8px; margin-bottom: 10px;"><br>

                    <label>Monto a cobrar ($ MXN):</label><br>
                    <input type="number" step="0.01" id="monto-cobro" required style="width: 100%; padding: 8px; margin-bottom: 15px;"><br>

                    <button type="submit" style="background-color: #ffc107; color: black; border: none; padding: 10px 20px; font-weight: bold; cursor: pointer; border-radius: 5px; width: 100%;">Registrar Pago en Caja</button>
                </form>
            </div>

            <h3>Historial de Ingresos Extras</h3>
            <div id="tabla-cobros">Cargando historial...</div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="window.navegar('/admin')" class="btn-secundario">Volver al Panel Principal</button>
            </div>
        </div>
    `;
};

export const inicializarCobros = async () => {
    const selectCita = document.getElementById('select-cita');
    const formCobro = document.getElementById('form-cobro');
    const tablaCobros = document.getElementById('tabla-cobros');

    // 1. Cargar lista de pacientes
    try {
        const resCitas = await fetch('/api/citas-cobros');
        const datosCitas = await resCitas.json();
        if (datosCitas.exito) {
            selectCita.innerHTML = '<option value="" disabled selected>Selecciona a quién cobrarle...</option>';
            datosCitas.citas.forEach(c => {
                selectCita.innerHTML += `<option value="${c.folio_cita}|${c.nombre_paciente}">${c.folio_cita} - ${c.nombre_paciente}</option>`;
            });
        }
    } catch (error) {
        selectCita.innerHTML = '<option value="">Error al cargar</option>';
    }

    // 2. Función para cargar el historial de cobros abajo
    const cargarHistorial = async () => {
        try {
            const res = await fetch('/api/cobros-extras');
            const datos = await res.json();
            if (datos.exito && datos.cobros.length > 0) {
                let html = `
                    <table border="1" style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead style="background-color: #f2f2f2;">
                            <tr>
                                <th style="padding: 8px;">ID Cobro</th>
                                <th style="padding: 8px;">Fecha</th>
                                <th style="padding: 8px;">Paciente (Folio)</th>
                                <th style="padding: 8px;">Concepto</th>
                                <th style="padding: 8px;">Monto Ingresado</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                datos.cobros.forEach(cobro => {
                    const fecha = String(cobro.fecha_cobro).split('T')[0];
                    html += `
                        <tr>
                            <td style="padding: 8px;">#${cobro.id_cobro}</td>
                            <td style="padding: 8px;">${fecha}</td>
                            <td style="padding: 8px;">${cobro.nombre_paciente} <small>(${cobro.folio_cita})</small></td>
                            <td style="padding: 8px;">${cobro.concepto}</td>
                            <td style="padding: 8px; color: green; font-weight: bold;">$${cobro.monto}</td>
                        </tr>
                    `;
                });
                html += `</tbody></table>`;
                tablaCobros.innerHTML = html;
            } else {
                tablaCobros.innerHTML = '<p>Aún no hay cobros extras registrados.</p>';
            }
        } catch (error) {
            tablaCobros.innerHTML = '<p style="color:red;">Error al cargar historial.</p>';
        }
    };

    cargarHistorial();

    // 3. Registrar el nuevo cobro
    formCobro.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Separamos el folio y el nombre que vienen juntos en el select
        const valorSelect = selectCita.value.split('|'); 
        
        const datos = {
            folio_cita: valorSelect[0],
            nombre_paciente: valorSelect[1],
            concepto: document.getElementById('concepto-cobro').value,
            monto: document.getElementById('monto-cobro').value
        };

        try {
            const res = await fetch('/api/cobros-extras', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            const json = await res.json();
            if (json.exito) {
                alert(json.mensaje);
                formCobro.reset();
                cargarHistorial(); // Refrescamos la tabla para ver el dinero que acaba de entrar
            } else {
                alert(json.mensaje);
            }
        } catch (error) {
            alert('Error al procesar el pago.');
        }
    });
};