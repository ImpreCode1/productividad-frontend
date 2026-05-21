import { useState } from "react";
import { Target, Plus, Upload, Copy } from "lucide-react";
import { useAssignments, useCreateAssignment, useUpdateAssignment, useDeleteAssignment, useCloneFromPreviousMonth } from "../hooks/useAssignments";
import { useUsers } from "../../users/hooks/useUsers";
import AssignmentList from "../components/AssignmentList";
import { AssignmentModal } from "../components/AssignmentModal";
import { ImportAssignmentsModal } from "../components/ImportAssignmentsModal";

const MONTHS = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

export default function AssignmentsPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);

  const { data: assignments, isLoading } = useAssignments(year, month);
  const { data: users } = useUsers();
  
  const createMutation = useCreateAssignment();
  const updateMutation = useUpdateAssignment();
  const deleteMutation = useDeleteAssignment();
  const cloneMutation = useCloneFromPreviousMonth();

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

  const handleCloneFromPrevious = async () => {
    if (month === 1) {
      if (!confirm("¿Clonar indicadores de diciembre del año anterior?")) return;
    } else {
      if (!confirm(`¿Clonar indicadores de ${MONTHS[month - 2]?.label || month - 1} a ${MONTHS[month - 1]?.label}?`)) return;
    }
    await cloneMutation.mutateAsync({ year, month });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-7 w-7" />
            Indicadores
          </h1>
          <p className="text-gray-500 mt-1">
            Configurar indicadores por usuario/año/mes
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCloneFromPrevious}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            title="Clonar indicadores del mes anterior"
          >
            <Copy className="h-4 w-4" />
            Clonar mes anterior
          </button>

          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Importar Excel
          </button>

          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

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

      <div className="flex justify-end">
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
      ) : assignments?.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No hay indicadores para este período</p>
        </div>
      ) : (
        <AssignmentList
          assignments={assignments}
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
        month={month}
        onSave={handleSave}
      />

      <ImportAssignmentsModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        year={year}
        month={month}
      />
    </div>
  );
}