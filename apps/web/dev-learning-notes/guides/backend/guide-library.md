# 개발 가이드 — 공유 라이브러리

> **적용 대상:** `LIBRARY` 유형 프로젝트
> **유형:** 공유 Java 라이브러리 (JAR 배포)
> **단일 출처:** `.claude/config/workspace.yaml` `projects[]` (type=LIBRARY)

---

## Part 1. 공통 유틸 라이브러리 (예: dino-common-utils)

**아티팩트:** `{{config.commonUtilsArtifact}}`
> 버전은 `workspace.yaml`·각 프로젝트 `pom.xml` 단일 출처.

### 1. 설계 원칙

- **순수 유틸 메소드** — 모든 기능은 `static` 메소드로 제공한다.
- **인스턴스화 방지** — 모든 유틸 클래스는 `private` 생성자를 가진다.
- **상태 없음** — 클래스 내 가변 인스턴스 변수를 두지 않는다.
- **최소 의존성** — Spring (`spring-web`), Lombok, slf4j, 보안 라이브러리만 허용한다.

### 2. 유틸 클래스 표준 구조

```java
/**
 * {기능} 유틸리티 클래스.
 * <p>
 * 모든 메소드는 static이며 인스턴스 생성을 허용하지 않는다.
 * </p>
 *
 * @author 작성자명
 * @since YYYY.MM.DD
 * @version 1.0
 */
public class XxxUtil {

    /**
     * 인스턴스 생성 방지.
     */
    private XxxUtil() {
    }

    /**
     * {메소드 설명}.
     *
     * @param param 파라미터 설명
     * @return 반환값 설명
     * @throws IllegalArgumentException 파라미터가 유효하지 않을 경우
     */
    public static String doSomething(String param) {
        if (!StringUtils.hasText(param)) {
            throw new IllegalArgumentException("Empty param");
        }
        // ...
        return result;
    }
}
```

### 3. 패키지 구조

```
{{config.basePackagePattern}}.common
  ├── compress/
  │   └── GzipUtil.java
  ├── crypto/
  │   ├── AES256Util.java
  │   ├── HmacSHA256Util.java
  │   ├── KISA_SEED_CBC.java
  │   ├── KISA_SEED_ECB.java
  │   ├── SeedUtil.java
  │   └── SHA256HashUtil.java
  ├── date/
  │   └── DateUtil.java
  ├── formats/
  │   ├── FormatUtil.java
  │   └── MaskingUtil.java
  ├── ftp/
  │   ├── FtpInfo.java
  │   ├── FtpStatusCode.java
  │   └── FtpUtil.java
  ├── http/
  │   ├── HttpRequestInfo.java
  │   ├── HttpResponseInfo.java
  │   └── HttpUtil.java
  ├── log/
  │   └── LogUtil.java
  └── validation/
      └── ValidationUtil.java
```

### 4. 허용 의존성

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-web</artifactId>   <!-- StringUtils 등 사용 -->
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-api</artifactId>
    </dependency>
</dependencies>
```

**금지:** Spring Boot, Spring Data, MyBatis, JPA 등 프레임워크 의존성 추가 금지.

### 5. 신규 유틸 추가 절차

1. 기존 유틸 패키지에 동일/유사 기능이 없는지 먼저 확인한다.
2. 여러 프로젝트에서 공통으로 필요한 기능임을 확인한다.
3. **반드시 사용자에게 추가 여부를 확인**한 후 진행한다.
4. 단위 테스트(JUnit 5)를 작성하고 80% 이상 커버리지를 확보한다. (권장)
5. 버전을 올려 배포 후 각 프로젝트의 의존성을 갱신한다.

---

## Part 2. 거래 승인 코어 라이브러리 (예: dino-approval-core)

**아티팩트:** 본 워크스페이스에서는 거래 승인 공통 라이브러리를 별도 LIBRARY 프로젝트로 분리하여 운영한다.
> 그룹·아티팩트·버전은 `workspace.yaml` `projects[].name` + 각 프로젝트 `pom.xml` 단일 출처.

### 1. 설계 원칙

- **Spring 미사용** — 순수 Java 17 + JDBC로 구현한다.
- **Connection 외부 주입** — 트랜잭션 관리는 호출자(caller)가 담당하며, `Connection` 을 파라미터로 주입받는다.
- **Template Method 패턴** — 추상 기반 클래스 `OrdrTrxn` 이 `process()` 를 정의하고, 구체 클래스가 `execute()` 를 구현한다.
- **JDBC 직접 사용** — ORM 없이 `PreparedStatement`, `ResultSet` 을 직접 다룬다.

### 2. 패키지 구조

```
{{config.basePackagePattern}}.approval.core
  ├── ApprovalBiz.java          ← 퍼사드 (외부 진입점)
  ├── common/
  │   ├── BizException.java
  │   ├── CommonQuery.java      ← JDBC 공통 쿼리 실행기
  │   ├── Constants.java
  │   └── ResultCode.java
  ├── model/
  │   ├── ApprovalResult.java   ← 결과 모델
  │   └── TrxnOrdrLdgr.java     ← 트랜잭션 원장 DTO
  ├── service/
  │   ├── OrdrTrxn.java         ← 추상 기반 클래스 (process + execute)
  │   ├── Charge.java           ← 충전
  │   ├── ChargeCancel.java     ← 충전 취소
  │   ├── Pay.java              ← 결제
  │   ├── PayCancel.java        ← 결제 취소
  │   └── ...                   ← 거래 유형별 구현체
  └── util/
      ├── CommonUtil.java
      └── SQLBuffer.java        ← SQL 문자열 빌더
