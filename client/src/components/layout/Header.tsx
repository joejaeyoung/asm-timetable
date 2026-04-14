import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTeamStore } from '@/store/teamStore';

export default function Header() {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId?: string }>();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const teams = useTeamStore((s) => s.teams);

  const currentTeam = teamId ? teams.find((t) => t.id === teamId) : null;

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function goToCalendar() {
    if (!teamId) return navigate('/teams');
    const now = new Date();
    navigate(`/teams/${teamId}/calendar/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`);
  }

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
      <button
        className="text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors flex items-center gap-2"
        onClick={goToCalendar}
      >
        <span>📅</span>
        <span>Schedule Manager</span>
        {currentTeam && (
          <>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600 font-normal">{currentTeam.name}</span>
          </>
        )}
      </button>

      <nav className="flex items-center gap-4">
        <button
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          onClick={() => navigate('/teams')}
        >
          팀 목록
        </button>

        {teamId && (
          <button
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            onClick={() => navigate(`/teams/${teamId}/settings`)}
          >
            팀 설정
          </button>
        )}

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
      </nav>
    </header>
  );
}
