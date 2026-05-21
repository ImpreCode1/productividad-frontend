import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Modal } from "../../../components/ui/Modal";
import { useUsers, useUserRoles, useAssignLeader } from "../hooks/useUsers";
import * as rolesApi from "../../../api/roles.api";
import * as usersApi from "../../../api/users.api";
import { getAreas } from "../../../api/users.api";
import { translateRole } from "../../../utils/auth";

export function UserModal({ isOpen, onClose, user }) {
  try {
    const queryClient = useQueryClient();

    const { data: users } = useUsers();
    const { data: roles } = useUserRoles();
    const areasQuery = useQuery({
      queryKey: ["areas"],
      queryFn: async () => {
        const { data } = await getAreas();
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
    const assignLeaderMutation = useAssignLeader();
    const assignRolesMutation = useAssignRolesToUser(queryClient);
    const statusMutation = useUpdateUserStatus(queryClient);
    const updateUserMutation = useUpdateUser(queryClient);

    if (!isOpen || !user) return null;

    return (
      <UserForm
        user={user}
        users={users}
        roles={roles}
        areas={areasQuery.data}
        onClose={onClose}
        assignLeaderMutation={assignLeaderMutation}
        assignRolesMutation={assignRolesMutation}
        statusMutation={statusMutation}
        updateUserMutation={updateUserMutation}
      />
    );
  } catch (error) {
    console.error("Error rendering UserModal:", error);
    return null;
  }
}

function UserForm({ user, users, roles, areas, onClose, assignLeaderMutation, assignRolesMutation, statusMutation, updateUserMutation }) {
  const [activeTab, setActiveTab] = useState("info");
  const [localUser, setLocalUser] = useState(user);
  const [leaderSearch, setLeaderSearch] = useState("");
  const [showLeaderDropdown, setShowLeaderDropdown] = useState(false);

  useEffect(() => {
    setLocalUser(user);
    setLeaderSearch("");
  }, [user]);

  const leaderId = localUser?.leader_id || "";
  const isActive = localUser?.is_active ?? true;

  const selectedRoles = (localUser?.roles || []).map(r => r.name || r);

  const leaders = useMemo(
    () => users?.filter((u) => u.id !== user?.id) || [],
    [users, user]
  );

  const filteredLeaders = useMemo(() => {
    if (!leaderSearch) return leaders;
    const q = leaderSearch.toLowerCase();
    return leaders.filter(l => l.name?.toLowerCase().includes(q));
  }, [leaders, leaderSearch]);

  const handleSaveInfo = async () => {
    try {
      await updateUserMutation.mutateAsync({
        id: localUser.id,
        data: {
          name: localUser.name,
          email: localUser.email,
          document_number: localUser.document_number,
          position_name: localUser.position_name,
          area: localUser.area,
          subarea: localUser.subarea,
          direccion: localUser.direccion,
          linea: localUser.linea,
          numero_linea: localUser.numero_linea,
        },
      });
      onClose();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleSaveLeader = async () => {
    try {
      await assignLeaderMutation.mutateAsync({
        id: localUser.id,
        leader_id: leaderId || null,
      });
      onClose();
    } catch (error) {
      console.error("Error assigning leader:", error);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = !isActive;
      await statusMutation.mutateAsync({
        id: localUser.id,
        is_active: newStatus,
      });
      setLocalUser((prev) => prev ? { ...prev, is_active: newStatus } : prev);
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const handleSaveRoles = async () => {
    try {
      const roleIds = selectedRoles.map((roleName) => {
        const role = roles?.find((r) => r.name === roleName);
        return role?.id;
      }).filter(Boolean);
      
      await assignRolesMutation.mutateAsync({
        userId: localUser.id,
        roleIds: roleIds,
      });
      onClose();
    } catch (error) {
      console.error("Error assigning roles:", error);
    }
  };

  const updateField = (field, value) => {
    setLocalUser((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const toggleRole = (roleName) => {
    const currentRoles = localUser?.roles || [];
    const roleNames = currentRoles.map(r => r.name || r);
    const newRoles = roleNames.includes(roleName)
      ? roleNames.filter((r) => r !== roleName)
      : [...roleNames, roleName];
    setLocalUser((prev) => prev ? { ...prev, roles: newRoles } : prev);
  };

  const tabs = [
    { id: "info", label: "Información" },
    { id: "roles", label: "Roles" },
  ];

  return (
    <Modal isOpen={true} onClose={onClose} title={`Editar: ${localUser?.name}`} size="lg">
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "info" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={localUser?.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo
              </label>
              <input
                type="email"
                value={localUser?.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documento
              </label>
              <input
                type="text"
                value={localUser?.document_number || ""}
                onChange={(e) => updateField("document_number", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo
              </label>
              <input
                type="text"
                value={localUser?.position_name || ""}
                onChange={(e) => updateField("position_name", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vicepresidencia
              </label>
              <select
                value={localUser?.area || ""}
                onChange={(e) => updateField("area", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar...</option>
                {areas?.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Área
              </label>
              <input
                type="text"
                value={localUser?.subarea || ""}
                onChange={(e) => updateField("subarea", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={localUser?.direccion || ""}
                onChange={(e) => updateField("direccion", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Línea
              </label>
              <input
                type="text"
                value={localUser?.linea || ""}
                onChange={(e) => updateField("linea", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                # Línea
              </label>
              <input
                type="text"
                value={localUser?.numero_linea || ""}
                onChange={(e) => updateField("numero_linea", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleSaveInfo}
            disabled={updateUserMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {updateUserMutation.isPending ? "Guardando..." : "Guardar información"}
          </button>

          <hr className="my-4" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <div className="flex items-center">
              <button
                onClick={handleToggleStatus}
                disabled={statusMutation.isPending}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? "bg-green-600" : "bg-red-600"
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="ml-3 text-sm text-gray-500">
                {isActive ? "Activo" : "Inactivo"}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Usuario inactivo no podrá operar en el sistema
            </p>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Líder
            </label>
            <input
              type="text"
              value={leaderId && !showLeaderDropdown ? (leaders.find(l => l.id === leaderId)?.name || "Sin líder asignado") : leaderSearch}
              onChange={(e) => {
                setLeaderSearch(e.target.value);
                updateField("leader_id", "");
                setShowLeaderDropdown(true);
              }}
              onFocus={() => setShowLeaderDropdown(true)}
              onBlur={() => setTimeout(() => setShowLeaderDropdown(false), 200)}
              placeholder="Buscar líder..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {showLeaderDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onMouseDown={() => {
                    updateField("leader_id", "");
                    setLeaderSearch("");
                    setShowLeaderDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                    !leaderId ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-500"
                  }`}
                >
                  Sin líder asignado
                </button>
                {filteredLeaders.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-400">Sin resultados</div>
                ) : (
                  filteredLeaders.map((leader) => (
                    <button
                      key={leader.id}
                      type="button"
                      onMouseDown={() => {
                        updateField("leader_id", leader.id);
                        setLeaderSearch(leader.name);
                        setShowLeaderDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                        leaderId === leader.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                      }`}
                    >
                      {leader.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSaveLeader}
            disabled={assignLeaderMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {assignLeaderMutation.isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}

      {activeTab === "roles" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Selecciona los roles que tendrá este usuario
          </p>

          <div className="space-y-2">
            {roles?.map((role) => (
              <label
                key={role.id}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.name)}
                  onChange={() => toggleRole(role.name)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900">
                    {translateRole(role.name)}
                  </span>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleSaveRoles}
            disabled={assignRolesMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {assignRolesMutation.isPending ? "Guardando..." : "Guardar Roles"}
          </button>
        </div>
      )}
    </Modal>
  );
}

function useAssignRolesToUser(queryClient) {
  return useMutation({
    mutationFn: ({ userId, roleIds }) => rolesApi.assignRolesToUser(userId, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

function useUpdateUserStatus(queryClient) {
  return useMutation({
    mutationFn: ({ id, is_active }) => usersApi.changeUserStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

function useUpdateUser(queryClient) {
  return useMutation({
    mutationFn: ({ id, data }) => usersApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}