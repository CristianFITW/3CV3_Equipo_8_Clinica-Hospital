const express = require('express');
const path = require('path');
const { sql, conectarDB } = require('./src/config/db.js'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/estado', (req, res) => {
    res.json({ estatus: 'OK', mensaje: 'Servidor del hospital funcionando correctamente' });
});

app.post('/api/registro-paciente', async (req, res) => {
    const { nombre, edad, correo, telefono, contrasena } = req.body;
    try {
        const pool = await conectarDB();
        await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('edad', sql.Int, edad)
            .input('correo', sql.VarChar, correo)
            .input('telefono', sql.VarChar, telefono)
            .input('contrasena', sql.VarChar, contrasena)
            .query(`
                INSERT INTO Pacientes (nombre, edad, correo, telefono, contrasena) 
                VALUES (@nombre, @edad, @correo, @telefono, @contrasena)
            `);
        res.status(201).json({ exito: true, mensaje: 'Paciente registrado exitosamente' });
    } catch (error) {
        console.error('Error al registrar paciente:', error.message);
        if (error.number === 2627) {
            return res.status(400).json({ exito: false, mensaje: 'El correo electrónico ya se encuentra registrado.' });
        }
        res.status(500).json({ exito: false, mensaje: 'Error interno en el servidor' });
    }
});

app.post('/api/login', async (req, res) => {
    const { usuario, contrasena } = req.body; 
    try {
        const pool = await conectarDB();
        
        // 1. Buscamos primero si es un PACIENTE
        let resultado = await pool.request()
            .input('usuario', sql.VarChar, usuario)
            .input('contrasena', sql.VarChar, contrasena)
            .query(`
                SELECT id_paciente, nombre, correo, 'paciente' AS rol 
                FROM Pacientes 
                WHERE correo = @usuario AND contrasena = @contrasena
            `);

        if (resultado.recordset.length > 0) {
            const paciente = resultado.recordset[0];
            return res.status(200).json({ exito: true, mensaje: `¡Bienvenido, ${paciente.nombre}!`, usuario: paciente, rol: 'paciente' });
        }

        // 2. Buscamos si es un DOCTOR
        resultado = await pool.request()
            .input('usuario', sql.VarChar, usuario)
            .input('contrasena', sql.VarChar, contrasena)
            .query(`
                SELECT d.id_doctor, d.numero_empleado, d.nombre, d.cedula_profesional, d.curp, e.nombre_especialidad, 'doctor' AS rol 
                FROM Doctores d
                INNER JOIN Especialidades e ON d.id_especialidad = e.id_especialidad
                WHERE d.numero_empleado = @usuario AND d.contrasena = @contrasena
            `);

        if (resultado.recordset.length > 0) {
            const doctor = resultado.recordset[0];
            return res.status(200).json({ exito: true, mensaje: `¡Bienvenido, Dr(a). ${doctor.nombre}!`, usuario: doctor, rol: 'doctor' });
        }

        // 3. NUEVO: Buscamos si es un ADMINISTRADOR / RECEPCIÓN
        resultado = await pool.request()
            .input('usuario', sql.VarChar, usuario)
            .input('contrasena', sql.VarChar, contrasena)
            .query(`
                SELECT id_admin, numero_empleado, nombre, 'admin' AS rol 
                FROM Administradores 
                WHERE numero_empleado = @usuario AND contrasena = @contrasena
            `);

        if (resultado.recordset.length > 0) {
            const admin = resultado.recordset[0];
            return res.status(200).json({ exito: true, mensaje: `¡Acceso autorizado: ${admin.nombre}!`, usuario: admin, rol: 'admin' });
        }

        // Si no encontró nada en ninguna de las 3 tablas
        res.status(401).json({ exito: false, mensaje: 'Credenciales incorrectas' });
        
    } catch (error) {
        console.error('Error en login:', error.message);
        res.status(500).json({ exito: false, mensaje: 'Error interno en el servidor' });
    }
});

app.get('/api/especialidades', async (req, res) => {
    try {
        const pool = await conectarDB();
        const resultado = await pool.request().query('SELECT id_especialidad, nombre_especialidad, costo_consulta FROM Especialidades');
        res.status(200).json({ exito: true, especialidades: resultado.recordset });
    } catch (error) {
        console.error('Error al obtener especialidades:', error.message);
        res.status(500).json({ exito: false, mensaje: 'Error interno en el servidor' });
    }
});

