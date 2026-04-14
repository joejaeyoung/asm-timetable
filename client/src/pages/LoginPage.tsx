import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) navigate('/teams', { replace: true });
  }, [isLoggedIn, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return setError('이메일을 입력해주세요.');
    setError('');
    setLoading(true);
    try {
      await login(email.trim());
      navigate('/teams', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl">📅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Schedule Manager</h1>
          <p className="text-sm text-gray-500 mt-1">팀 일정을 한눈에</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-600 mb-4">로그인</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              계정이 없으신가요?{' '}
              <Link to="/register" className="text-blue-500 hover:text-blue-600">
                계정 만들기
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
