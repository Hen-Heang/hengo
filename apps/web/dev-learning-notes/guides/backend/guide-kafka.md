# 개발 가이드 — 단일 서비스 (Kafka)

> **적용 대상:** Kafka 메시지 발행·소비 `SINGLE_SERVICE` 프로젝트 (workspace.yaml `projects[].guidelineOverride` 로 본 가이드 지정)
> **유형:** Spring Boot 기반 Kafka 메시지 발행·소비 서비스
> **단일 출처:** `.claude/config/workspace.yaml` `projects[]`

---

## 1. 패키지 구조

기본 패키지는 `{{config.basePackagePattern}}.kafka` 이며, 발행·소비 역할별로 패키지를 구성한다.

```
{{config.basePackagePattern}}.kafka
  ├── KafkaApplication.java
  ├── config/          ← KafkaProducerConfig, KafkaConsumerConfig
  ├── constants/       ← ResultCode, Constants (모듈 자체 정의)
  ├── handler/         ← 전역 예외 핸들러 (REST endpoint 있을 경우)
  ├── model/           ← 메시지·요청·응답 모델
  ├── service/         ← 비즈니스 로직 (단순하면 직접 @Service)
  ├── producer/        ← 메시지 발행 컴포넌트
  └── consumer/        ← 메시지 소비 컴포넌트
```

---

## 2. 클래스 명명 규칙

| 역할   | 패턴                | 예시                                           |
| ------ | ------------------- | ---------------------------------------------- |
| 발행자 | `{Domain}Producer`  | `PaymentEventProducer`, `AlarmMessageProducer` |
| 소비자 | `{Domain}Consumer`  | `PaymentEventConsumer`, `AlarmMessageConsumer` |
| 설정   | `Kafka{Role}Config` | `KafkaProducerConfig`, `KafkaConsumerConfig`   |

---

## 3. 서비스 메소드 명명

```
publish{Entity}()     예: publishPaymentEvent()
consume{Entity}()     예: consumeAlarmMessage()
send{Entity}()        예: sendNotificationMessage()
```

---

## 4. Producer 코딩 규칙

`KafkaTemplate` 을 사용하며, 비동기 전송 결과를 반드시 처리한다.

```java
/**
 * 결제 이벤트를 Kafka 토픽에 발행한다.
 *
 * @param payload 발행할 메시지 페이로드
 */
public void publishPaymentEvent(String payload) {
    kafkaTemplate.send(topicName, payload)
        .whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Kafka 발행 실패 :: topic={}, error={}", topicName, LogUtil.getStackTrace(ex));
            } else {
                log.debug("Kafka 발행 성공 :: topic={}, offset={}", topicName,
                    result.getRecordMetadata().offset());
            }
        });
}
```

---

## 5. Consumer 코딩 규칙

`@KafkaListener` 메소드는 반드시 예외를 처리하여 재처리(retry) 루프를 방지한다.

```java
/**
 * 알림 메시지를 소비하여 처리한다.
 *
 * @param record 소비할 Kafka 레코드
 */
@KafkaListener(topics = "${kafka.topic.alarm}", groupId = "${kafka.group-id}")
public void consumeAlarmMessage(ConsumerRecord<String, String> record) {
    try {
        // 메시지 처리 로직
        log.info("Kafka 소비 :: topic={}, offset={}", record.topic(), record.offset());
    } catch (Exception e) {
        log.error("consumeAlarmMessage 오류 :: topic={}, offset={}, error={}",
            record.topic(), record.offset(), LogUtil.getStackTrace(e));
    }
}
```

---

## 6. 설정 규칙

- 토픽명은 상수(`constants/`)로 관리하거나 `@Value` 로 외부화한다.

---

## 7. Factory 패턴

복수의 토픽·메시지 유형 분기가 필요한 경우에만 적용한다. 단일 토픽이면 불필요.

---

## 8. 응답 템플릿

- REST endpoint를 제공하는 경우, 모듈 내 자체 `ResponseTemplate` 을 정의하여 사용한다.

---

## 체크리스트

- [ ] 패키지 구조에 `producer/`, `consumer/` 가 구성되어 있는가
- [ ] `ResultCode` / `Constants` 를 모듈 내 자체 정의하는가 (common 모듈 미참조)
- [ ] `@KafkaListener` 메소드에 try-catch 예외 처리가 있는가
- [ ] Producer 비동기 전송 결과(`whenComplete`)를 처리하는가
- [ ] 토픽명이 상수 또는 `@Value` 로 외부화되어 있는가