app.get('/api/doctores/:id_especialidad', async (req, res) => {
    const { id_especialidad } = req.params;
    try {
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id_especialidad', sql.Int, id_especialidad)
            .query(`
                SELECT id_doctor, nombre, hora_inicio, hora_fin 
                FROM Doctores 
                WHERE id_especialidad = @id_especialidad AND estado_activo = 1
            `);
        res.status(200).json({ exito: true, doctores: resultado.recordset });
    } catch (error) {
        console.error('Error al obtener doctores:', error.message);
        res.status(500).json({ exito: false, mensaje: 'Error interno en el servidor' });
    }
});

app.post('/api/agendar-cita', async (req, res) => {
    const { id_paciente, id_doctor, fecha, hora } = req.body;
    const folio = 'CIT-' + Date.now().toString().slice(-6);

    try {
        const pool = await conectarDB();
        const validacion = await pool.request()
            .input('id_paciente', sql.Int, id_paciente)
            .input('id_doctor', sql.Int, id_doctor)
            .input('fecha', sql.VarChar, fecha)
            .input('hora', sql.VarChar, hora)
            .query(`
                DECLARE @HoraInicio TIME = CAST(@hora AS TIME);
                DECLARE @HoraFin TIME = DATEADD(minute, 90, @HoraInicio);

                SELECT TOP 1 'Doctor Ocupado' AS Motivo 
                FROM Citas 
                WHERE id_doctor = @id_doctor 
                  AND fecha_cita = @fecha 
                  AND estatus_cita NOT LIKE 'Cancelada%'
                  AND (
                      @HoraInicio < DATEADD(minute, 90, CAST(hora_cita AS TIME)) 
                      AND 
                      @HoraFin > CAST(hora_cita AS TIME)
                  )
                
                UNION ALL
                
                SELECT TOP 1 'Paciente Ocupado' AS Motivo 
                FROM Citas 
                WHERE id_paciente = @id_paciente 
                  AND fecha_cita = @fecha 
                  AND estatus_cita NOT LIKE 'Cancelada%'
                  AND (
                      @HoraInicio < DATEADD(minute, 90, CAST(hora_cita AS TIME)) 
                      AND 
                      @HoraFin > CAST(hora_cita AS TIME)
                  )
            `);

        if (validacion.recordset.length > 0) {
            const motivo = validacion.recordset[0].Motivo;
            if (motivo === 'Doctor Ocupado') {
                return res.status(400).json({ 
                    exito: false, 
                    mensaje: 'Error: El doctor ya tiene una consulta que choca con este horario (las citas duran 1 hora y media).' 
                });
            } else {
                return res.status(400).json({ 
                    exito: false, 
                    mensaje: 'Error: Ya tienes otra cita agendada en el hospital que se empalma con este horario.' 
                });
            }
        }

        await pool.request()
            .input('folio', sql.VarChar, folio)
            .input('id_paciente', sql.Int, id_paciente)
            .input('id_doctor', sql.Int, id_doctor)
            .input('fecha', sql.VarChar, fecha)
            .input('hora', sql.VarChar, hora)
            .query(`
                INSERT INTO Citas (folio_cita, id_paciente, id_doctor, fecha_cita, hora_cita, fecha_limite_pago)
                VALUES (@folio, @id_paciente, @id_doctor, @fecha, @hora, DATEADD(hour, 8, GETDATE()))
            `);

        res.status(201).json({ 
            exito: true, 
            mensaje: `Cita agendada (Folio: ${folio}). Tienes 8 hrs para realizar el pago.` 
        });
    } catch (error) {
        console.error('Error al guardar la cita:', error.message);
        res.status(500).json({ exito: false, mensaje: 'Error interno en el servidor' });
    }
});

// --- RUTA RECUPERADA PARA OBTENER EL HISTORIAL DE CITAS ---
app.get('/api/citas/:id_paciente', async (req, res) => {
    const { id_paciente } = req.params;
    try {
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id_paciente', sql.Int, id_paciente)
            .query(`
                SELECT c.folio_cita, c.fecha_cita, c.hora_cita, c.estatus_cita, 
                       d.nombre AS nombre_doctor, e.nombre_especialidad
                FROM Citas c
                INNER JOIN Doctores d ON c.id_doctor = d.id_doctor
                INNER JOIN Especialidades e ON d.id_especialidad = e.id_especialidad
                WHERE c.id_paciente = @id_paciente
                ORDER BY c.fecha_cita DESC, c.hora_cita DESC
            `);
        res.status(200).json({ exito: true, citas: resultado.recordset });
    } catch (error) {
        console.error('Error al obtener historial:', error.message);
        res.status(500).json({ exito: false, mensaje: 'Error interno en el servidor' });
    }
});

