-- Seed a batch of high-frequency, commonly-used Korean phrases as vocab_cards
-- for the owner account (user_id = 1, Henry Heang / henryheang@gmail.com),
-- so they show up in the SRS-driven review/test flow (next_review_date
-- defaults to today, mastery defaults to 0).
--
-- These phrases were picked as the most frequently recurring, broadly
-- useful conversational expressions across the TalkToMeInKorean dialogue
-- books reviewed earlier in this session (greetings, fillers, agreement,
-- apology, "just in case", workplace sign-offs, etc.) rather than being
-- tied to any single topic/episode.
--
-- Guarded with NOT EXISTS per term so re-running this migration (or a
-- partial prior insert) will not create duplicate cards.

INSERT INTO vocab_cards (user_id, category, term, meaning, example, pronunciation, difficulty_level)
SELECT 1, 'Common Phrases', v.term, v.meaning, v.example, v.pronunciation, 'Beginner'
FROM (VALUES
    ('처음 뵙겠습니다', 'Nice to meet you (formal, first meeting)', '안녕하세요, 처음 뵙겠습니다.', 'cheo-eum boep-get-sseum-ni-da'),
    ('잘 지냈어요?', 'Have you been doing well?', '오랜만이에요! 잘 지냈어요?', 'jal ji-naess-eo-yo'),
    ('괜찮아요', 'It''s okay / I''m fine', '괜찮아요, 걱정하지 마세요.', 'gwaen-chan-a-yo'),
    ('어쩔 수 없어요', 'There''s nothing I can do about it / I have no choice', '오늘까지 끝내야 해서 어쩔 수 없어요.', 'eo-jjeol su eop-seo-yo'),
    ('그러게요', 'I know, right? / That''s true', '오늘 진짜 춥다. - 그러게요.', 'geu-reo-ge-yo'),
    ('수고하셨어요', 'Good job, thanks for your hard work', '오늘도 수고하셨어요!', 'su-go-ha-syeoss-eo-yo'),
    ('잠깐만요', 'Just a moment', '잠깐만요, 금방 올게요.', 'jam-kkan-man-yo'),
    ('다음에 봐요', 'See you next time', '오늘 즐거웠어요. 다음에 봐요!', 'da-eum-e bwa-yo'),
    ('별로예요', 'Not really / It''s so-so', '그 영화 어땠어요? - 별로였어요.', 'byeol-lo-ye-yo'),
    ('진짜요?', 'Really?', '내일 시험이에요. - 진짜요?', 'jin-jja-yo'),
    ('아쉬워요', 'That''s a shame / It''s a pity', '벌써 가야 돼요? 너무 아쉬워요.', 'a-swi-wo-yo'),
    ('어떡하지?', 'What should I do?', '지갑을 잃어버렸어요. 어떡하지?', 'eo-tteok-ha-ji'),
    ('알겠어요', 'Got it / I understand', '네, 알겠어요. 바로 할게요.', 'al-ge-sseo-yo'),
    ('죄송한데요', 'I''m sorry, but...', '죄송한데요, 길 좀 알려주실 수 있어요?', 'joe-song-han-de-yo'),
    ('어서 오세요', 'Welcome (come on in)', '어서 오세요! 몇 분이세요?', 'eo-seo o-se-yo'),
    ('혹시 몰라서', 'Just in case', '혹시 몰라서 우산 가져왔어요.', 'hok-si mol-la-seo'),
    ('한번 해 볼게요', 'I''ll give it a try', '어려워 보이지만 한번 해 볼게요.', 'han-beon hae bol-ge-yo'),
    ('너무 좋아요', 'I really like it / It''s so good', '이 노래 너무 좋아요!', 'neo-mu jo-a-yo')
) AS v(term, meaning, example, pronunciation)
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM vocab_cards WHERE vocab_cards.user_id = 1 AND vocab_cards.term = v.term);