```

### 3. 퍼사드 사용 패턴 (ApprovalBiz)

외부 프로젝트는 `ApprovalBiz` 를 통해서만 기능을 호출한다.
`Connection` 은 반드시 외부에서 주입해야 하며, 커밋/롤백은 호출자가 관리한다.

```java
// 호출 예시
ApprovalBiz approvalBiz = new ApprovalBiz();
ApprovalResult result = approvalBiz.charge(conn, trxnOrdrNo);

if (ResultCode.SUCCESS.getCode().equals(result.getResultCode())) {
    conn.commit();
} else {
    conn.rollback();
}
```

### 4. JDBC 코딩 규칙

```java
public List<TrxnOrdrLdgr> selectTrxnOrdrLdgrList(String trxnOrdrNo, String trxnOrdrSeCd) {
    List<TrxnOrdrLdgr> list = new ArrayList<>();
    PreparedStatement ps = null;
    ResultSet rs = null;

    try {
        SQLBuffer sql = new SQLBuffer();
        sql.append("SELECT ...");
        sql.append("  FROM ...");
        sql.append(" WHERE TRXN_ORDR_NO = ?");

        ps = conn.prepareStatement(sql.toString());
        ps.setString(1, trxnOrdrNo);
        rs = ps.executeQuery();

        while (rs.next()) {
            TrxnOrdrLdgr dto = new TrxnOrdrLdgr();
            dto.setTrxnOrdrNo(rs.getString("TRXN_ORDR_NO"));
            // ... 필드 매핑
            list.add(dto);
        }
    } catch (BizException ex) {
        throw ex;
    } catch (SQLException ex) {
        throw new BizException(ResultCode.ERROR_DB.getCode(), ex.getMessage());
    } finally {
        if (rs != null) try { rs.close(); } catch (Exception ignored) {}
        if (ps != null) try { ps.close(); } catch (Exception ignored) {}
    }
    return list;
}
```

### 5. 신규 거래 유형 추가 절차

1. `service/` 에 새 클래스를 생성하고 `OrdrTrxn` 을 상속한다.
2. `execute()` 메소드에 비즈니스 로직을 구현한다.
3. `ApprovalBiz` 에 퍼사드 메소드를 추가한다.
4. **반드시 사용자에게 추가 여부를 확인**한 후 진행한다.
5. 단위 테스트 작성 후 버전을 올려 배포한다.

### 6. 허용 의존성

```xml
<dependencies>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-api</artifactId>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>   <!-- JDBC 드라이버 -->
    </dependency>
</dependencies>
```

**금지:** Spring, MyBatis, JPA, Hibernate 등 어떠한 프레임워크도 추가하지 않는다.

---

## 공통 체크리스트

- [ ] 유틸 클래스에 `private` 생성자가 선언되어 있는가
- [ ] 모든 메소드가 `static` 인가 (공통 유틸 라이브러리)
- [ ] Spring, MyBatis 등 프레임워크 의존성이 추가되지 않았는가 (거래 승인 코어)
- [ ] `Connection` 을 외부에서 주입받는가 (거래 승인 코어)
- [ ] JDBC 리소스(`ResultSet`, `PreparedStatement`)를 `finally` 블록에서 닫는가 (거래 승인 코어)
- [ ] 신규 기능 추가 전 사용자 확인을 받았는가