// --- RUTA PARA CANCELAR CITA (PACIENTE) ---
app.put('/api/citas/cancelar/:folio', async (req, res) => {
    const { folio } = req.params;
    try {
        const pool = await conectarDB();
        
        // Actualizamos el estatus de la cita
        const resultado = await pool.request()
            .input('folio', sql.VarChar, folio)
            .query(`
                UPDATE Citas 
                SET estatus_cita = 'Cancelada Paciente'
                WHERE folio_cita = @folio AND estatus_cita NOT LIKE 'Cancelada%'
            `);

        if (resultado.rowsAffected[0] > 0) {
            res.status(200).json({ exito: true, mensaje: 'Cita cancelada correctamente.' });
        } else {
            res.status(400).json({ exito: false, mensaje: 'La cita no se pudo cancelar o ya estaba cancelada.' });
        }
    } catch (error) {
        console.error('Error al cancelar cita:', error.message);
        res.status(500).json({ exito: false, mensaje: 'Error interno en el servidor' });
    }
});

// --- OBTENER AGENDA DEL DOCTOR ---
app.get('/api/citas-doctor/:id_doctor', async (req, res) => {
    const { id_doctor } = req.params;
    try {
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id_doctor', sql.Int, id_doctor)
            .query(`
                SELECT c.folio_cita, c.fecha_cita, c.hora_cita, c.estatus_cita, 
                       p.nombre AS nombre_paciente, p.id_paciente
                FROM Citas c
                INNER JOIN Pacientes p ON c.id_paciente = p.id_paciente
                WHERE c.id_doctor = @id_doctor
                ORDER BY c.fecha_cita ASC, c.hora_cita ASC
            `);
        res.status(200).json({ exito: true, citas: resultado.recordset });
    } catch (error) {
        console.error('Error al obtener agenda del doctor:', error.message);
        res.status(500).json({ exito: false, mensaje: 'Error interno en el servidor' });
    }
});

// --- GUARDAR HISTORIAL MÉDICO ---
app.post('/api/historial', async (req, res) => {
    const { id_paciente, nombre_paciente, alergias, tipo_sangre, padecimientos_previos, peso, estatura } = req.body;
    try {
        const pool = await conectarDB();
        await pool.request()
            .input('id_paciente', sql.Int, id_paciente)
            .input('nombre_paciente', sql.VarChar, nombre_paciente)
            .input('alergias', sql.VarChar, alergias)
            .input('tipo_sangre', sql.VarChar, tipo_sangre)
            .input('padecimientos_previos', sql.VarChar, padecimientos_previos)
            .input('peso', sql.Decimal(5,2), peso)
            .input('estatura', sql.Decimal(4,2), estatura)
            .query(`
                INSERT INTO Historial_Medico (id_paciente, nombre_paciente, alergias, tipo_sangre, padecimientos_previos, peso, estatura)
                VALUES (@id_paciente, @nombre_paciente, @alergias, @tipo_sangre, @padecimientos_previos, @peso, @estatura)
            `);
        res.status(200).json({ exito: true, mensaje: 'Historial guardado correctamente en el expediente.' });
    } catch (error) {
        console.error('Error al guardar historial:', error.message);
        res.status(500).json({ exito: false, mensaje: 'Error al guardar el historial médico.' });
    }
});

