# Schedule Manager — 남은 작업 계획

## 현재 상태
- Phase 1–6 완료: 프론트엔드 전체 + 백엔드 Spring Boot 구현
- DB 연결 완료 (Docker MySQL 8.4 + appuser 정상 작동)
- CI/CD 연결 중:

---

## Step 1: DB 연결 설정 수정 (버그 2건)

### 1-1. application.properties — DockerCompose 연결정보 오버라이드 차단
**파일:** `team/src/main/resources/application.properties`

**문제:** Spring Boot Docker Compose 통합이 `spring.datasource.url`을 `allowPublicKeyRetrieval` 없는 URL로 덮어씀 → caching_sha2_password 인증 실패  
**해결:** DockerCompose 서비스 연결 auto-configuration 제외

```properties
spring.autoconfigure.exclude=\
  org.springframework.boot.docker.compose.service.connection.DockerComposeServiceConnectionAutoConfiguration
```

### 1-2. build.gradle — 중복 MySQL 드라이버 제거
**파일:** `team/build.gradle`

**문제:** 구 artifact `mysql:mysql-connector-java:8.0.33` 와 신 artifact `com.mysql:mysql-connector-j` 동시 선언  
**해결:** 구 artifact 제거, 신 artifact 유지

---

## Step 2: 백엔드 단위 테스트

### 테스트 전략
- **Service 테스트**: Mockito로 Repository 모킹 (DB 불필요)
- **Controller 테스트**: `@WebMvcTest` + MockMvc + `@MockitoBean`
- H2 인메모리 DB를 테스트 환경에서 사용

### 추가 설정
- `build.gradle`: `testRuntimeOnly 'com.h2database:h2'` 추가
- `src/test/resources/application-test.properties`:
  ```properties
  spring.docker.compose.enabled=false
  spring.datasource.url=jdbc:h2:mem:testdb
  spring.datasource.driver-class-name=org.h2.Driver
  spring.jpa.hibernate.ddl-auto=create-drop
  ```

### 테스트 파일 (신규 생성)

| 파일 | 커버리지 |
|------|---------|
| `UserServiceTest` | login 성공/401, register 성공/409 |
| `TeamServiceTest` | getMyTeams, createTeam, deleteTeam(403), inviteMember(403/404/409), removeMember(403/400/404) |
| `ScheduleBlockServiceTest` | getByMonth, getByWeek(ISO주차 파싱), create(시간검증), update(부분수정), delete |
| `AuthControllerTest` | POST /login 200/401/400, POST /register 201/409/400 |
| `TeamControllerTest` | 모든 팀 엔드포인트 응답코드 |
| `ScheduleBlockControllerTest` | GET(month/week/파라미터없음400), POST/PUT/DELETE |

---

## Step 3: 프론트엔드 API 연결

### 3-1. `client/src/lib/api.ts`
axios 인스턴스 생성 + `X-User-Id` 헤더 자동 첨부 인터셉터

### 3-2. 스토어 연결

| 스토어 | 변경 |
|--------|------|
| `authStore.ts` | login → `POST /api/auth/login`, register → `POST /api/auth/register` |
| `teamStore.ts` | 모든 actions → 실제 API 호출 |
| `scheduleStore.ts` | fetch/create/update/delete → 실제 API 호출 |

### 3-3. 에러 처리
- 401 → `/login` 리다이렉트
- 409 → 인라인 에러 메시지
- 403/404 → 토스트/인라인 에러

---

## 검증 순서
1. `./gradlew bootRun` → Access denied 없이 정상 기동
2. `./gradlew test` → 전체 테스트 통과
3. 프론트 `npm run dev` → 로그인 → 팀 생성 → 초대 → 스케줄 등록 E2E
