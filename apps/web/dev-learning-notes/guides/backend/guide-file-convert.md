## 작업요청서 파일 변환 가이드라인

> 이 규칙은 아래 패턴에 해당하는 **작업요청서 파일을 전달받았을 때만** 적용한다.
> - `work-{숫자}.md` (예: `work-079.md`, `work-123.md`)
> - `task-request.md`
>
> 위 패턴 파일 내 `참고 기획서 및 첨부 파일` 섹션에 명시된 파일에 한해 아래 절차를 따른다.

---

### 지원 파일 유형별 처리 방식

| 유형 | 확장자 | 처리 방식 |
| ---- | ------ | --------- |
| 프레젠테이션 | `.pptx` | 스크립트 변환 (아래 절차 참고) |
| 워드 문서 | `.docx` | 스크립트 변환 (아래 절차 참고) |
| 스프레드시트 | `.xlsx` | 스크립트 변환 (아래 절차 참고) |
| PDF | `.pdf` | 변환 없이 직접 읽기 가능 |
| 피그마 | Figma URL | 변환 없이 직접 읽기 가능 |
| 구글 문서 | Google Docs URL | 변환 없이 직접 읽기 가능 |

---

### 변환 스크립트

Office 문서(pptx, docx, xlsx) 텍스트 추출은 **통합 스크립트**로 처리한다.

- **스크립트 위치:** `.claude/skills/parse-spec-doc/scripts/convert-office.sh`
- **변환 우선순위:** PowerShell .NET → Python → LibreOffice (자동 fallback)
- **권장 호출:** `Skill(skill="parse-spec-doc", args="filePath=... outputDir=... taskNumber=...")` — 오케스트레이터(dev-interview/dev-plan/develop)는 sub-skill 경유. 아래 bash 직접 호출은 디버깅·수동 용도.

#### 사용법

```bash
# stdout 출력 (기본)
bash .claude/skills/parse-spec-doc/scripts/convert-office.sh <파일경로>

# 파일로 출력
bash .claude/skills/parse-spec-doc/scripts/convert-office.sh <파일경로> <출력경로>
```

#### 사용 예시

```bash
# PPTX 텍스트 추출 → stdout
bash .claude/skills/parse-spec-doc/scripts/convert-office.sh /c/work/기획서.pptx

# DOCX 텍스트 추출 → 마크다운 파일로 저장
bash .claude/skills/parse-spec-doc/scripts/convert-office.sh /c/work/요구사항.docx /tmp/요구사항.txt

# XLSX 텍스트 추출 → stdout
bash .claude/skills/parse-spec-doc/scripts/convert-office.sh /c/work/데이터.xlsx
```

#### 종료 코드

| 코드 | 의미 |
| ---- | ---- |
| `0` | 성공 |
| `1` | 인수 오류 또는 파일 없음 |
| `2` | 모든 변환 방식 실패 |

---

### 변환 실패 시 대응

스크립트가 종료 코드 `2`로 실패하면 (모든 변환 방식 실패):

1. **Python 패키지 설치 여부를 사용자에게 질문한다:**

> "Office 문서 변환에 필요한 Python 패키지가 설치되어 있지 않습니다. 설치하고 진행할까요?
> ```
> pip install python-pptx python-docx openpyxl
> ```"

- 승인 시 → 설치 후 스크립트 재실행
- 거부 시 → 사용자에게 수동 변환 후 재요청 안내

---

### 처리 흐름 요약

```
작업요청서 수신
  └─ 첨부 파일 확인
       ├─ PDF / Figma URL / Google Docs URL → 직접 읽기
       └─ pptx / docx / xlsx
              └─ bash .claude/skills/parse-spec-doc/scripts/convert-office.sh <파일경로>
                   ├─ 종료 코드 0 → 추출된 텍스트로 작업 진행
                   └─ 종료 코드 2 → Python 패키지 설치 여부 질문
                                      ├─ 승인 → pip install 후 재실행
                                      └─ 거부 → 사용자에게 수동 변환 요청
```
