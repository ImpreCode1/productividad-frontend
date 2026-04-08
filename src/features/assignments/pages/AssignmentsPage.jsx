import { useState } from "react";
import { Target, Plus, Search, Upload } from "lucide-react";
import { useAssignments, useCreateAssignment, useUpdateAssignment, useDeleteAssignment } from "../hooks/useAssignments";
import { useUsers } from "../../users/hooks/useUsers";
import AssignmentList from "../components/AssignmentList";
import { AssignmentModal } from "../components/AssignmentModal";
import { ImportAssignmentsModal } from "../components/ImportAssignmentsModal";

export default function AssignmentsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);

  const { data: assignments, isLoading } = useAssignments(year);
  const { data: users } = useUsers();
  
  const createMutation = useCreateAssignment();
  const updateMutation = useUpdateAssignment();
  const deleteMutation = useDeleteAssignment();

  const filteredAssignments = assignments?.filter(
    (a) =>
      !search ||
      a.indicator_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data) => {
    if (editAssignment) {
      await updateMutation.mutateAsync({
        id: editAssignment.id,
        data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleEdit = (assignment) => {
    setEditAssignment(assignment);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este indicador?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditAssignment(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-7 w-7" />
            Asignaciones
          </h1>
          <p className="text-gray-500 mt-1">
            Configurar indicadores por usuario/año
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Importar Excel
          </button>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear - 2}>{currentYear - 2}</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-white rounded-lg shadow p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar indicador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo indicador
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="text-gray-500">Cargando indicadores...</div>
        </div>
      ) : (
        <AssignmentList
          assignments={filteredAssignments}
          users={users}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <AssignmentModal
        isOpen={showModal}
        onClose={handleCloseModal}
        assignment={editAssignment}
        users={users}
        year={year}
        onSave={handleSave}
      />

      <ImportAssignmentsModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        year={year}
      />
    </div>
  );
}