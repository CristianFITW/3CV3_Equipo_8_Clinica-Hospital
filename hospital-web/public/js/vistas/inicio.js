export const vistaInicio = () => `
    <div>
        <h2>Bienvenido al Sistema del Hospital</h2>
        <p>Seleccione una opción para continuar:</p>
        <button onclick="navegar('/login')">Iniciar Sesión</button>
        <button onclick="navegar('/registro')">Registro de Pacientes</button>
    </div>
`;