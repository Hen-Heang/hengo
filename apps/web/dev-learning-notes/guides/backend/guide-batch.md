# 개발 가이드 — Batch / Daemon

> **적용 대상:** `BATCH`, `DAEMON` 유형 프로젝트
> **유형:** Spring Boot 기반 배치/스케줄 서비스
> **단일 출처:** `.claude/config/workspace.yaml` `projects[]` (type=BATCH | DAEMON)
>
> 본 가이드는 **workspace 고유 어노테이션**을 사용한다:
> - `@PlatformBatch` — Job 마커
> - `@DINOMapper` — 주 데이터소스 Mapper
> - `@IHBMapper` — 보조 데이터소스 Mapper
>
> 어노테이션 명·도입 모듈은 본 워크스페이스(`annotations/` 패키지) 정의 단일 출처. 신규 워크스페이스 도입 시 동일 어노테이션 명을 따르거나 본 가이드에서 어노테이션 식별자만 교체한다.

---

## Part 1. BATCH 프로젝트

### 1. 패키지 구조

기본 패키지는 `{{config.basePackagePattern}}.batch` 이며, Job 단위로 패키지를 구성한다.

```
{{config.basePackagePattern}}.batch
  ├── BatchApplication.java
  ├── BatchRunner.java            ← ApplicationRunner 구현체, Job 진입점
  ├── annotations/                ← @PlatformBatch, @DINOMapper, @IHBMapper
  ├── common/
  │   ├── JobProcessor.java       ← Job 인터페이스 (run 메소드 정의)
  │   ├── ServiceProcessor.java   ← Service 기반 추상 클래스
  │   └── model/
  │       ├── BatchResult.java    ← Job 실행 결과 모델
  │       └── dto/                ← 공통 배치 DTO
  ├── config/                     ← MyBatis, DataSource 설정
  ├── constants/                  ← ResultCode, Constants
  ├── exceptions/                 ← BatchException
  └── jobs/
      └── {category}/             ← 도메인 카테고리 (card, payment 등)
          └── {jobName}/
              ├── {JobName}Job.java
              ├── service/
              │   ├── {JobName}Service.java       (인터페이스)
              │   ├── impl/
              │   │   └── {JobName}ServiceImpl.java
              │   └── factory/                    (멀티 구현체 시)
              ├── mapper/
              │   └── {JobName}Mapper.java        (@DINOMapper 또는 @IHBMapper)
              └── model/dto/
                  ├── {Table}{CRUD}{###}In.java
                  └── {Table}{CRUD}{###}Out.java
```

### 2. Job 클래스 구조

모든 Job 클래스는 `@PlatformBatch` 어노테이션과 `JobProcessor` 인터페이스를 구현한다.

```java
@Slf4j
@PlatformBatch(name = "cardOtcRtrvlJob")
@RequiredArgsConstructor
public class CardOtcRtrvlJob implements JobProcessor {

    private final CardOtcRtrvlService cardOtcRtrvlService;

    /**
     * 배치 실행 메소드.
     *
     * @param args 실행 인수
     * @return 배치 실행 결과 {@link BatchResult}
     */
    @Override
    public BatchResult run(String[] args) {
        LocalDateTime jobStartDt = LocalDateTime.now();
        log.info("===== {} START =====", "cardOtcRtrvlJob");
        BatchResult batchResult = cardOtcRtrvlService.process();
        log.info("===== {} END ===== duration: {}", "cardOtcRtrvlJob",
                Duration.between(jobStartDt, LocalDateTime.now()).toMillis());
        return batchResult;
    }
}
```

### 3. Mapper 인터페이스

- BATCH 프로젝트는 `@Mapper` 대신 **커스텀 어노테이션**을 사용한다.
  - `@DINOMapper` — 주 데이터소스 Mapper
  - `@IHBMapper` — 보조 데이터소스 Mapper
- MyBatis XML Mapper 위치: `classpath:{{config.basePackagePattern as path}}/batch/**/mapper/*Mapper.xml`

```java
@DINOMapper
public interface CardPartnershipAprvCnclRprcsJobMapper {

    /**
     * 결제채널 정보 조회.
     *
     * @param paypChnlId 결제채널 ID
     * @return 결제채널명
     */
    String paypChnlInfoR001(String paypChnlId);

    List<PaypPayAprvDmndLdgrR001Out> paypPayAprvDmndLdgrR001(String paypChnlId);

    List<PaypChnlInfoR003Out> paypChnlInfoR003(String paypChnlOtsdIndtfKey);
}
```

### 4. Mapper 메소드 명명 규칙

`{tableNameCamelCase}{C|R|U|D}{###}` 패턴을 따른다.

