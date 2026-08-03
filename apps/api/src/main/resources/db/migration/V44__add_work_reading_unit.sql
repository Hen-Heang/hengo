-- Seed an original "회사 생활 (Work Life)" beginner reading unit for the owner
-- account (user_id = 1, Henry Heang / henryheang@gmail.com). This is NOT a
-- Choisusu podcast transcript like the other reading units (V23/V32/V40) --
-- it was written for this migration to cover work/office-life vocabulary,
-- which the existing podcast-sourced units don't have. Guarded on the user
-- existing AND on the title not already being present, so it is a safe
-- no-op on fresh/local databases and will not create a duplicate if this
-- unit was inserted manually beforehand.
-- Uses dollar-quoted (`$json$...$json$::jsonb`) literals so Korean text and
-- apostrophes need no escaping.

INSERT INTO reading_units (user_id, episode, title, title_english, category, level, summary, source,
                           grammar_note, paragraphs, vocab, quiz)
SELECT 1, NULL, '회사 생활', 'Work Life', 'DAILY_LIFE', 'Beginner',
       'A short monologue about everyday office life in Korea: commuting, job duties, lunch with coworkers, occasional overtime, the relationship with a boss and teammates, and the stresses and small joys of working life.',
       'Original content (written for KoriAI)',
       $json${
         "pattern": "VERB/된 지 + Time + 됐어요 (It has been Time since...)  ·  어쩔 수 없다 (can't help it, no choice)",
         "explanation": "-(으)ㄴ 지 + time + 됐어요 expresses how much time has passed since something happened: 회사원이 된 지 3년 됐어요 = It's been 3 years since I became an office worker. 어쩔 수 없다 means there's no other option or you just have to accept something: 야근하면 피곤하지만 어쩔 수 없어요 = Working overtime is tiring, but there's nothing I can do about it."
       }$json$::jsonb,
       $json$[
         {"korean": "안녕하세요 여러분~ 오늘은 제 직장 생활에 대해 이야기할 거예요. 저는 작은 회사에서 일하고 있어요. 회사원이 된 지 3년 됐어요.", "english": "Hello everyone~ Today I'm going to talk about my work life. I work at a small company. It's been 3 years since I became an office worker."},
         {"korean": "저는 아침 7시에 일어나서 출근 준비를 해요. 회사까지 지하철로 30분 정도 걸려요. 9시까지 출근해야 해서 보통 8시에 집에서 나가요.", "english": "I wake up at 7am and get ready for work. It takes about 30 minutes to the office by subway. I have to be at work by 9, so I usually leave home at 8."},
         {"korean": "제 일은 마케팅이에요. 회사 제품을 홍보하는 일을 해요. 매일 이메일을 확인하고 회의에 참석해요.", "english": "My job is marketing. I promote the company's products. Every day I check emails and attend meetings."},
         {"korean": "점심시간에는 동료들하고 같이 먹어요. 회사 근처에 맛있는 식당이 많아서 점심시간이 제일 좋아요.", "english": "At lunchtime, I eat with my coworkers. There are a lot of good restaurants near the office, so lunchtime is my favorite part of the day."},
         {"korean": "가끔 일이 많으면 야근을 해요. 야근하면 피곤하지만 어쩔 수 없어요. 그래도 야근한 다음 날은 보통 늦게 출근해도 돼요.", "english": "Sometimes when there's a lot of work, I stay late. It's tiring, but there's nothing I can do about it. Still, the day after working overtime, I can usually come in a bit later."},
         {"korean": "제 상사는 좋은 사람이에요. 친절하고 일을 잘 가르쳐 줘요. 그런데 회의가 너무 많아서 가끔 힘들어요.", "english": "My boss is a good person. They're kind and teach me well. But there are so many meetings that it's sometimes hard."},
         {"korean": "회사 동료들하고도 친해요. 가끔 퇴근하고 같이 저녁을 먹거나 커피를 마셔요.", "english": "I'm also close with my coworkers. Sometimes after work we get dinner together or have coffee."},
         {"korean": "일하면서 힘든 점도 있어요. 스트레스를 많이 받을 때도 있고, 가끔 실수해서 속상할 때도 있어요. 그래도 월급 받는 날은 정말 기뻐요.", "english": "There are hard parts about work, too. Sometimes I get really stressed, and sometimes I make a mistake and feel upset. But still, payday makes me really happy."},
         {"korean": "저는 지금 하는 일을 좋아해요. 그렇지만 나중에는 제 사업을 시작하고 싶어요. 여러분은 어떤 일을 하고 싶어요? 댓글로 알려 주세요!", "english": "I like the work I do now. But someday I want to start my own business. What kind of work do you want to do? Let me know in the comments!"}
       ]$json$::jsonb,
       $json$[
         {"term": "회사원", "meaning": "office worker", "example": "회사원이 된 지 3년 됐어요."},
         {"term": "출근하다", "meaning": "to go to work, to commute", "example": "9시까지 출근해야 해요."},
         {"term": "마케팅", "meaning": "marketing", "example": "제 일은 마케팅이에요."},
         {"term": "홍보하다", "meaning": "to promote, to publicize", "example": "회사 제품을 홍보하는 일을 해요."},
         {"term": "회의", "meaning": "meeting", "example": "매일 회의에 참석해요."},
         {"term": "동료", "meaning": "coworker, colleague", "example": "점심시간에는 동료들하고 같이 먹어요."},
         {"term": "야근하다", "meaning": "to work overtime, to work late", "example": "가끔 일이 많으면 야근을 해요."},
         {"term": "어쩔 수 없다", "meaning": "can't help it, to have no choice", "example": "야근하면 피곤하지만 어쩔 수 없어요."},
         {"term": "상사", "meaning": "boss, superior", "example": "제 상사는 좋은 사람이에요."},
         {"term": "친절하다", "meaning": "to be kind", "example": "상사가 친절하고 일을 잘 가르쳐 줘요."},
         {"term": "가르치다", "meaning": "to teach", "example": "일을 잘 가르쳐 줘요."},
         {"term": "스트레스 받다", "meaning": "to get stressed", "example": "스트레스를 많이 받을 때도 있어요."},
         {"term": "실수하다", "meaning": "to make a mistake", "example": "가끔 실수해서 속상할 때도 있어요."},
         {"term": "속상하다", "meaning": "to be upset, to feel hurt", "example": "실수해서 속상해요."},
         {"term": "월급", "meaning": "salary, monthly pay", "example": "월급 받는 날은 정말 기뻐요."},
         {"term": "사업", "meaning": "business", "example": "나중에는 제 사업을 시작하고 싶어요."}
       ]$json$::jsonb,
       $json$[
         {"question": "화자는 회사원이 된 지 얼마나 됐어요?", "options": ["3년", "1년", "5년", "10년"], "answerIndex": 0, "explanation": "회사원이 된 지 3년 됐다고 했어요."},
         {"question": "화자의 일은 무엇이에요?", "options": ["마케팅", "디자인", "회계", "영업"], "answerIndex": 0, "explanation": "화자의 일은 마케팅이고, 회사 제품을 홍보하는 일을 한다고 했어요."},
         {"question": "화자가 가장 행복한 날은 언제예요?", "options": ["월급 받는 날", "회의하는 날", "야근하는 날", "출근하는 날"], "answerIndex": 0, "explanation": "힘든 점도 있지만 월급 받는 날은 정말 기쁘다고 했어요."}
       ]$json$::jsonb
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM reading_units WHERE user_id = 1 AND title = '회사 생활');
