# Auth Feature

## Overview
이메일 기반 개인 계정 로그인. Mock 단계에서는 비밀번호 없이 이메일 조회만으로 인증.
백엔드 연결 시 email + password 방식으로 교체.

## Store: `authStore.ts`

```typescript
interface AuthStore {
  currentUser: User | null;
  isLoggedIn: boolean;
  login: (email: string) => Promise<void>;     // mock: MOCK_USERS에서 이메일 조회
  logout: () => void;
  register: (data: Omit<User, 'id'>) => Promise<User>;
}
```

## Login Flow
1. `/login` → 이메일 입력
2. `authStore.login(email)` 호출
3. Mock: `MOCK_USERS`에서 이메일 조회 → 없으면 에러 throw
4. 성공 → `currentUser` 설정, `isLoggedIn = true`
5. `navigate('/teams')` 이동

## Register Flow
1. `/register` → 이름 + 이메일 + 색상 선택
2. `authStore.register(data)` 호출
3. Mock: 신규 id 생성 후 MOCK_USERS에 추가
4. 자동 로그인 → `/teams` 이동

## Route Guard: `ProtectedRoute`
```tsx
function ProtectedRoute({ children }: { children: ReactNode }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) navigate('/login', { replace: true });
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;
  return <>{children}</>;
}
```

## Color Palette
회원가입 시 색상 선택에 사용. `authStore.ts`에서 `export const COLOR_PALETTE` 로 공개.

## Do NOT
- 비밀번호를 클라이언트 스토어에 저장
- 인증 상태를 URL params에 담기
- `memberStore`의 login/logout 재사용 (제거됨)
