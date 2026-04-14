# Backend Work Log

## Phase 6: Spring Boot 백엔드 구현 (2026-04-14)

### 환경 정보
| 항목 | 내용 |
|------|------|
| 프레임워크 | Spring Boot 4.0.5 |
| 언어 | Java 17 |
| 빌드 | Gradle (Groovy DSL) |
| DB | MySQL 8.4 |
| ORM | Spring Data JPA / Hibernate 6 |
| 패키지 루트 | `com.cm.team` |
| 프로젝트 경로 | `ScheduleManager/team/` |

---

### 작업 내역

#### 1. 의존성 추가 (`build.gradle`)
- `spring-boot-starter-data-jpa` — JPA/Hibernate
- `com.mysql:mysql-connector-j` — MySQL 드라이버
- `spring-boot-starter-validation` — jakarta.validation
- 기존 의존성(webmvc, lombok, docker-compose, test) 유지

#### 2. 로컬 개발 환경 (`compose.yaml`)
- MySQL 8.4 컨테이너 정의
- 환경변수 `DB_USERNAME`, `DB_PASSWORD` 기본값 포함
- Spring Boot Docker Compose 통합: `./gradlew bootRun` 시 자동 기동

#### 3. 설정 파일 (`application.properties`)
- DataSource: 환경변수 기반 (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`)
- JPA DDL-auto: `update`
- Timezone: `Asia/Seoul`

#### 4. 엔티티 설계 (`entity/`)

| 클래스 | 테이블 | PK | 비고 |
|--------|--------|----|------|
| `User` | `users` | UUID | 이메일 unique |
| `Team` | `teams` | UUID | owner → User FK |
| `TeamMembership` | `team_memberships` | 복합 PK (teamId + userId) | `@EmbeddedId` |
| `TeamMembershipId` | — | — | Serializable 복합키 클래스 |
| `ScheduleBlock` | `schedule_blocks` | UUID | user/team FK, 복합 인덱스 |

- UUID 생성: `@UuidGenerator` (Hibernate 6 방식)
- `TeamMembership.Role`: ENUM (`owner`, `member`) → DB VARCHAR
- `createdAt` / `joinedAt`: `@PrePersist` 자동 설정

#### 5. 레포지토리 (`repository/`)
| 클래스 | 주요 메서드 |
|--------|------------|
| `UserRepository` | `findByEmail`, `existsByEmail` |
| `TeamRepository` | `findAllByMemberUserId` (JPQL 팀-멤버십 조인) |
| `TeamMembershipRepository` | `findByIdTeamId`, `existsByIdTeamIdAndIdUserId`, `deleteByIdTeamId` |
| `ScheduleBlockRepository` | 날짜 범위 조회 (월별/주별) |

#### 6. DTO (`dto/request/`, `dto/response/`)
**Request**
- `LoginRequest` — email
- `RegisterRequest` — name, email, color (hex 패턴 검증)
- `CreateTeamRequest` — name, description
- `InviteMemberRequest` — email
- `CreateScheduleBlockRequest` — userId, teamId, date, startTime, endTime, description
- `UpdateScheduleBlockRequest` — 부분 수정 (모든 필드 optional)

**Response**
- `UserResponse`, `TeamResponse`, `TeamMemberResponse`, `ScheduleBlockResponse`

#### 7. 서비스 (`service/`)
| 클래스 | 핵심 로직 |
|--------|-----------|
| `UserService` | 이메일 소문자 정규화, 중복 검사 |
| `TeamService` | owner 권한 검증, 강제 초대, `@Transactional` |
| `ScheduleBlockService` | ISO 주차 파싱 (`YYYY-W##` → Monday), 시간 유효성 검사 |

#### 8. 컨트롤러 (`controller/`)
- `AuthController` — `POST /api/auth/login`, `POST /api/auth/register`
- `TeamController` — `X-User-Id` 헤더로 현재 사용자 식별
- `ScheduleBlockController` — `teamId + month/week` 쿼리 파라미터

#### 9. CORS 설정 (`config/CorsConfig.java`)
- 허용 Origin: `localhost:5173`, `localhost:5174`, `FRONTEND_URL` 환경변수
- 허용 메서드: GET, POST, PUT, DELETE, OPTIONS

#### 10. Dockerfile (멀티스테이지)
```
Stage 1 (builder): eclipse-temurin:17-jdk-alpine → ./gradlew build -x test
Stage 2 (runtime): eclipse-temurin:17-jre-alpine  → 비루트 유저(appuser) 실행
```
의존성 레이어 캐시 최적화: gradlew + build.gradle 먼저 복사 후 소스 복사

#### 11. GitHub Actions (`.github/workflows/backend-deploy.yml`)
- **트리거**: `main` push, `team/**` 경로 변경 시
- **build job**: JDK 17 → `./gradlew build` → `./gradlew test`
- **docker job** (main push only): JAR 빌드 → NCR 로그인 → 이미지 빌드 & 푸시
  - 태그: `latest` + git short SHA
  - GHA 캐시 활용
- **deploy job**: 주석 처리 — 서버 접근 방식 확정 후 활성화

---

### GitHub Actions Secrets 등록 필요
| Secret | 설명 |
|--------|------|
| `NCR_REGISTRY` | NCR 주소 (e.g. `xxx.kr.ncr.ntruss.com`) |
| `NCR_ACCESS_KEY` | NCP Access Key ID |
| `NCR_SECRET_KEY` | NCP Secret Key |
| `DB_HOST` | 운영 DB 호스트 |
| `DB_NAME` | 운영 DB 이름 |
| `DB_USERNAME` | 운영 DB 사용자 |
| `DB_PASSWORD` | 운영 DB 비밀번호 |
| `SERVER_HOST` | 배포 서버 IP (deploy job 활성화 시) |
| `SERVER_USER` | SSH 사용자 |
| `SERVER_SSH_KEY` | SSH Private Key |

---

---

## 트러블슈팅 기록

### [2026-04-14] MySQL Docker 연결 오류 — 2건

#### 오류 1: `Access denied for user 'appuser'@'localhost'`

**증상**
```
java.sql.SQLException: Access denied for user 'appuser'@'localhost' (using password: YES)
```

**원인**
MySQL Docker 컨테이너는 **볼륨이 비어있을 때만** `MYSQL_USER` / `MYSQL_PASSWORD` 환경변수로 유저를 초기화한다.  
기존 `mysql_data` 볼륨이 남아있으면 초기화 스크립트가 실행되지 않아 `appuser` 계정이 생성되지 않음.

**해결**
```bash
docker compose down -v   # 볼륨 포함 삭제 → 다음 up 시 유저 재생성
```

---

#### 오류 2: `docker compose up --wait` exit code 1

**증상**
```
ProcessExitException: 'docker compose up --no-color --detach --wait' failed with exit code 1
```
컨테이너 로그:
```
[ERROR] [MY-000067] [Server] unknown variable 'default-authentication-plugin=mysql_native_password'
[ERROR] [MY-010119] [Server] Aborting
```

**원인**
`compose.yaml`에 추가했던 `command: --default-authentication-plugin=mysql_native_password` 옵션이 문제.  
해당 옵션은 MySQL 8.0.27에서 deprecated → **MySQL 8.4에서 완전히 제거됨**.  
8.4 이미지에 해당 옵션을 전달하면 서버가 즉시 Abort.

**해결**
1. `compose.yaml`에서 `command:` 라인 완전 제거
2. `application.properties` JDBC URL에 인증 플러그인 명시:
   ```
   ?...&authenticationPlugins=com.mysql.cj.protocol.a.authentication.CachingSha2PasswordPlugin
   ```
   → MySQL 8.4 기본 인증 방식(`caching_sha2_password`)을 JDBC 드라이버가 명시적으로 처리하도록 설정
3. 볼륨 재생성:
   ```bash
   docker compose down -v && ./gradlew bootRun
   ```

**검증**
```bash
docker exec team-mysql-1 mysql -u appuser -ppassword -e "SHOW DATABASES;"
# → schedule_manager 확인 ✅
```

---

### 로컬 실행 방법
```bash
# MySQL 자동 기동 + 애플리케이션 실행
cd team
./gradlew bootRun

# 테스트만 실행
./gradlew test

# JAR 빌드
./gradlew build -x test
```

---

### Phase 7 연결 시 변경 필요 사항 (프론트엔드)
- `authStore.ts`: `login()` → `POST /api/auth/login`
- `teamStore.ts`: mock 데이터 → 실제 API 호출
- `scheduleStore.ts`: `fetchByMonth/Week()` → `GET /api/schedule`
- `api.ts`: `X-User-Id` 헤더 자동 첨부 인터셉터 추가
- `application.properties` (운영): `spring.docker.compose.enabled=false`

---

## Phase 7 (백엔드): 단위 테스트 작성 (2026-04-14)

### 환경 변경
| 항목 | 내용 |
|------|------|
| 테스트 DB | H2 인메모리 (MySQL 의존성 없음) |
| 테스트 프로파일 | `application-test.properties` (`@ActiveProfiles("test")`) |
| Spring Boot 4 대응 | `@WebMvcTest` 제거됨 → `MockMvcBuilders.standaloneSetup()` 사용 |
| Jackson 3.x 대응 | `com.fasterxml.jackson` → `tools.jackson.databind.ObjectMapper` |

### build.gradle 변경
- `mysql:mysql-connector-java:8.0.33` (구 artifact) 제거 → `com.mysql:mysql-connector-j`만 유지
- `testImplementation 'com.h2database:h2'` 추가

### 테스트 파일 목록

| 파일 | 테스트 수 | 주요 케이스 |
|------|---------|-----------|
| `service/UserServiceTest` | 5 | login 성공/401, register 성공/409, 이메일 소문자 변환 |
| `service/TeamServiceTest` | 12 | createTeam owner 자동등록, deleteTeam/403/404, inviteMember/403/404/409, removeMember/403/400/404 |
| `service/ScheduleBlockServiceTest` | 13 | getByMonth, getByWeek ISO주차 파싱, create 시간검증/404, update 부분수정/404, delete/404 |
| `controller/AuthControllerTest` | 7 | POST /login·/register 응답코드 및 validation |
| `controller/TeamControllerTest` | 12 | 모든 팀 엔드포인트 응답코드 + X-User-Id 헤더 검증 |
| `controller/ScheduleBlockControllerTest` | 11 | month/week GET, month 우선순위, POST/PUT/DELETE, 파라미터 누락 400 |
| `TeamApplicationTests` | 1 | H2로 Spring context 로드 확인 |

**총 72개 테스트 전체 통과** (`./gradlew test`)

### 주의사항
- Service 테스트: `@ExtendWith(MockitoExtension.class)` — Spring context 없음, 순수 Mockito
- Controller 테스트: `MockMvcBuilders.standaloneSetup(controller)` — Spring context 없음
- `@SpringBootTest` (`TeamApplicationTests`)만 H2 프로파일 필요
- Mockito strict mode: 사용되지 않는 stub → `UnnecessaryStubbingException` 주의

---

### [2026-04-14] `POST /api/auth/register` HTTP 500 — caching_sha2_password 인증 실패

**증상**
```
java.sql.SQLException: Access denied for user 'root'@'localhost' (using password: YES)
```
- `/api/auth/register` 요청이 ~30초 대기 후 HTTP 500 반환
- 서버 기동은 정상 (8080 포트 응답), DB 컨테이너도 healthy

**원인**
MySQL 8.0 기본 인증 플러그인 `caching_sha2_password`는 TCP/IP 연결 시 비밀번호 암호화를 위해 서버 RSA 공개키가 필요하다.  
공개키가 캐시에 없는 최초 연결이나 connection pool 재연결 시 handshake가 hang → 타임아웃 후 Access denied로 처리됨.  
`allowPublicKeyRetrieval=true`를 JDBC URL에 추가해도 일부 MySQL 8.0 버전/드라이버 조합에서 동작이 불안정함.

**해결**
```sql
-- MySQL 내부에서 실행 (docker exec)
ALTER USER 'appuser'@'%' IDENTIFIED WITH mysql_native_password BY 'password';
ALTER USER 'root'@'%'    IDENTIFIED WITH mysql_native_password BY 'password';
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```

`application.properties` 변경:
```properties
# root 대신 appuser 사용, allowPublicKeyRetrieval 불필요
spring.datasource.url=jdbc:mysql://${DB_HOST:127.0.0.1}:3306/${DB_NAME:schedule_manager}?useSSL=false&characterEncoding=UTF-8&serverTimezone=Asia/Seoul
spring.datasource.username=${DB_USERNAME:appuser}
spring.datasource.password=${DB_PASSWORD:password}
```

서버 재시작 후 정상 동작 확인.

**교훈**
로컬 개발용 MySQL Docker 컨테이너는 `mysql_native_password`로 설정하는 것이 JDBC 호환성 측면에서 가장 안정적.  
운영 환경에서는 SSL + `caching_sha2_password` 조합 권장.
