export const vistaFarmacia = () => {
    const sesion = localStorage.getItem('adminSesion');
    if (!sesion) {
        setTimeout(() => window.navegar('/login'), 100);
        return `<h2>Acceso denegado.</h2>`;
    }

    return `
        <div style="width: 900px; text-align: left; margin: 0 auto;">
            <h2>💊 Inventario de Farmacia</h2>
            
            <!-- Formulario para agregar nuevos medicamentos -->
            <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #ddd;">
                <h3>➕ Agregar Nuevo Medicamento</h3>
                <form id="form-nuevo-med" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <input type="text" id="nuevo-codigo" placeholder="Código (Ej. MED-004)" required style="flex: 1; padding: 5px;">
                    <input type="text" id="nuevo-nombre" placeholder="Nombre (Ej. Aspirina)" required style="flex: 2; padding: 5px;">
                    <input type="text" id="nuevo-desc" placeholder="Descripción" required style="flex: 2; padding: 5px;">
                    <input type="number" step="0.01" id="nuevo-precio" placeholder="Precio $" required style="flex: 1; padding: 5px;">
                    <input type="number" id="nuevo-stock" placeholder="Stock" required style="flex: 1; padding: 5px;">
                    <button type="submit" style="background-color: #28a745; color: white; border: none; padding: 5px 15px; cursor: pointer;">Agregar</button>
                </form>
            </div>

            <!-- Tabla de Inventario Actual -->
            <div id="contenedor-inventario">Cargando inventario...</div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="window.navegar('/admin')" class="btn-secundario">Volver al Panel Principal</button>
            </div>
        </div>
    `;
};

export const inicializarFarmacia = async () => {
    const contenedor = document.getElementById('contenedor-inventario');
    const formNuevo = document.getElementById('form-nuevo-med');

    // Función para dibujar la tabla
    const cargarInventario = async () => {
        try {
            const respuesta = await fetch('/api/farmacia');
            const datos = await respuesta.json();

            if (datos.exito && datos.medicamentos.length > 0) {
                let tabla = `
                    <table border="1" style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead style="background-color: #f2f2f2;">
                            <tr>
                                <th style="padding: 8px;">Código</th>
                                <th style="padding: 8px;">Medicamento</th>
                                <th style="padding: 8px;">Descripción</th>
                                <th style="padding: 8px;">Precio Unitario ($)</th>
                                <th style="padding: 8px;">Stock Actual</th>
                                <th style="padding: 8px;">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                datos.medicamentos.forEach(med => {
                    // Los inputs van directo en la tabla para editarlos fácil
                    tabla += `
                        <tr>
                            <td style="padding: 8px;">${med.codigo_barras}</td>
                            <td style="padding: 8px;"><strong>${med.nombre_medicamento}</strong></td>
                            <td style="padding: 8px; font-size: 13px;">${med.descripcion}</td>
                            <td style="padding: 8px;">
                                $<input type="number" step="0.01" id="precio-${med.id_medicamento}" value="${med.precio_unitario}" style="width: 70px;">
                            </td>
                            <td style="padding: 8px;">
                                <input type="number" id="stock-${med.id_medicamento}" value="${med.stock_actual}" style="width: 60px;"> pzs
                            </td>
                            <td style="padding: 8px;">
                                <button onclick="actualizarMedicamento(${med.id_medicamento})" style="background-color: #ffc107; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Guardar Cambios</button>
                            </td>
                        </tr>
                    `;
                });

                tabla += `</tbody></table>`;
                contenedor.innerHTML = tabla;
            } else {
                contenedor.innerHTML = '<p>El inventario está vacío.</p>';
            }
        } catch (error) {
            contenedor.innerHTML = `<p style="color: red;">Error al cargar inventario.</p>`;
        }
    };

    // Cargar la tabla al entrar a la pantalla
    cargarInventario();

    // Guardar nuevo medicamento
    formNuevo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const datos = {
            codigo_barras: document.getElementById('nuevo-codigo').value,
            nombre_medicamento: document.getElementById('nuevo-nombre').value,
            descripcion: document.getElementById('nuevo-desc').value,
            precio_unitario: document.getElementById('nuevo-precio').value,
            stock_actual: document.getElementById('nuevo-stock').value
        };

        try {
            const res = await fetch('/api/farmacia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            const json = await res.json();
            if (json.exito) {
                alert(json.mensaje);
                formNuevo.reset();
                cargarInventario(); // Recargamos la tabla para que aparezca
            } else {
                alert(json.mensaje);
            }
        } catch (error) {
            alert('Error de conexión.');
        }
    });

    // Función global para el botón "Guardar Cambios" de cada fila
    window.actualizarMedicamento = async (id) => {
        const nuevoPrecio = document.getElementById(`precio-${id}`).value;
        const nuevoStock = document.getElementById(`stock-${id}`).value;

        try {
            const res = await fetch(`/api/farmacia/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ precio_unitario: nuevoPrecio, stock_actual: nuevoStock })
            });
            const json = await res.json();
            alert(json.mensaje);
        } catch (error) {
            alert('Error al actualizar.');
        }
    };
};