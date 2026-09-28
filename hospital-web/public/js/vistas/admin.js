export const vistaAdmin = () => {
    const sesion = localStorage.getItem('adminSesion');
    
    if (!sesion) {
        setTimeout(() => window.navegar('/login'), 100);
        return `<h2>Acceso denegado. Redirigiendo...</h2>`;
    }

    const admin = JSON.parse(sesion);

    return `
        <div style="width: 800px; text-align: left; margin: 0 auto;">
            <h2>Panel de Recepción / Administración</h2>
            <div style="background: #e2e3e5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <p style="margin: 0;">Usuario activo: <strong>${admin.nombre}</strong> (ID: ${admin.numero_empleado})</p>
            </div>

            <h3>Módulos del Sistema</h3>
            <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                <button onclick="window.navegar('/admin/alta-doctor')" style="flex: 1; padding: 20px; font-size: 16px; background-color: #0056b3; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    👨‍⚕️ Dar de Alta a Médico
                </button>
                <button onclick="window.navegar('/admin/farmacia')" style="flex: 1; padding: 20px; font-size: 16px; background-color: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    💊 Inventario Farmacia
                </button>
            </div>

            <div style="display: flex; gap: 15px;">
                <button onclick="window.navegar('/admin/cobros')" style="flex: 1; padding: 20px; font-size: 16px; background-color: #ffc107; color: black; border: none; border-radius: 8px; cursor: pointer;">
                    💳 Cobrar Servicios Extras
                </button>
                <button onclick="window.navegar('/admin/bitacoras')" style="flex: 1; padding: 20px; font-size: 16px; background-color: #17a2b8; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    📋 Ver Bitácoras
                </button>
            </div>

            <div style="margin-top: 30px; text-align: center;">
                <button onclick="cerrarSesionAdmin()" class="btn-secundario">Cerrar Sesión</button>
            </div>
        </div>
    `;
};

export const inicializarAdmin = () => {
    window.cerrarSesionAdmin = () => {
        localStorage.removeItem('adminSesion');
        window.navegar('/inicio');
    };
};