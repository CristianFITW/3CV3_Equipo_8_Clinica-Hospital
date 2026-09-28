export const vistaAtender = () => {
    const citaStr = localStorage.getItem('citaEnAtencion');
    
    if (!citaStr) {
        setTimeout(() => window.navegar('/doctor'), 100);
        return `<h2>Error: No hay paciente seleccionado. Redirigiendo...</h2>`;
    }
    
    const cita = JSON.parse(citaStr);

    return `
        <div style="width: 900px; text-align: left;">
            <h2>Atendiendo a: <span style="color: #0056b3;">${cita.nombre_paciente}</span></h2>
            <p><strong>Folio de Cita:</strong> ${cita.folio_cita}</p>

            <div style="display: flex; gap: 20px; margin-top: 20px;">
                <!-- COLUMNA IZQUIERDA: HISTORIAL MÉDICO -->
                <div style="flex: 1; background: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
                    <h3>📝 Historial Médico</h3>
                    <form id="form-historial">
                        <label>Alergias:</label><br>
                        <input type="text" id="alergias" style="width: 100%; margin-bottom: 10px;">
                        
                        <label>Tipo de Sangre:</label><br>
                        <input type="text" id="tipo_sangre" style="width: 100%; margin-bottom: 10px;">
                        
                        <label>Padecimientos Previos:</label><br>
                        <input type="text" id="padecimientos" style="width: 100%; margin-bottom: 10px;">
                        
                        <div style="display: flex; gap: 10px;">
                            <div style="flex: 1;">
                                <label>Peso (kg):</label><br>
                                <input type="number" step="0.01" id="peso" style="width: 100%; margin-bottom: 10px;">
                            </div>
                            <div style="flex: 1;">
                                <label>Estatura (m):</label><br>
                                <input type="number" step="0.01" id="estatura" style="width: 100%; margin-bottom: 10px;">
                            </div>
                        </div>
                        
                        <button type="submit" style="background-color: #17a2b8; color: white; border: none; padding: 10px; width: 100%; cursor: pointer;">Guardar Historial</button>
                    </form>
                </div>

                <!-- COLUMNA DERECHA: RECETA -->
                <div style="flex: 1; background: #e9ecef; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
                    <h3>💊 Emitir Receta</h3>
                    <form id="form-receta">
                        <label>Edad del Paciente:</label><br>
                        <input type="number" id="edad" required style="width: 100%; margin-bottom: 10px;">
                        
                        <label>Diagnóstico:</label><br>
                        <textarea id="diagnostico" required style="width: 100%; height: 40px; margin-bottom: 10px;"></textarea>
                        
                        <label>Medicamentos (Fórmula y Dosis):</label><br>
                        <textarea id="medicamentos" required style="width: 100%; height: 40px; margin-bottom: 10px;"></textarea>
                        
                        <label>Tratamientos / Indicaciones:</label><br>
                        <textarea id="tratamientos" required style="width: 100%; height: 40px; margin-bottom: 10px;"></textarea>
                        
                        <label>Observaciones Adicionales:</label><br>
                        <textarea id="observaciones" style="width: 100%; height: 40px; margin-bottom: 10px;"></textarea>
                        
                        <button type="submit" style="background-color: #28a745; color: white; border: none; padding: 10px; width: 100%; cursor: pointer;">Finalizar y Generar Receta</button>
                    </form>
                </div>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="navegar('/doctor')" class="btn-secundario">Cancelar y volver a la agenda</button>
            </div>
        </div>
    `;
};

export const inicializarAtender = () => {
    const cita = JSON.parse(localStorage.getItem('citaEnAtencion'));
    const doctor = JSON.parse(localStorage.getItem('doctorSesion'));
    
    if (!cita || !doctor) return;

    // LOGICA PARA GUARDAR EL HISTORIAL
    const formHistorial = document.getElementById('form-historial');
    formHistorial.addEventListener('submit', async (e) => {
        e.preventDefault();
        const datos = {
            id_paciente: cita.id_paciente,
            nombre_paciente: cita.nombre_paciente,
            alergias: document.getElementById('alergias').value,
            tipo_sangre: document.getElementById('tipo_sangre').value,
            padecimientos_previos: document.getElementById('padecimientos').value,
            peso: document.getElementById('peso').value || 0,
            estatura: document.getElementById('estatura').value || 0
        };

        try {
            const res = await fetch('/api/historial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            const json = await res.json();
            alert(json.mensaje);
        } catch (error) {
            alert("Error al conectar con el servidor.");
        }
    });

    // LOGICA PARA GENERAR LA RECETA Y FINALIZAR
    const formReceta = document.getElementById('form-receta');
    formReceta.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!confirm("Al emitir la receta la consulta se marcará como Atendida. ¿Deseas continuar?")) return;

        const datos = {
            folio_cita: cita.folio_cita,
            nombre_doctor: doctor.nombre,
            cedula_profesional: doctor.cedula_profesional,
            nombre_paciente: cita.nombre_paciente,
            edad: document.getElementById('edad').value,
            diagnostico: document.getElementById('diagnostico').value,
            medicamentos: document.getElementById('medicamentos').value,
            tratamientos: document.getElementById('tratamientos').value,
            observaciones: document.getElementById('observaciones').value
        };

        try {
            const res = await fetch('/api/recetas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            const json = await res.json();
            
            if (json.exito) {
                alert(`¡Éxito! ${json.mensaje}\nFolio de Receta: ${json.folio_receta}`);
                window.navegar('/doctor'); // Devuelve al doctor a su panel
            } else {
                alert(json.mensaje);
            }
        } catch (error) {
            alert("Error al conectar con el servidor.");
        }
    });
};