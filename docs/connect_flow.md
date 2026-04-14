# DB 연결 흐름 정리

## 로컬 개발 환경 기준 (`./gradlew bootRun`)

```
./gradlew bootRun
    │
    ├─ [1] Spring Boot Docker Compose 통합 감지
    │       compose.yaml 읽음
    │       MySQL 컨테이너가 이미 실행 중 → 기동 건너뜀
    │
    ├─ [2] 컨테이너 환경변수 읽기
    │       MYSQL_USER=appuser
    │       MYSQL_PASSWORD=password
    │       MYSQL_DATABASE=schedule_manager
    │
    ├─ [3] Spring Boot가 JdbcConnectionDetails 자동 생성
    │       url      = jdbc:mysql://localhost:3306/schedule_manager
    │                  ↑ allowPublicKeyRetrieval 등 추가 파라미터 없음
    │       username = appuser
    │       password = password
    │
    ├─ [4] 우선순위 충돌
    │       JdbcConnectionDetails (Docker Compose) > spring.datasource.* (properties)
    │       → application.properties의 JDBC URL 무시됨
    │
    └─ [5] Hikari 커넥션 풀 연결 시도
            jdbc:mysql://localhost:3306/schedule_manager (파라미터 없음)
            MySQL 8.4 기본 인증: caching_sha2_password
            → RSA 공개키 교환 필요 (allowPublicKeyRetrieval=true 없음)
            → Access denied ❌
```

---

## 문제의 핵심

| 항목 | 내용 |
|------|------|
| MySQL 8.4 기본 인증 방식 | `caching_sha2_password` |
| 첫 TCP 연결 시 요구 사항 | RSA 공개키 교환 또는 SSL |
| JDBC 파라미터 필요 | `allowPublicKeyRetrieval=true` |
| Docker Compose 통합이 생성하는 URL | 기본 파라미터 없음 → 인증 실패 |
| `application.properties` URL | `allowPublicKeyRetrieval=true` 포함 → 정상 작동 가능 |
| 왜 무시되나 | Docker Compose 통합의 `JdbcConnectionDetails`가 properties보다 우선순위 높음 |

---

## 해결 방법 (적용됨)

`DockerComposeServiceConnectionAutoConfiguration`을 제외해 Docker Compose가
`spring.datasource.*` 를 덮어쓰지 않도록 설정.

```properties
# application.properties
spring.autoconfigure.exclude=\
  org.springframework.boot.docker.compose.service.connection.DockerComposeServiceConnectionAutoConfiguration
```

**결과:**
- Docker Compose 라이프사이클 관리(`start-and-stop`)는 그대로 동작
- `spring.datasource.url` (allowPublicKeyRetrieval=true 포함) 이 그대로 사용됨
- 인증 성공 ✅

---

## 연결 계정 정보

| 항목 | 값 (기본값) | 환경변수 오버라이드 |
|------|------------|-------------------|
| 호스트 | `localhost` | `DB_HOST` |
| 포트 | `3306` | `DB_PORT` |
| DB명 | `schedule_manager` | `DB_NAME` |
| 사용자 | `appuser` | `DB_USERNAME` |
| 비밀번호 | `password` | `DB_PASSWORD` |

> `root` 계정은 MySQL 관리용으로만 존재. Spring Boot 애플리케이션은 `appuser`로만 연결.

---

## 자주 발생하는 에러

### `Access denied for user 'appuser'@'localhost'`

**원인 A** — Docker 볼륨이 남아있어 유저 초기화 안 됨  
```bash
docker compose down -v   # 볼륨 포함 삭제 후 재시작
```

**원인 B** — Docker Compose가 JDBC URL을 덮어써서 `allowPublicKeyRetrieval` 파라미터 손실  
→ `spring.autoconfigure.exclude` 설정으로 해결 (위 참고)

### `unknown variable 'default-authentication-plugin'`

**원인** — MySQL 8.4에서 해당 옵션 완전 제거 (8.0.27 deprecated → 8.4 removed)  
→ `compose.yaml`의 `command:` 라인 제거, JDBC URL에 `authenticationPlugins` 파라미터로 대응
