import { useState, useMemo } from "react";
import { FileText, X, Search, TrendingUp, TrendingDown, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../hooks/useAuth";
import * as actionPlanApi from "../../../api/actionPlan.api";

const FULL_MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const SHORT_MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const getMonthName = (month, short = true) => {
  const months = short ? SHORT_MONTHS : FULL_MONTHS;
  return months[month - 1] || month;
};

export default function ActionPlanPage() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [filterMonth, setFilterMonth] = useState(0);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedUsers, setExpandedUsers] = useState({});

  const isLeaderOrAdmin = user?.roles?.some(r => ["LEADER", "ADMIN"].includes(r));

  const { data: actionPlans, isLoading } = useQuery({
    queryKey: isLeaderOrAdmin ? ["team", "action-plans", user?.id, year] : ["my", "action-plans", year],
    queryFn: () => isLeaderOrAdmin
      ? actionPlanApi.getTeamActionPlans(user.id, year)
      : actionPlanApi.getMyActionPlans(year),
    enabled: !!user?.id,
  });

  const filteredPlans = useMemo(() => {
    if (!actionPlans) return [];
    return actionPlans.filter((plan) => {
      if (filterMonth && plan.month !== filterMonth) return false;
      if (filterStatus === "met") {
        if (plan.achieved_percentage < plan.target_value) return false;
      } else if (filterStatus === "not_met") {
        if (plan.achieved_percentage >= plan.target_value) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (
          !plan.indicator_name?.toLowerCase().includes(q) &&
          !plan.user_name?.toLowerCase().includes(q) &&
          !plan.action_plan?.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [actionPlans, filterMonth, filterStatus, search]);

  const stats = useMemo(() => {
    const plans = actionPlans || [];
    const total = plans.length;
    const met = plans.filter(p => p.achieved_percentage >= p.target_value).length;
    const notMet = total - met;
    return { total, met, notMet };
  }, [actionPlans]);

  const plansByUser = useMemo(() => {
    if (!isLeaderOrAdmin) return null;
    const grouped = {};
    for (const plan of filteredPlans) {
      const key = plan.user_id || "unknown";
      if (!grouped[key]) {
        grouped[key] = {
          user_id: plan.user_id,
          user_name: plan.user_name || "Sin nombre",
          position_name: plan.position_name || "",
          email: plan.user_email || "",
          plans: [],
          met: 0,
          notMet: 0,
        };
      }
      grouped[key].plans.push(plan);
      if (plan.achieved_percentage >= plan.target_value) {
        grouped[key].met++;
      } else {
        grouped[key].notMet++;
      }
    }
    return Object.values(grouped);
  }, [filteredPlans, isLeaderOrAdmin]);

  const toggleUser = (userId) => {
    setExpandedUsers((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const clearFilters = () => {
    setFilterMonth(0);
    setFilterStatus("all");
    setSearch("");
  };

  const hasActiveFilters = filterMonth !== 0 || filterStatus !== "all" || search !== "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Planes de Acción</h1>
            <p className="text-gray-500 text-sm">
              {isLeaderOrAdmin ? "Planes de acción de tu equipo" : "Tus planes de acción"}
            </p>
          </div>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
        >
          <option value={currentYear}>{currentYear}</option>
          <option value={currentYear - 1}>{currentYear - 1}</option>
          <option value={currentYear - 2}>{currentYear - 2}</option>
        </select>
      </div>

      {!isLoading && actionPlans && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total de planes</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.met}</p>
              <p className="text-sm text-gray-500">Cumplidos</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.notMet}</p>
              <p className="text-sm text-gray-500">No cumplidos</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por indicador, colaborador o plan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value={0}>Todos los meses</option>
              {FULL_MONTHS.map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos los estados</option>
              <option value="met">Cumplidos</option>
              <option value="not_met">No cumplidos</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
                Limpiar
              </button>
            )}
          </div>
          {hasActiveFilters && (
            <p className="text-sm text-gray-500">
              Mostrando {filteredPlans.length} de {actionPlans?.length || 0} planes
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Cargando planes de acción...</div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? "Sin resultados" : "Sin planes de acción"}
            </h3>
            <p className="text-gray-500">
              {hasActiveFilters
                ? "No hay planes de acción que coincidan con los filtros"
                : "No hay planes de acción para este período"}
            </p>
          </div>
        ) : !isLeaderOrAdmin ? (
          <div className="divide-y divide-gray-200">
            {filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                showUser={false}
                onView={() => setSelectedPlan(plan)}
              />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {plansByUser?.map((userGroup) => (
              <div key={userGroup.user_id}>
                <div
                  className="px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                  onClick={() => toggleUser(userGroup.user_id)}
                >
                  <div className="flex items-center gap-3">
                    {expandedUsers[userGroup.user_id] ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{userGroup.user_name}</p>
                      <p className="text-xs text-gray-500">{userGroup.position_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" /> {userGroup.met}
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <TrendingDown className="h-3 w-3" /> {userGroup.notMet}
                    </span>
                  </div>
                </div>
                {expandedUsers[userGroup.user_id] && (
                  <div className="divide-y divide-gray-100">
                    {userGroup.plans.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        showUser={false}
                        onView={() => setSelectedPlan(plan)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Detalles del Plan de Acción
              </h3>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {isLeaderOrAdmin && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Colaborador</p>
                  <p className="font-medium">{selectedPlan.user_name}</p>
                  <p className="text-xs text-gray-500">{selectedPlan.position_name}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Indicador</p>
                  <p className="font-medium">{selectedPlan.indicator_name}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Período</p>
                  <p className="font-medium">{getMonthName(selectedPlan.month, false)} / {selectedPlan.year}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Meta</p>
                  <p className="text-lg font-bold text-gray-900">{selectedPlan.target_value}%</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Logrado</p>
                  <p className={`text-lg font-bold ${selectedPlan.achieved_percentage >= selectedPlan.target_value ? "text-green-600" : "text-red-600"}`}>
                    {selectedPlan.achieved_percentage?.toFixed(1) || "-"}%
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Estado</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    selectedPlan.achieved_percentage >= selectedPlan.target_value
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {selectedPlan.achieved_percentage >= selectedPlan.target_value ? "Cumplido" : "No cumplido"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón del no cumplimiento
                </label>
                <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 min-h-[3rem]">
                  {selectedPlan.reason_not_met || "No especificada"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan de Acción
                </label>
                <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 min-h-[5rem] whitespace-pre-wrap">
                  {selectedPlan.action_plan}
                </div>
              </div>

              {selectedPlan.created_at && (
                <p className="text-xs text-gray-400 text-right">
                  Creado: {new Date(selectedPlan.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan, showUser = true, onView }) {
  const isMet = plan.achieved_percentage >= plan.target_value;
  return (
    <div className="p-4 hover:bg-gray-50 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {showUser && (
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{plan.user_name || "Sin nombre"}</p>
            <p className="text-xs text-gray-500 truncate">{plan.position_name}</p>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">{plan.indicator_name}</p>
          <p className="text-xs text-gray-500">
            {getMonthName(plan.month, false)} • Meta: {plan.target_value}%
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-lg font-bold ${isMet ? "text-green-600" : "text-red-600"}`}>
            {plan.achieved_percentage?.toFixed(1) || "-"}%
          </p>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            isMet ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {isMet ? "Cumplido" : "No cumplido"}
          </span>
        </div>
      </div>
      <button
        onClick={onView}
        className="shrink-0 text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700"
      >
        Ver detalles
      </button>
    </div>
  );
}
