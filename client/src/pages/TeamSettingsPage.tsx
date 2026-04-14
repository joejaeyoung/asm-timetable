import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTeamStore } from '@/store/teamStore';

export default function TeamSettingsPage() {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const currentUser = useAuthStore((s) => s.currentUser);
  const fetchMyTeams = useTeamStore((s) => s.fetchMyTeams);
  const inviteMember = useTeamStore((s) => s.inviteMember);
  const removeMember = useTeamStore((s) => s.removeMember);
  const deleteTeam = useTeamStore((s) => s.deleteTeam);
  const getTeamMembers = useTeamStore((s) => s.getTeamMembers);
  const memberships = useTeamStore((s) => s.memberships);
  const teams = useTeamStore((s) => s.teams);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (currentUser) fetchMyTeams(currentUser.id);
  }, [currentUser, fetchMyTeams]);

  if (!teamId) return null;
  const safeTeamId: string = teamId;

  const team = teams.find((t) => t.id === safeTeamId);
  const members = getTeamMembers(safeTeamId);
  const isOwner = team?.ownerId === currentUser?.id;

  function getMemberRole(userId: string) {
    return memberships.find((m) => m.teamId === safeTeamId && m.userId === userId)?.role ?? 'member';
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return setInviteError('이메일을 입력해주세요.');
    setInviteError('');
    setInviteLoading(true);
    try {
      await inviteMember(safeTeamId, inviteEmail.trim());
      setInviteEmail('');
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : '초대에 실패했습니다.');
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    try {
      await removeMember(safeTeamId, userId);
    } catch (err) {
      alert(err instanceof Error ? err.message : '팀원 삭제에 실패했습니다.');
    }
  }

  async function handleDeleteTeam() {
    setDeleteLoading(true);
    try {
      await deleteTeam(safeTeamId);
      navigate('/teams', { replace: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : '팀 삭제에 실패했습니다.');
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">팀을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        {/* Back */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/teams')} className="text-sm text-gray-400 hover:text-gray-700">
            ← 팀 목록
          </button>
          <h1 className="text-lg font-semibold text-gray-800">{team.name} · 설정</h1>
        </div>

        {/* Members list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-medium text-gray-600">팀원 목록 ({members.length}명)</p>
          </div>
          {members.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">팀원이 없습니다.</p>
          ) : (
            <ul>
              {members.map((member) => {
                const role = getMemberRole(member.id);
                const isMe = member.id === currentUser?.id;
                return (
                  <li key={member.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                    <span
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                        {member.name}
                        {isMe && (
                          <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">나</span>
                        )}
                        {role === 'owner' && (
                          <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">팀장</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{member.email}</p>
                    </div>
                    {/* Owner can remove non-owner members */}
                    {isOwner && !isMe && role !== 'owner' && (
                      <button
                        className="text-xs text-gray-300 hover:text-red-400 transition-colors px-2 py-1 rounded"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        내보내기
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Invite member (owner only) */}
        {isOwner && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-3">팀원 초대</p>
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="이메일 주소"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <button
                type="submit"
                disabled={inviteLoading}
                className="px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 rounded-lg flex-shrink-0 transition-colors"
              >
                {inviteLoading ? '...' : '초대'}
              </button>
            </form>
            {inviteError && <p className="text-xs text-red-500 mt-2">{inviteError}</p>}
            <p className="text-xs text-gray-400 mt-2">초대된 멤버는 즉시 팀에 추가됩니다.</p>
          </div>
        )}

        {/* Delete team (owner only) */}
        {isOwner && (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
            <p className="text-sm font-medium text-gray-700 mb-1">팀 삭제</p>
            <p className="text-xs text-gray-400 mb-3">팀을 삭제하면 모든 스케줄이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.</p>
            {!deleteConfirm ? (
              <button
                className="px-4 py-2 text-sm text-red-500 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                onClick={() => setDeleteConfirm(true)}
              >
                팀 삭제
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm text-red-600 font-medium flex-1">정말 삭제하시겠습니까?</p>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteTeam}
                  disabled={deleteLoading}
                  className="px-3 py-1.5 text-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {deleteLoading ? '삭제 중...' : '삭제'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
