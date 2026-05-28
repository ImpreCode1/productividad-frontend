import { useState } from "react";
import { UserCog, Upload, Plus } from "lucide-react";
import { useUsers, useCreateUser } from "../hooks/useUsers";
import UserList from "../components/UserList";
import { UserModal } from "../components/UserModal";
import { ImportExcelModal } from "../components/ImportExcelModal";
import { CreateUserModal } from "../components/CreateUserModal";

export default function UsersPage() {
  const [editUser, setEditUser] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: users, isLoading, error } = useUsers();
  const createMutation = useCreateUser();

  const handleEdit = (user) => {
    setEditUser(user);
    setShowUserModal(true);
  };

  const handleCreate = async (data) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog className="h-7 w-7" />
            Usuarios
          </h1>
          <p className="text-gray-500 mt-1">
            Gestión de usuarios y estructura organizacional
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Importar Excel
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="text-gray-500">Cargando usuarios...</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">
            Error al cargar los usuarios: {error.message}
          </p>
        </div>
      ) : (
        <UserList users={users} onEdit={handleEdit} />
      )}

      <UserModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setEditUser(null);
        }}
        user={editUser}
      />

      <ImportExcelModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
      />

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreate}
      />
    </div>
  );
}