import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUsers,
  fetchRoles,
  assignUserRoles,
  assignUserLeader,
} from "../../../api/user.api";
import { fetchPositions } from "../../../api/positions.api";

export default function UsersPage() {
  const queryClient = useQueryClient();

  const [editingUser, setEditingUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);

  const [editingLeader, setEditingLeader] = useState(null);
  const [selectedLeader, setSelectedLeader] = useState("");

  // -----------------------------
  // Queries
  // -----------------------------
  const { data: users = [], isLoading: usersLoading, error: usersError } =
    useQuery({
      queryKey: ["users"],
      queryFn: fetchUsers,
    });

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: fetchPositions,
  });

  // -----------------------------
  // Mutations
  // -----------------------------
  const assignRolesMutation = useMutation({
    mutationFn: ({ userId, roleIds }) =>
      assignUserRoles(userId, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
    },
  });

  const assignLeaderMutation = useMutation({
    mutationFn: ({ userId, leaderId }) =>
      assignUserLeader(userId, leaderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingLeader(null);
    },
  });

  // -----------------------------
  // Handlers Roles
  // -----------------------------
  const handleEditRoles = (user) => {
    setEditingUser(user.id);
    setSelectedRoles(user.roles || []);
  };

  const handleRoleToggle = (roleName) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName]
    );
  };

  const handleSaveRoles = (userId) => {
    const roleIds = roles
      .filter((r) => selectedRoles.includes(r.name))
      .map((r) => r.id);

    assignRolesMutation.mutate({ userId, roleIds });
  };

  // -----------------------------
  // Handlers Leader
  // -----------------------------
  const handleEditLeader = (user) => {
    setEditingLeader(user.id);
    setSelectedLeader(user.leader_id || "");
  };

  const handleSaveLeader = (userId) => {
    assignLeaderMutation.mutate({
      userId,
      leaderId: selectedLeader || null,
    });
  };

  // -----------------------------
  // Helpers
  // -----------------------------
  const getPositionName = (user) => {
    return user.position?.name || "-";
  };

  const getLeaderName = (user) => {
    return user.leader_name || "-";
  };

  // -----------------------------
  // Loading / Error
  // -----------------------------
  if (usersLoading) {
    return <div className="text-gray-500">Cargando usuarios...</div>;
  }

  if (usersError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        Error al cargar usuarios
      </div>
    );
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Usuarios</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Cargo</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Líder</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Roles</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 text-sm text-gray-800">{user.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{getPositionName(user)}</td>

                {/* 🔥 LÍDER */}
                <td className="px-4 py-3 text-sm text-gray-600">
                  {editingLeader === user.id ? (
                    <select
                      value={selectedLeader || ""}
                      onChange={(e) => setSelectedLeader(e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="">Sin líder</option>

                      {users
                        .filter(
                          (u) =>
                            u.id !== user.id &&
                            u.roles?.includes("LEADER") // 🔥 solo líderes
                        )
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  ) : (
                    getLeaderName(user)
                  )}
                </td>

                {/* 🔥 ROLES */}
                <td className="px-4 py-3 text-sm">
                  {editingUser === user.id ? (
                    <div className="flex flex-wrap gap-1">
                      {rolesLoading ? (
                        <span className="text-gray-400">Cargando...</span>
                      ) : (
                        roles.map((role) => (
                          <button
                            key={role.id}
                            onClick={() => handleRoleToggle(role.name)}
                            className={`px-2 py-1 text-xs rounded ${
                              selectedRoles.includes(role.name)
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {role.name}
                          </button>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      {user.roles?.length > 0 ? (
                        user.roles.map((role) => (
                          <span
                            key={role}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                          >
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">Sin roles</span>
                      )}
                    </div>
                  )}
                </td>

                {/* ESTADO */}
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      user.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>

                {/* ACCIONES */}
                <td className="px-4 py-3 text-sm">
                  {editingUser === user.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveRoles(user.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="text-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : editingLeader === user.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveLeader(user.id)}
                        className="text-green-600"
                      >
                        {assignLeaderMutation.isPending
                          ? "Guardando..."
                          : "Guardar"}
                      </button>
                      <button
                        onClick={() => setEditingLeader(null)}
                        className="text-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEditRoles(user)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Roles
                      </button>

                      <button
                        onClick={() => handleEditLeader(user)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        Líder
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-500">
                  No hay usuarios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}