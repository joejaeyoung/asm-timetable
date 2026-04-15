import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTeamStore } from '@/store/teamStore';
import PatchNotesCard from '@/components/PatchNotesCard';
import { PATCH_NOTES } from '@/data/patchNotes';

function defaultCalendarPath(teamId: string) {
  const now = new Date();
  return `/teams/${teamId}/calendar/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function MyTeamsPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const teams = useTeamStore((s) => s.teams);
  const fetchMyTeams = useTeamStore((s) => s.fetchMyTeams);
  const createTeam = useTeamStore((s) => s.createTeam);
  const memberships = useTeamStore((s) => s.memberships);

  const [showForm, setShowForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) fetchMyTeams(currentUser.id);
  }, [currentUser, fetchMyTeams]);

  function getMemberCount(teamId: string) {
    return memberships.filter((m) => m.teamId === teamId).length;
  }

  function getMyRole(teamId: string) {
    if (!currentUser) return null;
    return memberships.find((m) => m.teamId === teamId && m.userId === currentUser.id)?.role ?? null;
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return setError('팀 이름을 입력해주세요.');
    setError('');
    setLoading(true);
    try {
      await createTeam(teamName.trim(), teamDesc.trim() || undefined);
      setTeamName(''); setTeamDesc(''); setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '팀 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <span className="text-sm font-semibold text-gray-800">Schedule Manager</span>
        </div>
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold"
                style={{ backgroundColor: currentUser.color }}
              >
                {currentUser.name[0]}
              </span>
              <span className="text-sm text-gray-700">{currentUser.name}</span>
            </div>
          )}
          <button
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-gray-800">내 팀</h1>
          <span className="text-sm text-gray-400">{teams.length}개 팀</span>
        </div>

        <PatchNotesCard notes={PATCH_NOTES} />

        {/* Team list */}
        {teams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center mb-4">
            <p className="text-sm text-gray-400">아직 속한 팀이 없습니다.</p>
            <p className="text-xs text-gray-300 mt-1">새 팀을 만들거나 초대를 받아보세요.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-4">
            {teams.map((team) => {
              const role = getMyRole(team.id);
              const count = getMemberCount(team.id);
              return (
                <div
                  key={team.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group"
                  onClick={() => {
                    navigate(defaultCalendarPath(team.id));
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-400 group-hover:bg-blue-100 transition-colors">
                    <span className="text-lg">👥</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{team.name}</p>
                      {role === 'owner' && (
                        <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          팀장
                        </span>
                      )}
                    </div>
                    {team.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{team.description}</p>
                    )}
                    <p className="text-xs text-gray-300 mt-0.5">팀원 {count}명</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      className="text-xs text-gray-300 hover:text-gray-600 px-2 py-1 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/teams/${team.id}/settings`);
                      }}
                    >
                      설정
                    </button>
                    <span className="text-gray-300 group-hover:text-blue-400 text-sm">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create team */}
        {!showForm ? (
          <button
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
            onClick={() => setShowForm(true)}
          >
            + 새 팀 만들기
          </button>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-700">새 팀 만들기</p>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="팀 이름 *"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="설명 (선택)"
                value={teamDesc}
                onChange={(e) => setTeamDesc(e.target.value)}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(''); }}
                  className="px-4 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 rounded-lg"
                >
                  {loading ? '생성 중...' : '만들기'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