```
C = INSERT  : predCardIssuLdgrC001(PredCardIssuLdgrC001In)   → String
R = SELECT  : paypPayAprvDmndLdgrR001(String paypChnlId)     → List<Out>
U = UPDATE  : userPayOtCrtHistU001()                         → int
D = DELETE  : (테이블명)D001(...)                              → int
```

- 파라미터가 없는 경우 (파라미터 없는 배치 처리) 허용
- 시퀀스/채번: `get{TableNameCamelCase}()` 패턴 유지

### 5. DTO 명명 규칙

`{TableNameCamelCase}{C|R|U|D}{###}{In|Out}` 패턴을 따른다.

| 유형    | Lombok 어노테이션                                   |
| ------- | --------------------------------------------------- |
| In DTO  | `@Getter @Builder @Alias("lowerCamelCase클래스명")` |
| Out DTO | `@Getter @Setter @Alias("lowerCamelCase클래스명")`  |

```java
@Getter
@Builder
@Alias("predCardIssuLdgrC001In")
public class PredCardIssuLdgrC001In {
    private String paypChnlId;
    private String cardNo;
    private String vprd;
    private String rgtrId;
}
```

### 6. BatchResult 반환 모델

Job은 항상 `BatchResult` 를 반환한다.

```java
BatchResult batchResult = new BatchResult();
batchResult.setResultCode(ResultCode.SUCCESS.getCode());
batchResult.setResultMsg(ResultCode.SUCCESS.getMsg());
batchResult.setTotCnt(totalCount);
batchResult.setFailCnt(failCount);
return batchResult;
```

### 7. Factory 패턴 (멀티 구현체)

복수의 서비스 구현체가 필요한 경우 (예: 결제채널별 처리), Factory 패턴을 사용한다.
Factory의 routing key는 도메인 식별자(`paypChnlId` 등)를 사용한다.

```java
@Component
@Slf4j
public class CardPartnershipAprvCnclRprcsFactory {
    private final Map<String, CardPartnershipAprvCnclRprcsService> services = new HashMap<>();

    public CardPartnershipAprvCnclRprcsFactory(List<CardPartnershipAprvCnclRprcsService> serviceList) {
        serviceList.forEach(s -> services.put(s.paypChannel().getPaypChnlId(), s));
    }

    public CardPartnershipAprvCnclRprcsService getService(final String paypChnlId) {
        CardPartnershipAprvCnclRprcsService service = services.get(paypChnlId);
        if (service == null) {
            throw new BatchException(ResultCode.ERROR_UNEXPECTED.getCode(), "...");
        }
        return service;
    }
}
```

---

## Part 2. DAEMON 프로젝트

### 1. 패키지 구조

기본 패키지는 `{{config.basePackagePattern}}.daemon.{module}` 이며, 멀티모듈 구조를 따른다.

```
{{config.basePackagePattern}}.daemon.{module}
  ├── {ModuleName}Application.java  ← @SpringBootApplication @EnableScheduling
  ├── configs/
  │   ├── ScheduleConfig.java       ← ThreadPoolTaskScheduler 설정
  │   ├── JasyptConfig.java
  │   └── SecurityConfig.java
  ├── constants/                    ← ResultCode, Constants (모듈 내 자체 정의)
  ├── controller/                   ← 헬스체크 등 관리용 엔드포인트
  ├── exception/                    ← 커스텀 예외
  ├── handler/                      ← 전역 예외 핸들러
  ├── mapper/                       ← @Mapper
  ├── model/dto/                    ← {Table}{CRUD}{###}{In|Out}
  ├── schedule/                     ← @Scheduled 스케줄러
  │   ├── {ModuleName}Scheduler.java  (인터페이스)
  │   └── impl/
  │       └── {Agency}{ModuleName}Schedular.java
  └── service/                      ← 비즈니스 로직 (직접 @Service, 인터페이스 없음)
      ├── factory/                  ← Factory (기관별 라우팅)
      └── impl/                     ← 기관별 구현체 (AlarmCommonService 등)
```

### 2. Application 진입점

`@EnableScheduling` 은 반드시 Application 클래스에 선언한다.

```java
@SpringBootApplication
@EnableScheduling
public class AlarmDaemonApplication {
    public static void main(String[] args) {
        SpringApplication.run(AlarmDaemonApplication.class, args);
    }
}
```

### 3. 스레드 풀 설정 (ScheduleConfig)

각 데몬 모듈은 독립적인 스레드 풀을 구성한다.

```java
@Configuration
public class ScheduleConfig implements SchedulingConfigurer {

    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(4);                    // 모듈별 적절한 크기로 설정
        scheduler.setThreadNamePrefix("alarm-daemon"); // 모듈명으로 접두사 설정
        scheduler.initialize();
        taskRegistrar.setTaskScheduler(scheduler);
    }
}
```

