export default function NoAccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <div className="text-red-500 text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Acceso Denegado
        </h1>
        <p className="text-gray-600 mb-6">
          No tienes acceso a la Plataforma de Productividad.
          <br />
          Contacta al administrador del sistema.
        </p>
        <p className="text-sm text-gray-500">
          Si crees que esto es un error, comunícate con el área de TI.
        </p>
      </div>
    </div>
  );
}
