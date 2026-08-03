# Foundations Curriculum Audit

Last reviewed: 2026-07-16

## Outcome

The earlier Foundations seed moved from six basic vowels and nine consonants into grammar after only three alphabet lessons. That left learners unable to decode much of the Korean used later in the app. The first curriculum expansion therefore completes the essential reading sequence before adding more advanced grammar.

The seed now contains 29 original lessons:

- 3 Survival lessons
- 8 Alphabet lessons
- 18 Grammar lessons

This batch added:

1. More vowels and y sounds
2. Aspirated and tense consonants
3. Compound vowels
4. Final consonants (받침) and the seven representative final sounds
5. Liaison and common connected-speech changes
6. Locations, existence, destinations, and the distinction between 에 and 에서

Existing lesson IDs were preserved so saved learner progress remains associated with the same lessons. The older grammar lessons were only moved one position later in display order.

## Source Basis

The lesson text, examples, and exercises in this repository are original. These official resources were used to choose scope, sequence topics, and fact-check Korean forms:

- [King Sejong Institute online curriculum](https://www.iksi.or.kr/lms/main/curriculum.do) — beginner Levels 1–2 and practical communication goals.
- [King Sejong Institute Foundation learning materials](https://www.ksif.or.kr/com/cmm/EgovContentView.do?menuNo=20102200) — official introductory Hangul, pronunciation, beginner, practical, and business Korean materials.
- [Practical Korean 1](https://nuri.iksi.or.kr/front/cms/contents/layout2/learningsejong2022/detail.do?csCmsContentsType=CMS_CONTENTS_TYPE%3A%3ACMS_EBOOK&csCmsMastrSeq=15358&menuSn=664) — early beginner sequence for places, actions, numbers, existence, shopping, food, dates, time, experience, and daily situations.
- [Sejong Korean 1B](https://nuri.iksi.or.kr/front/cms/contents/layout2/learningsejong/detail.do?csCmsMastrSeq=15205&menuSn=649) — beginner progression into location, direction, travel, health, ability, and giving.
- [National Institute of Korean Language: Hangeul composition](https://www.korean.go.kr/eng_hangeul/principle/001.html) — 19 initial consonants, 21 medial vowels, and initial/medial/final syllable structure.
- [National Institute of Korean Language: consonant principles](https://www.korean.go.kr/eng_hangeul/principle/002.html) — plain, aspirated, and tense consonant groups.
- [Standard Korean pronunciation rules](https://korean.go.kr/kornorms/m/m_regltn.do?regltn_code=0002) — representative final sounds and sound-change rules.

## Next Content Priorities

The next useful content batch should add a cumulative Hangul reading checkpoint, directions and transportation, family and honorific language, weather and clothing, and short workplace listening/speaking tasks. Those additions should come with audio or recorded model pronunciation; text-only romanization is not enough for reliable sound contrast training.

## Validation

`lib/foundations-data.test.ts` protects curriculum structure by checking unique IDs, contiguous lesson order, valid exercises, complete modern consonant/vowel coverage, and the presence of the new batchim, connected-reading, and location lessons.