// --- GUARDAR RECETA Y FINALIZAR CONSULTA ---
app.post('/api/recetas', async (req, res) => {
    const { folio_cita, nombre_doctor, cedula_profesional, nombre_paciente, edad, diagnostico, medicamentos, tratamientos, observaciones } = req.body;
    const folio_receta = 'REC-' + Date.now().toString().slice(-6);
    const fecha = new Date().toISOString().split('T')[0];

    try {
        const pool = await conectarDB();
        
        await pool.request()
            .input('folio_receta', sql.VarChar, folio_receta)
            .input('folio_cita', sql.VarChar, folio_cita)
            .input('fecha', sql.VarChar, fecha)
            .input('nombre_doctor', sql.VarChar, nombre_doctor)
            .input('cedula_profesional', sql.VarChar, String(cedula_profesional))
            .input('nombre_paciente', sql.VarChar, nombre_paciente)
            .input('edad', sql.Int, parseInt(edad))
            // CAMBIO CLAVE: Cambiamos sql.Text a sql.VarChar para que SQL Server no lo rechace
            .input('diagnostico', sql.VarChar, diagnostico)
            .input('medicamentos', sql.VarChar, medicamentos)
            .input('tratamientos', sql.VarChar, tratamientos)
            .input('observaciones', sql.VarChar, observaciones || 'Ninguna')
            .query(`
                INSERT INTO Recetas (folio_receta, folio_cita, fecha, nombre_doctor, cedula_profesional, nombre_paciente, edad, diagnostico, medicamentos, tratamientos, observaciones)
                VALUES (@folio_receta, @folio_cita, @fecha, @nombre_doctor, @cedula_profesional, @nombre_paciente, @edad, @diagnostico, @medicamentos, @tratamientos, @observaciones);
                
                UPDATE Citas 
                SET estatus_cita = 'Atendida' 
                WHERE folio_cita = @folio_cita;
            `);

        res.status(200).json({ exito: true, mensaje: 'Consulta finalizada. Receta generada con éxito.', folio_receta });
    } catch (error) {
        console.error('Error al generar receta:', error.message);
        res.status(500).json({ exito: false, mensaje: 'Error al generar la receta médica.' });
    }
});

// --- OBTENER RECETA POR FOLIO DE CITA ---
app.get('/api/receta/:folio_cita', async (req, res) => {
    const { folio_cita } = req.params;
    try {
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('folio_cita', sql.VarChar, folio_cita)
            .query(`SELECT * FROM Recetas WHERE folio_cita = @folio_cita`);
            
        if (resultado.recordset.length > 0) {
            res.status(200).json({ exito: true, receta: resultado.recordset[0] });
        } else {
            res.status(404).json({ exito: false, mensaje: 'Receta no encontrada.' });
        }
    } catch (error) {
        console.error('Error al obtener receta:', error.message);
        res.status(500).json({ exito: false, mensaje: 'Error interno en el servidor.' });
    }
});

// --- DAR DE ALTA A NUEVO DOCTOR (ADMINISTRADOR) ---
app.post('/api/registro-doctor', async (req, res) => {
    const { numero_empleado, nombre, cedula_profesional, curp, id_especialidad, hora_inicio, hora_fin, contrasena } = req.body;
    
    try {
        const pool = await conectarDB();
        await pool.request()
            .input('numero_empleado', sql.VarChar, numero_empleado)
            .input('nombre', sql.VarChar, nombre)
            .input('cedula_profesional', sql.VarChar, cedula_profesional)
            .input('curp', sql.VarChar, curp)
            .input('id_especialidad', sql.Int, parseInt(id_especialidad))
            .input('hora_inicio', sql.Time, hora_inicio)
            .input('hora_fin', sql.Time, hora_fin)
            .input('contrasena', sql.VarChar, contrasena)
            .query(`
                INSERT INTO Doctores (numero_empleado, nombre, cedula_profesional, curp, id_especialidad, hora_inicio, hora_fin, contrasena, estado_activo) 
                VALUES (@numero_empleado, @nombre, @cedula_profesional, @curp, @id_especialidad, @hora_inicio, @hora_fin, @contrasena, 1)
            `);
            
        res.status(201).json({ exito: true, mensaje: 'Médico registrado exitosamente en el sistema.' });
    } catch (error) {
        console.error('Error al registrar doctor:', error.message);
        // Si SQL arroja error 2627 es porque el empleado, cédula o curp ya existen (son UNIQUE)
        if (error.number === 2627) { 
            return res.status(400).json({ exito: false, mensaje: 'Error: El número de empleado, cédula o CURP ya existen en el sistema.' });
        }
        res.status(500).json({ exito: false, mensaje: 'Error interno al registrar el médico.' });
    }
});

// --- OBTENER INVENTARIO DE FARMACIA ---
app.get('/api/farmacia', async (req, res) => {
    try {
        const pool = await conectarDB();
        const resultado = await pool.request().query('SELECT * FROM Farmacia ORDER BY nombre_medicamento ASC');
        res.status(200).json({ exito: true, medicamentos: resultado.recordset });
    } catch (error) {
        res.status(500).json({ exito: false, mensaje: 'Error al obtener inventario' });
    }
});

