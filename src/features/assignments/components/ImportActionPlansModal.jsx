import { useState } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { importActionPlansExcel } from "../../../api/actionPlan.api";

export function ImportActionPlansModal({ isOpen, onClose, year, month }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError("");
    setResult(null);

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
      setImporting(true);
      const { data } = await importActionPlansExcel(file, year, month);
      setResult(data);

      if (data.errors?.length === 0) {
        setFile(null);
        setPreview(null);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Error al importar planes de acción");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError("");
    setResult(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Planes de Acción desde Excel" size="md">
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="action-plans-file"
          />
          <label htmlFor="action-plans-file" className="cursor-pointer">
            <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              Haz clic para seleccionar un archivo
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Formato: .xlsx o .xls
            </p>
          </label>
        </div>

        {preview && !result && (
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

        {result && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Importación completada
                  </p>
                  <p className="text-xs text-green-600">
                    {result.created} creados • {result.updated} actualizados
                  </p>
                </div>
              </div>
            </div>

            {result.errors?.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-sm font-medium text-yellow-800">
                    {result.errors.length} errores
                  </p>
                </div>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {result.errors.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.responsable}</strong> — {item.indicador}: {item.motivo}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
            <p><strong>Responsable</strong>: Nombre del usuario</p>
            <p><strong>Nombre del Indicador</strong>: Nombre del indicador</p>
            <p><strong>Por qué no se cumplió</strong>: Razón del no cumplimiento</p>
            <p><strong>Planes de acción</strong>: Plan de acción para mejorar</p>
          </div>
        </div>

        {!result && (
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            {importing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Importando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Importar planes de acción
              </>
            )}
          </button>
        )}

        {result && (
          <button
            onClick={handleClose}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        )}
      </div>
    </Modal>
  );
}