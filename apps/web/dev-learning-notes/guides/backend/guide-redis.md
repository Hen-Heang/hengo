# 개발 가이드 — 단일 서비스 (Redis)

> **적용 대상:** Redis 캐시·세션 관리 `SINGLE_SERVICE` 프로젝트 (workspace.yaml `projects[].guidelineOverride` 로 본 가이드 지정)
> **유형:** Spring Boot 기반 Redis 캐시·세션 관리 서비스
> **단일 출처:** `.claude/config/workspace.yaml` `projects[]`

---

## 1. 패키지 구조

기본 패키지는 `{{config.basePackagePattern}}.redis` 이며, 기능 역할별로 패키지를 구성한다.

```
{{config.basePackagePattern}}.redis
  ├── RedisApplication.java
  ├── config/          ← RedisConfig (직렬화, 커넥션 풀 설정)
  ├── constants/       ← ResultCode, Constants, CacheKey (모듈 자체 정의)
  ├── handler/         ← 전역 예외 핸들러 (REST endpoint 있을 경우)
  ├── model/           ← 요청/응답 모델
  ├── service/         ← 비즈니스 로직 (단순하면 직접 @Service)
  ├── cache/           ← 캐시 키 관리, TTL 정책, 캐시 연산
  └── session/         ← 세션 저장소 처리 (세션 관리 기능 있을 경우)
```

---

## 2. 클래스 명명 규칙

| 역할 | 패턴 | 예시 |
|------|------|------|
| 캐시 관리 | `{Domain}CacheService` | `UserTokenCacheService`, `SessionCacheService` |
| 캐시 키 정의 | `{Domain}CacheKey` | `UserCacheKey`, `PaymentCacheKey` |
| 설정 | `RedisConfig` | `RedisConfig` |

---

## 3. 서비스 메소드 명명

```
cache{Entity}()       예: cacheUserToken()
evict{Entity}()       예: evictExpiredToken()
get{Entity}Cache()    예: getUserTokenCache()
set{Entity}Cache()    예: setUserSessionCache()
```

---

## 4. Redis 설정 규칙

`RedisConfig` 에서 직렬화 방식과 커넥션 풀을 명시적으로 설정한다.

```java
/**
 * Redis 연결 및 직렬화 설정.
 *
 * @author 작성자명
 * @since YYYY.MM.DD
 * @version 1.0
 */
@Configuration
public class RedisConfig {

    /**
     * RedisTemplate 빈을 구성한다.
     * Key는 String, Value는 JSON 직렬화를 사용한다.
     *
     * @param connectionFactory Redis 커넥션 팩토리
     * @return 구성된 {@link RedisTemplate}
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }
}
```

---

## 5. 캐시 키 관리

캐시 키는 상수로 정의하고, 네임스페이스 패턴으로 구성하여 키 충돌을 방지한다.

```java
// ✅ 상수로 정의
public class UserCacheKey {
    public static final String TOKEN_PREFIX = "user:token:";
    public static final String SESSION_PREFIX = "user:session:";

    private UserCacheKey() {}

    public static String tokenKey(String userId) {
        return TOKEN_PREFIX + userId;
    }
}

// ✅ 사용 예시
redisTemplate.opsForValue().set(UserCacheKey.tokenKey(userId), token, Duration.ofHours(1));
```

---

## 6. TTL 정책

- TTL은 반드시 명시적으로 설정한다. TTL 없는 영구 저장을 지양한다.
- TTL 값은 상수(`constants/`)로 관리한다.

```java
// ✅ 허용 — TTL 명시
redisTemplate.opsForValue().set(key, value, Duration.ofMinutes(30));

// ❌ 금지 — TTL 미설정 (영구 저장)
redisTemplate.opsForValue().set(key, value);
```

---

## 7. 응답 템플릿

- REST endpoint를 제공하는 경우, 모듈 내 자체 `ResponseTemplate` 을 정의하여 사용한다.
- 타 모듈의 `ResponseTemplate` 을 공유하지 않는다.

---

## 체크리스트

- [ ] 패키지 구조에 `cache/` 가 구성되어 있는가
- [ ] `ResultCode` / `Constants` 를 모듈 내 자체 정의하는가 (common 모듈 미참조)
- [ ] `RedisConfig` 에 Key/Value 직렬화가 명시적으로 설정되어 있는가
- [ ] 캐시 키가 상수 또는 네임스페이스 패턴으로 관리되는가
- [ ] 모든 캐시 저장에 TTL이 명시적으로 설정되어 있는가
- [ ] REST endpoint 제공 시 `ResponseTemplate` 이 모듈 자체 클래스로 사용되는가
