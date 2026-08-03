-- Seed a "한강 데이트 (Date at Hangang Park)" intermediate reading unit for the
-- owner account (user_id = 1, Henry Heang / henryheang@gmail.com), sourced
-- from "Real-Life Korean Conversations: Intermediate" (Minsu & Jiyeon go on
-- a date at Hangang Park: cycling, ordering chimaek, the call getting cut
-- off). Guarded on the user existing AND on the title not already being
-- present, so it is a safe no-op on fresh/local databases and will not
-- create a duplicate if this unit was inserted manually beforehand.
-- Uses dollar-quoted (`$json$...$json$::jsonb`) literals so Korean text and
-- apostrophes need no escaping.

INSERT INTO reading_units (user_id, episode, title, title_english, category, level, summary, source,
                           grammar_note, paragraphs, vocab, quiz)
SELECT 1, NULL, '한강 데이트', 'Date at Hangang Park', 'DAILY_LIFE', 'Intermediate',
       'A dialogue between a couple, Minsu and Jiyeon, deciding to spend a sunny afternoon at Hangang Park: renting bicycles, riding around, and ordering chimaek (chicken and beer) for delivery -- only for the phone call to get cut off before they can order beer.',
       'Real-Life Korean Conversations: Intermediate',
       $json${
         "pattern": "-나 봐(요) / -(으)ㄴ 것 같다 (I guess / I think)  ·  -았/었/였으면 좋겠다 / -(으)면 좋겠다 (I wish)",
         "explanation": "-나 봐(요) and -(으)ㄴ 것 같다 both guess at a reason based on what you observe: 날씨가 좋아서 사람들이 다 밖으로 나왔나 봐 = I guess everyone came outside because the weather is nice. -았/었/였으면 좋겠다 (or the present-tense -(으)면 좋겠다) expresses a wish: 매일 날씨가 이렇게 좋았으면 좋겠다 = I wish the weather was this nice every day."
       }$json$::jsonb,
       $json$[
         {"korean": "민수: 자기야, 우리 밥 먹고 뭐 할까?", "english": "Minsu: Honey, what should we do after we eat?"},
         {"korean": "지연: 음... 글쎄. 오늘 날씨도 좋으니까 야외에서 데이트할까?", "english": "Jiyeon: Hmm... I don't know. The weather's nice today, so should we go on an outdoor date?"},
         {"korean": "민수: 그럴까? 그럼 우리 오늘 한강 공원 갈까?", "english": "Minsu: Should we? Then should we go to Hangang Park today?"},
         {"korean": "지연: 오, 그래! 좋아! 그럼 가서 치맥도 먹자!", "english": "Jiyeon: Oh, okay! Sounds good! Let's go and eat chimaek too!"},
         {"korean": "민수: 그래, 그러자!", "english": "Minsu: Okay, let's do that!"},
         {"korean": "민수: 우와, 사람 되게 많다!", "english": "Minsu: Wow, there are so many people!"},
         {"korean": "지연: 진짜네. 날씨가 좋아서 사람들이 다 밖으로 나왔나 봐.", "english": "Jiyeon: You're right. I guess everyone came outside because the weather is nice."},
         {"korean": "민수: 응, 그런가 보다. 자기야, 다리 안 아파?", "english": "Minsu: Yeah, I guess so. Honey, do your legs hurt?"},
         {"korean": "지연: 응, 괜찮아. 날씨가 좋으니까 많이 걸어도 다리가 안 아프네.", "english": "Jiyeon: No, I'm fine. Since the weather's nice, my legs don't hurt even though we walked a lot."},
         {"korean": "민수: 하하. 매일 날씨가 이렇게 좋았으면 좋겠다.", "english": "Minsu: Haha. I wish the weather was this nice every day."},
         {"korean": "지연: 그러게. 자기야, 여기 자전거 빌려주나 봐. 우리 자전거 탈까?", "english": "Jiyeon: Right? Honey, I guess they rent bikes here. Should we ride bikes?"},
         {"korean": "민수: 그래! 2인용 자전거 빌릴까?", "english": "Minsu: Sure! Should we rent a two-seater bike?"},
         {"korean": "지연: 아니. 따로 탈래. 각자 하나씩 빌리자.", "english": "Jiyeon: No. I'll ride separately. Let's each rent one."},
         {"korean": "민수: 아니, 그래도 커플들은 원래...", "english": "Minsu: No, but couples usually..."},
         {"korean": "지연: 아저씨, 1인용 자전거 두 개요!", "english": "Jiyeon: Excuse me, two single-seater bikes please!"},
         {"korean": "민수: 우와! 자전거 오랜만에 타니까 진짜 재밌다!", "english": "Minsu: Wow! It's been a long time since I rode a bike, this is so fun!"},
         {"korean": "지연: 맞아. 너무 재밌었어. 자기야 나 배고파.", "english": "Jiyeon: Right. It was so fun. Honey, I'm hungry."},
         {"korean": "민수: 그치? 나도 이제 슬슬 배고프네. 치맥 시킬까?", "english": "Minsu: Right? I'm getting hungry too. Should we order chimaek?"},
         {"korean": "지연: 좋지! 반반?", "english": "Jiyeon: Sounds great! Half and half?"},
         {"korean": "민수: 응, 그러자! 그럼 내가 시킬게! (전화 통화) 아저씨, 여기 한강 공원 마포지구인데요, 양념 반 후라이드 반으로 갖다 주세요.", "english": "Minsu: Yeah, let's do that! I'll order then! (phone call) Excuse me, we're at the Mapo district of Hangang Park, please bring us half seasoned, half fried chicken."},
         {"korean": "지연: 맥주도!", "english": "Jiyeon: Beer too!"},
         {"korean": "민수: 아, 저기 아저씨, 맥주도 가져다... 아... 끊겼네...", "english": "Minsu: Oh, excuse me, please also bring beer... oh... the call got cut off..."},
         {"korean": "지연: 아, 뭐야. 그럼 자기가 맥주 사 와!", "english": "Jiyeon: Oh, what? Then you go buy the beer!"},
         {"korean": "민수: 알겠어. 저기 앞에 편의점에서 금방 사 올게.", "english": "Minsu: Okay. I'll quickly buy some from the convenience store over there."}
       ]$json$::jsonb,
       $json$[
         {"term": "야외", "meaning": "outside, outdoors", "example": "야외에서 데이트할까?"},
         {"term": "치맥", "meaning": "chicken and beer (short for 치킨과 맥주)", "example": "가서 치맥도 먹자!"},
         {"term": "되게", "meaning": "very, so", "example": "사람 되게 많다!"},
         {"term": "나오다", "meaning": "to come out", "example": "사람들이 다 밖으로 나왔나 봐."},
         {"term": "아프다", "meaning": "to hurt, to ache, to be painful", "example": "다리 안 아파?"},
         {"term": "자전거", "meaning": "bicycle", "example": "우리 자전거 탈까?"},
         {"term": "빌려주다", "meaning": "to lend", "example": "여기 자전거 빌려주나 봐."},
         {"term": "타다", "meaning": "to ride", "example": "자전거 오랜만에 타니까 진짜 재밌다!"},
         {"term": "따로", "meaning": "separately, individually", "example": "따로 탈래."},
         {"term": "각자", "meaning": "respectively, each", "example": "각자 하나씩 빌리자."},
         {"term": "빌리다", "meaning": "to borrow", "example": "각자 하나씩 빌리자."},
         {"term": "오랜만에", "meaning": "in a long time, after not doing so for a long time", "example": "자전거 오랜만에 타니까 진짜 재밌다!"},
         {"term": "배고프다", "meaning": "to be hungry", "example": "자기야 나 배고파."},
         {"term": "시키다", "meaning": "to order", "example": "치맥 시킬까?"},
         {"term": "양념", "meaning": "seasoning, spice", "example": "양념 반 후라이드 반으로 갖다 주세요."},
         {"term": "갖다 주다", "meaning": "to bring", "example": "양념 반 후라이드 반으로 갖다 주세요."},
         {"term": "맥주", "meaning": "beer", "example": "맥주도!"},
         {"term": "끊기다", "meaning": "to lose contact, to get cut off", "example": "아... 끊겼네..."},
         {"term": "편의점", "meaning": "convenience store", "example": "편의점에서 금방 사 올게."}
       ]$json$::jsonb,
       $json$[
         {"question": "민수와 지연이는 밥을 먹고 어디로 가기로 했어요?", "options": ["한강 공원", "영화관", "백화점", "카페"], "answerIndex": 0, "explanation": "날씨가 좋아서 야외 데이트로 한강 공원에 가기로 했어요."},
         {"question": "지연이는 왜 2인용 자전거 대신 1인용 자전거 두 개를 빌렸어요?", "options": ["따로 타고 싶어서", "2인용이 더 비싸서", "2인용이 없어서", "자전거를 못 타서"], "answerIndex": 0, "explanation": "지연이는 \"따로 탈래. 각자 하나씩 빌리자\"라고 말하며 1인용 자전거를 따로 빌렸어요."},
         {"question": "민수가 전화로 치킨을 주문하다가 무슨 일이 생겼어요?", "options": ["전화가 끊겼다", "치킨집이 문을 닫았다", "지연이가 전화를 빼앗았다", "배달이 안 된다고 했다"], "answerIndex": 0, "explanation": "맥주도 가져다 달라고 말하는 중에 전화가 끊겨서 맥주를 주문하지 못했어요."}
       ]$json$::jsonb
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM reading_units WHERE user_id = 1 AND title = '한강 데이트');