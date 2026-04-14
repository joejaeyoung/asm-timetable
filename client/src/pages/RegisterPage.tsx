import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, COLOR_PALETTE } from '@/store/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('이름을 입력해주세요.');
    if (!email.trim()) return setError('이메일을 입력해주세요.');
    if (!color) return setError('색상을 선택해주세요.');
    setError('');
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), color });
      navigate('/teams', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl">📅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">계정 만들기</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            {/* Color picker */}
            <div>
              <p className="text-xs text-gray-500 mb-2">프로필 색상</p>
              <div className="flex gap-2 flex-wrap">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                      color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-2 py-2">
              <span
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: color }}
              >
                {name ? name[0] : '?'}
              </span>
              <span className="text-sm text-gray-600">{name || '이름 미입력'}</span>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? '처리 중...' : '계정 만들기'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-blue-500 hover:text-blue-600">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
