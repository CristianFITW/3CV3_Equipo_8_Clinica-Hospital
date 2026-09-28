const sql = require('mssql/msnodesqlv8');

// Configuración forzando el controlador nativo de Windows (Driver={SQL Server})
const dbSettings = {
    connectionString: 'Driver={SQL Server};Server=localhost\\SQLEXPRESS;Database=HospitalESCOM;Trusted_Connection=yes;'
};

// Función para conectar a la base de datos
const conectarDB = async () => {
    try {
        const pool = await sql.connect(dbSettings);
        console.log('✅ Conexión a la base de datos SQL Server establecida con éxito.');
        return pool;
    } catch (error) {
        console.error('❌ Error al conectar con SQL Server:', error.message);
    }
};

module.exports = {
    sql,
    conectarDB
};