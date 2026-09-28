export const vistaReceta = () => {
    return `
        <div style="width: 700px; text-align: left; margin: 0 auto; background: #fff; padding: 30px; border: 1px solid #ccc; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="color: #0056b3; margin: 0;">🏥 HospitalESCOM</h1>
                <p style="margin: 5px 0;"><strong>Receta Médica Oficial</strong></p>
            </div>
            
            <div id="contenido-receta">Cargando datos de la receta...</div>

            <div style="margin-top: 30px; text-align: center;" id="botones-receta">
                <button onclick="window.print()" style="background-color: #17a2b8; color: white; padding: 10px 20px; border: none; cursor: pointer; border-radius: 5px;">🖨️ Imprimir Receta</button>
                <button onclick="navegar('/paciente')" class="btn-secundario" style="margin-left: 10px;">Volver a mi panel</button>
            </div>
        </div>
    `;
};

export const inicializarReceta = async () => {
    const folioCita = localStorage.getItem('folioRecetaActiva');
    const contenedor = document.getElementById('contenido-receta');

    if (!folioCita) {
        contenedor.innerHTML = '<p style="color: red;">Error: No se especificó ninguna cita.</p>';
        return;
    }

    try {
        const res = await fetch(`/api/receta/${folioCita}`);
        const datos = await res.json();

        if (datos.exito) {
            const r = datos.receta;
            // Damos formato a la fecha
            const fechaLimpia = String(r.fecha).split('T')[0];

            contenedor.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <div>
                        <p style="margin: 3px 0;"><strong>Paciente:</strong> ${r.nombre_paciente}</p>
                        <p style="margin: 3px 0;"><strong>Edad:</strong> ${r.edad} años</p>
                        <p style="margin: 3px 0;"><strong>Fecha:</strong> ${fechaLimpia}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 3px 0;"><strong>Médico:</strong> ${r.nombre_doctor}</p>
                        <p style="margin: 3px 0;"><strong>Cédula:</strong> ${r.cedula_profesional}</p>
                        <p style="margin: 3px 0;"><strong>Folio Receta:</strong> ${r.folio_receta}</p>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #eee; margin-bottom: 15px;">
                    <h4 style="margin-top: 0; color: #333;">🩺 Diagnóstico:</h4>
                    <p style="margin-bottom: 0;">${r.diagnostico}</p>
                </div>

                <div style="background: #e9ecef; padding: 15px; border-radius: 5px; border: 1px solid #eee; margin-bottom: 15px;">
                    <h4 style="margin-top: 0; color: #333;">💊 Medicamentos (Fórmula y Dosis):</h4>
                    <p style="margin-bottom: 0; white-space: pre-wrap;">${r.medicamentos}</p>
                </div>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #eee; margin-bottom: 15px;">
                    <h4 style="margin-top: 0; color: #333;">📋 Tratamientos / Indicaciones:</h4>
                    <p style="margin-bottom: 0; white-space: pre-wrap;">${r.tratamientos}</p>
                </div>

                <div style="padding: 15px;">
                    <h4 style="margin-top: 0; color: #666;">📌 Observaciones adicionales:</h4>
                    <p style="margin-bottom: 0;">${r.observaciones}</p>
                </div>
                
                <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                    <p style="border-top: 1px solid #000; display: inline-block; padding-top: 5px; width: 250px;">Firma del Médico</p>
                </div>
            `;
        } else {
            contenedor.innerHTML = `<p style="color: red;">${datos.mensaje}</p>`;
        }
    } catch (error) {
        contenedor.innerHTML = `<p style="color: red;">Error al conectar con el servidor.</p>`;
    }
};