import { useState } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { useImportAssignments } from "../hooks/useAssignments";

export function ImportAssignmentsModal({ isOpen, onClose, year }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  const importMutation = useImportAssignments();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError("");

    if (!selectedFile) return;

    const validTypes = [".xlsx", ".xls"];
    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();

    if (!validTypes.includes(`.${fileExtension}`)) {
      setError("Solo se permiten archivos Excel (.xlsx, .xls)");
      return;
    }

    setFile(selectedFile);
    setPreview({
      name: selectedFile.name,
      size: (selectedFile.size / 1024).toFixed(2) + " KB",
    });
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      await importMutation.mutateAsync({ file, year });
      setFile(null);
      setPreview(null);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al importar indicadores");
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar indicadores desde Excel" size="md">
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="assignments-file"
          />
          <label htmlFor="assignments-file" className="cursor-pointer">
            <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              Haz clic para seleccionar un archivo
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Formato: .xlsx o .xls
            </p>
          </label>
        </div>

        {preview && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {preview.name}
                </p>
                <p className="text-xs text-gray-500">{preview.size}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-700 mb-2">
            Formato esperado del archivo:
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Responsable</strong>: Correo del usuario</p>
            <p><strong>Nombre del Indicador</strong>: Nombre del indicador</p>
            <p><strong>Formula del Indicador</strong>: Fórmula (opcional)</p>
            <p><strong>Meta</strong>: Valor objetivo</p>
            <p><strong>Peso</strong>: Porcentaje (0-100)</p>
            <p><strong>Frecuencia</strong>: MONTHLY, QUARTERLY, etc.</p>
          </div>
        </div>

        <button
          onClick={handleImport}
          disabled={!file || importMutation.isPending}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
        >
          {importMutation.isPending ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Importando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Importar indicadores
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}