### 4. 스케줄러 클래스

- 인터페이스로 메소드를 정의하고, 기관별/용도별 구현체를 작성한다.
- 각 `@Scheduled` 메소드는 try-catch 로 예외를 반드시 처리한다.

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class DefaultAlarmScheduler implements AlarmScheduler {

    private final AlarmTranService alarmTranService;

    @Scheduled(cron = "* * * * * *")
    @Override
    public void msgWaitToCmptn() {
        try {
            alarmTranService.moveWaitToCmptn(Constants.USAG_ID_BIZ);
        } catch (Exception e) {
            log.error("msgWaitToCmptn error :: {}", LogUtil.getStackTrace(e));
        }
    }
}
```

### 5. Service 계층 패턴

- REST_API 프로젝트와 달리, **Service 인터페이스 없이 직접 `@Service` 클래스**를 작성하는 경우가 많다.
- 기관별 분기가 필요한 경우에는 공통 인터페이스를 정의하고 Factory 패턴으로 라우팅한다.

```java
// 직접 Service (인터페이스 없음) — 단일 구현체
@Service
@Slf4j
@RequiredArgsConstructor
public class AlarmTranService {
    private final AlarmTranMapper alarmTranMapper;

    @Transactional(rollbackFor = Exception.class)
    public void moveWaitToCmptn(String usagId) { ... }
}

// 기관별 분기가 필요한 경우 — 인터페이스 + 구현체 + Factory
public interface AlarmCommonService {
    String usagId();
    void sendAlarm(...);
}
```

### 6. Factory 패턴 (기관별 라우팅)

DAEMON 프로젝트의 Factory는 `version()` 이 아닌 `usagId()` 등 도메인 식별자를 routing key로 사용한다.

```java
@Component
@Slf4j
public class AlarmServiceFactory {
    private static final String DEFAULT_USAG_ID = "UA00000000";
    private final Map<String, AlarmCommonService> services = new HashMap<>();

    public AlarmServiceFactory(List<AlarmCommonService> serviceList) {
        serviceList.forEach(s -> services.put(s.usagId(), s));
    }

    public AlarmCommonService getAlarmService(final String usagId) {
        return services.getOrDefault(usagId, services.get(DEFAULT_USAG_ID));
    }
}
```

### 7. Mapper 메소드 명명 규칙

`{tableNameCamelCase}{C|R|U|D}{###}` 패턴을 따른다.
`@Mapper` 어노테이션을 사용한다 (BATCH 프로젝트의 `@DINOMapper` 와 다름).

```java
@Mapper
public interface AlarmTranMapper {
    List<String> ntfkSndngWaitInfoR001(String usagId);
    int ntfkSndngCmptnLdgrC001(List<String> sndngIds);
    int ntfkSndngWaitInfoD001(List<String> sndngIds);
    String getMsgTrxnSn();   // 시퀀스 채번
}
```

### 8. DTO 명명 및 Lombok

`{TableNameCamelCase}{C|R|U|D}{###}{In|Out}` 패턴을 따른다.

| 유형        | Lombok 어노테이션                                            |
| ----------- | ------------------------------------------------------------ |
| In DTO      | `@Getter @Setter @ToString @Alias("lowerCamelCase클래스명")` |
| Out DTO     | `@Getter @Setter @Alias("lowerCamelCase클래스명")`           |
| 일부 In DTO | `@Data @Alias("lowerCamelCase클래스명")` (레거시 허용)       |

---

## 체크리스트

### BATCH

- [ ] Job 클래스에 `@PlatformBatch(name = "...")` 가 선언되어 있는가
- [ ] Job 클래스가 `JobProcessor` 인터페이스를 구현하는가
- [ ] Mapper에 `@DINOMapper` 또는 `@IHBMapper` 어노테이션이 있는가
- [ ] Mapper 메소드명이 `{table}{CRUD}{###}` 패턴을 따르는가
- [ ] DTO에 `@Alias` 가 적용되어 있는가
- [ ] Job 반환 타입이 `BatchResult` 인가

### DAEMON

- [ ] Application 클래스에 `@EnableScheduling` 이 선언되어 있는가
- [ ] `ScheduleConfig` 에 ThreadPoolTaskScheduler 설정이 있는가
- [ ] `@Scheduled` 메소드 내에 try-catch 예외 처리가 있는가
- [ ] 기관별 분기가 필요한 경우 Factory 패턴을 사용하는가
- [ ] Mapper에 `@Mapper` 어노테이션이 있는가
- [ ] DTO에 `@Alias` 가 적용되어 있는가
