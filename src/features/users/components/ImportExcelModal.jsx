import { useState } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { useImportUsersExcel } from "../hooks/useUsers";

export function ImportExcelModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  const importMutation = useImportUsersExcel();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError("");

    if (!selectedFile) return;

    const validTypes = [
      ".xlsx",
      ".xls",
    ];

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
      await importMutation.mutateAsync(file);
      setFile(null);
      setPreview(null);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al importar usuarios");
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar usuarios desde Excel" size="md">
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="excel-file"
          />
          <label htmlFor="excel-file" className="cursor-pointer">
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
            Columnas requeridas en el Excel:
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>C.C. No.</strong>: Número de documento</p>
            <p><strong>NOMBRE COLABORADOR</strong>: Nombre completo</p>
            <p><strong>CORREO</strong>: Correo electrónico</p>
            <p><strong>CARGO</strong>: Cargo/Puesto</p>
            <p><strong>AREA</strong>: Área</p>
            <p><strong>SUBAREA/DIVISION</strong>: Subárea o División</p>
            <p><strong>JEFE DIRECTO</strong>: Nombre del jefe (opcional)</p>
            <p><strong>FECHA DE INGRESO</strong>: Fecha de ingreso (opcional)</p>
            <p><strong>TIPO DE CONTRATO</strong>: Tipo de contrato (opcional)</p>
            <p><strong>TIPO DE SALARIO</strong>: Tipo de salario (opcional)</p>
          </div>
        </div>

        <button
          onClick={handleImport}
          disabled={!file || importMutation.isPending}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
        >
          {importMutation.isPending ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Importando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Importar usuarios
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}