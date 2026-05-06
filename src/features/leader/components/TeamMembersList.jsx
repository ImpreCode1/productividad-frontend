import { useTeamMembers } from "../hooks";
import { UserCog } from "lucide-react";

export default function TeamMembersList() {
  const { data: members, isLoading, error } = useTeamMembers();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500">Cargando equipo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error al cargar los miembros del equipo
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="text-gray-500 p-4">
        No tienes miembros en tu equipo
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cargo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Área
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Correo
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {members.map((member) => (
            <tr key={member.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserCog className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {member.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.document_number}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {member.position_name || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {member.area || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {member.email}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
