export const vistaBitacoras = () => {
    const sesion = localStorage.getItem('adminSesion');
    if (!sesion) {
        setTimeout(() => window.navegar('/login'), 100);
        return `<h2>Acceso denegado.</h2>`;
    }

    return `
        <div style="width: 900px; text-align: left; margin: 0 auto;">
            <h2>📋 Bitácoras del Sistema</h2>
            <p>Registro histórico de seguridad, movimientos y eventos de la plataforma.</p>
            
            <div id="tabla-bitacoras" style="background: #fff; padding: 15px; border-radius: 5px; border: 1px solid #ddd; max-height: 500px; overflow-y: auto;">
                Cargando registros...
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="window.navegar('/admin')" class="btn-secundario">Volver al Panel Principal</button>
            </div>
        </div>
    `;
};

export const inicializarBitacoras = async () => {
    const contenedor = document.getElementById('tabla-bitacoras');
    
    try {
        const res = await fetch('/api/bitacoras');
        const datos = await res.json();

        if (datos.exito && datos.bitacoras.length > 0) {
            let html = `
                <table border="1" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
                    <thead style="background-color: #343a40; color: white; position: sticky; top: 0;">
                        <tr>
                            <th style="padding: 10px;">ID</th>
                            <th style="padding: 10px;">Fecha y Hora</th>
                            <th style="padding: 10px;">Usuario Responsable</th>
                            <th style="padding: 10px;">Acción</th>
                            <th style="padding: 10px;">Detalles</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            datos.bitacoras.forEach(b => {
                // Formateamos la fecha para que se vea legible
                const fechaLimpia = String(b.fecha_hora).replace('T', ' ').substring(0, 19);
                html += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 8px;">${b.id_bitacora}</td>
                        <td style="padding: 8px; color: #555;">${fechaLimpia}</td>
                        <td style="padding: 8px;"><strong>${b.usuario}</strong></td>
                        <td style="padding: 8px;"><span style="background: #e9ecef; padding: 3px 6px; border-radius: 3px;">${b.accion}</span></td>
                        <td style="padding: 8px;">${b.detalles}</td>
                    </tr>
                `;
            });
            
            html += `</tbody></table>`;
            contenedor.innerHTML = html;
        } else {
            contenedor.innerHTML = '<p>No hay registros en la bitácora aún.</p>';
        }
    } catch (error) {
        contenedor.innerHTML = '<p style="color:red;">Error de conexión con el servidor.</p>';
    }
};