// --- AGREGAR NUEVO MEDICAMENTO ---
app.post('/api/farmacia', async (req, res) => {
    const { codigo_barras, nombre_medicamento, descripcion, precio_unitario, stock_actual } = req.body;
    try {
        const pool = await conectarDB();
        await pool.request()
            .input('codigo', sql.VarChar, codigo_barras)
            .input('nombre', sql.VarChar, nombre_medicamento)
            .input('desc', sql.VarChar, descripcion)
            .input('precio', sql.Decimal(10,2), parseFloat(precio_unitario))
            .input('stock', sql.Int, parseInt(stock_actual))
            .query(`
                INSERT INTO Farmacia (codigo_barras, nombre_medicamento, descripcion, precio_unitario, stock_actual)
                VALUES (@codigo, @nombre, @desc, @precio, @stock)
            `);
        res.status(201).json({ exito: true, mensaje: 'Medicamento agregado al inventario.' });
    } catch (error) {
        if (error.number === 2627) return res.status(400).json({ exito: false, mensaje: 'El código de barras ya existe.' });
        res.status(500).json({ exito: false, mensaje: 'Error interno en el servidor.' });
    }
});

// --- ACTUALIZAR STOCK Y PRECIO ---
app.put('/api/farmacia/:id', async (req, res) => {
    const { id } = req.params;
    const { precio_unitario, stock_actual } = req.body;
    try {
        const pool = await conectarDB();
        await pool.request()
            .input('id', sql.Int, id)
            .input('precio', sql.Decimal(10,2), parseFloat(precio_unitario))
            .input('stock', sql.Int, parseInt(stock_actual))
            .query(`
                UPDATE Farmacia 
                SET precio_unitario = @precio, stock_actual = @stock 
                WHERE id_medicamento = @id
            `);
        res.status(200).json({ exito: true, mensaje: 'Inventario actualizado correctamente.' });
    } catch (error) {
        res.status(500).json({ exito: false, mensaje: 'Error al actualizar inventario.' });
    }
});

// --- 1. OBTENER CITAS PARA COBRARLES ---
app.get('/api/citas-cobros', async (req, res) => {
    try {
        const pool = await conectarDB();
        const resultado = await pool.request().query(`
            SELECT c.folio_cita, p.nombre AS nombre_paciente 
            FROM Citas c
            INNER JOIN Pacientes p ON c.id_paciente = p.id_paciente
            WHERE c.estatus_cita != 'Cancelada'
            ORDER BY c.fecha_cita DESC
        `);
        res.status(200).json({ exito: true, citas: resultado.recordset });
    } catch (error) {
        res.status(500).json({ exito: false, mensaje: 'Error al obtener citas.' });
    }
});

// --- 2. REGISTRAR EL COBRO EXTRA ---
app.post('/api/cobros-extras', async (req, res) => {
    const { folio_cita, nombre_paciente, concepto, monto } = req.body;
    const fecha = new Date().toISOString().split('T')[0]; // Fecha de hoy
    try {
        const pool = await conectarDB();
        await pool.request()
            .input('folio', sql.VarChar, folio_cita)
            .input('nombre', sql.VarChar, nombre_paciente)
            .input('concepto', sql.VarChar, concepto)
            .input('monto', sql.Decimal(10,2), parseFloat(monto))
            .input('fecha', sql.VarChar, fecha)
            .query(`
                INSERT INTO Cobros_Extras (folio_cita, nombre_paciente, concepto, monto, fecha_cobro)
                VALUES (@folio, @nombre, @concepto, @monto, @fecha)
            `);
        res.status(201).json({ exito: true, mensaje: 'Cobro extra registrado exitosamente en caja.' });
    } catch (error) {
        res.status(500).json({ exito: false, mensaje: 'Error al registrar el cobro.' });
    }
});

// --- 3. VER HISTORIAL DE COBROS ---
app.get('/api/cobros-extras', async (req, res) => {
    try {
        const pool = await conectarDB();
        const resultado = await pool.request().query('SELECT * FROM Cobros_Extras ORDER BY id_cobro DESC');
        res.status(200).json({ exito: true, cobros: resultado.recordset });
    } catch (error) {
        res.status(500).json({ exito: false, mensaje: 'Error al cargar historial.' });
    }
});

// --- VER BITÁCORAS DEL SISTEMA ---
app.get('/api/bitacoras', async (req, res) => {
    try {
        const pool = await conectarDB();
        const resultado = await pool.request().query('SELECT * FROM Bitacora_Sistema ORDER BY fecha_hora DESC');
        res.status(200).json({ exito: true, bitacoras: resultado.recordset });
    } catch (error) {
        res.status(500).json({ exito: false, mensaje: 'Error al cargar bitácoras.' });
    }
});

// --- CATCH-ALL (ESTRICTAMENTE AL FINAL) ---
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, async () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    await conectarDB();
});