import { useState, useMemo } from "react";
import { Users, UserPlus, ArrowRight, Briefcase, Search, ChevronDown, ChevronRight } from "lucide-react";
import { useAllTeams } from "../hooks/useTeams";
import { useUsers } from "../../users/hooks/useUsers";
import { useAssignLeader } from "../../users/hooks/useUsers";
import { Modal } from "../../../components/ui/Modal";

export default function TeamsPage() {
  const { data: teams, isLoading } = useAllTeams();
  const { data: users } = useUsers();
  const assignLeaderMutation = useAssignLeader();

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedTeams, setExpandedTeams] = useState({});

  const availableLeaders = users?.filter((u) => u.is_active) || [];

  const filteredTeams = useMemo(() => {
    if (!search || !teams) return teams;
    
    const searchLower = search.toLowerCase();
    
    const isLeaderSearch = teams.some(team => 
      team.leader?.name?.toLowerCase().includes(searchLower)
    );
    
    return teams.map(team => {
      if (isLeaderSearch) {
        if (team.leader?.name?.toLowerCase().includes(searchLower)) {
          return team;
        }
        return null;
      }
      
      return {
        ...team,
        members: team.members.filter(
          m => m.name?.toLowerCase().includes(searchLower) ||
               m.email?.toLowerCase().includes(searchLower)
        )
      };
    }).filter(team => 
      team && (
        team.is_unassigned || 
        team.leader?.name?.toLowerCase().includes(searchLower) ||
        team.members.length > 0
      )
    );
  }, [teams, search]);

  const handleMoveMember = (member) => {
    setSelectedMember(member);
    setShowMoveModal(true);
  };

  const toggleTeam = (teamKey) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamKey]: !prev[teamKey]
    }));
  };

  const handleAssignNewLeader = async (leaderId) => {
    console.log("Moving member:", selectedMember?.name, "to leader:", leaderId);
    if (!selectedMember) return;

    try {
      await assignLeaderMutation.mutateAsync({
        id: selectedMember.id,
        leader_id: leaderId,
      });
      setShowMoveModal(false);
      setSelectedMember(null);
    } catch (error) {
      console.error("Error moving member:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-gray-500">Cargando equipos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-7 w-7" />
            Equipos
          </h1>
          <p className="text-gray-500 mt-1">
            Gestionar miembros y lideres de equipos
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTeams?.map((team, index) => {
          const teamKey = team.is_unassigned ? "unassigned" : team.leader?.id || index;
          const isExpanded = expandedTeams[teamKey] === true;
          
          const handleClick = (e) => {
            e.stopPropagation();
            toggleTeam(teamKey);
          };
          
          return (
            <div
              key={teamKey}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div 
                className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                onClick={handleClick}
              >
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-400 mr-3" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400 mr-3" />
                )}
                <div className="flex items-center gap-3 flex-1">
                {team.is_unassigned ? (
                  <>
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Sin asignar
                      </h3>
                      <p className="text-sm text-gray-500">
                        {team.count} miembro{team.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {team.leader?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {team.leader?.position_name || "Sin cargo"} •{" "}
                        {team.count} miembro{team.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {isExpanded && team.members?.length > 0 ? (
              <div className="p-6">
                <div className="grid gap-3">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Briefcase className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.position_name || "Sin cargo"} • {member.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleMoveMember(member)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Mover
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : isExpanded ? (
              <div className="p-6 text-center text-gray-500">
                {team.is_unassigned
                  ? "No hay usuarios sin líder asignado"
                  : "Este equipo no tiene miembros"}
              </div>
            ) : null}
          </div>
          );
        })}
      </div>

      <Modal
        isOpen={showMoveModal}
        onClose={() => {
          setShowMoveModal(false);
          setSelectedMember(null);
        }}
        title="Mover usuario a otro equipo"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Usuario:</p>
            <p className="font-medium">{selectedMember?.name}</p>
            <p className="text-sm text-gray-500">{selectedMember?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar nuevo líder/equipo:
            </label>
            <div className="space-y-2">
              <button
                onClick={() => handleAssignNewLeader(null)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <p className="font-medium">Sin asignar</p>
                <p className="text-sm text-gray-500">Quitar líder</p>
              </button>
              {availableLeaders
                .filter((u) => u.id !== selectedMember?.id)
                .map((leader) => (
                  <button
                    key={leader.id}
                    onClick={() => handleAssignNewLeader(leader.id)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <p className="font-medium">{leader.name}</p>
                    <p className="text-sm text-gray-500">
                      {leader.position_name || "Sin cargo"}
                    </p>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}