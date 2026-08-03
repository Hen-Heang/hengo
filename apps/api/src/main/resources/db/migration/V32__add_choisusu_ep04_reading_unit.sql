-- Seed the Choisusu EP 04 "일 (Work)" beginner reading unit for the owner
-- account (user_id = 1). Guarded on the user existing AND on the episode not
-- already being present, so it is a safe no-op on fresh/local databases and
-- will not create a duplicate if EP 04 was inserted manually beforehand.
-- Uses dollar-quoted (`$json$...$json$::jsonb`) literals so Korean text and
-- apostrophes need no escaping.

INSERT INTO reading_units (user_id, episode, title, title_english, category, level, summary, source,
                           grammar_note, paragraphs, vocab, quiz)
SELECT 1, 'EP 04', '일', 'Work', 'DAILY_LIFE', 'Beginner',
       'Choisusu talks about work and part-time jobs. She describes her tiring past office life — the long commute by bus and subway, eating breakfast at her desk, working 8 to 5, and getting home too exhausted for any hobbies — and why she quit: she valued her own time and enjoyable work over a steady monthly salary. Now she teaches Korean online and works a morning cafe job, with YouTube as a hobby on the side.',
       'Choisusu Korean Podcast',
       $json${
         "pattern": "(시간이) 걸리다 (take time)  ·  Noun하고 Noun (and)",
         "explanation": "(시간이) 걸리다 says how long something takes: 집에서 회사까지 버스로 한 시간이 걸렸어요 = It took an hour by bus from home to the office. Ask the length with 얼마나 걸려요? = How long does it take? — e.g. A: 집에서 학교까지 얼마나 걸려요? B: 1시간 걸려요. Noun하고 Noun links two nouns with \"and\": 과일하고 커피를 먹었어요 = I ate fruit and coffee; 저는 비빔밥하고 만두를 주세요 = Bibimbap and dumplings for me, please."
       }$json$::jsonb,
       $json$[
         {"korean": "안녕하세요~ 오늘은 일에 대해서 이야기할 거예요. 여러분은 지금 일을 하고 있어요? 여러분의 직업은 뭐예요? 또는 지금 아르바이트를 하고 있어요? 오늘은 일과 아르바이트에 대해서 이야기할 거예요.", "english": "Hello~ Today I'm going to talk about work. Are you working right now? What is your job? Or are you doing a part-time job right now? Today I'll talk about work and part-time jobs."},
         {"korean": "저는 지금 일을 하고 있어요. 한국어를 가르치고 있어요. 저는 집에서 일을 해요. 저는 집에서 일하는 것을 좋아해요. 왜냐하면 회사에 가는 것이 힘들었어요. 저는 2년 전에 회사에 다녔어요. 집에서 회사까지 버스로 한 시간이 걸렸어요. 그런데 아침에 차가 너무 많아서 오래 걸렸어요.", "english": "I'm working right now. I teach Korean. I work from home, and I like working from home, because going in to a company was hard. Two years ago I used to work at a company. It took an hour by bus from home to the office. But in the morning there was so much traffic that it took a long time."},
         {"korean": "그래서 회사에 가는데 가끔 한 시간 반이 걸렸어요. 버스를 타고 지하철역에 가서 환승했어요. 그리고 회사로 10분 정도 걸어서 가요. 그래서 아침에 한 시간에서 한 시간 반 정도 걸렸어요. 아침에 여섯 시에 일어나서 준비하고 출근했어요. 그래서 보통 아침 7시 30분에 도착했어요.", "english": "So getting to work sometimes took an hour and a half. I took a bus to the subway station and transferred. Then I walked about 10 minutes to the office. So in the morning it took about one to one and a half hours. I woke up at six, got ready, and commuted, so I usually arrived around 7:30 a.m."},
         {"korean": "회사에 갈 때 빵집에 가서 샌드위치를 샀어요. 그래서 일하기 전에 샌드위치를 먹었어요. 가끔 집에서 과일을 준비해요. 그리고 아침으로 회사에서 과일하고 커피를 먹었어요. 아침에는 졸려서 항상 아메리카노를 마셨어요. 가끔 카페에 가서 커피를 사고 가끔 회사에서 만들었어요.", "english": "On my way to work I went to the bakery and bought a sandwich, so I ate a sandwich before working. Sometimes I prepared fruit at home. For breakfast I had fruit and coffee at the office. In the mornings I was sleepy, so I always drank an americano. Sometimes I bought coffee at a cafe, and sometimes I made it at the office."},
         {"korean": "그리고 8시에 일을 시작해요. 8시부터 1시까지 열심히 일을 했어요. 1시부터 2시까지 점심시간이었어요. 가끔 점심으로 회사에서 샐러드를 먹었어요. 그런데 보통 동료하고 식당에 갔어요. 식당에서 같이 밥을 먹었어요. 식당에서 밥을 먹은 후에 카페에 갔어요. 그리고 커피를 사서 같이 회사에 갔어요. 그리고 5시까지 일을 했어요.", "english": "I started work at 8. I worked hard from 8 to 1. From 1 to 2 was lunchtime. Sometimes I ate a salad at the office for lunch, but usually I went to a restaurant with my coworkers. We ate together there, and after eating we went to a cafe. We bought coffee and went back to the office together. And I worked until 5."},
         {"korean": "5시에 퇴근해서 집에 가면 6시 반이었어요. 금요일에 차가 많아서 늦으면 7시였어요. 그래서 집에 도착해서 씻고 밥을 먹어요. 그러면 8시예요. 벌써 저녁이에요. 저녁에 너무 피곤해서 취미 활동을 할 수 없었어요. 그래서 저의 시간이 없어서 슬펐어요. 그리고 제가 하고 싶은 일이 아니었어요.", "english": "I left work at 5, and by the time I got home it was 6:30. On Fridays there was a lot of traffic, so if I was late it was 7. After getting home I washed up and ate, and then it was already 8 — already evening. In the evening I was too tired to do any hobbies. So I was sad that I had no time for myself. And it wasn't the work I wanted to do."},
         {"korean": "회사에 갈 때하고 집에 올 때 힘들었고 정말 지루했어요. 아침부터 저녁까지 회사에 계속 있는 게 너무 싫었어요. 그리고 제 시간이 없는 것이 가장 문제였어요. '제가 그만두고 싶어요.' 말했을 때 주위 사람들이 다 '모든 사람들이 이렇게 살고 있으니까 너도 잘할 수 있어' 라고 말했지만 저는 너무 싫었어요.", "english": "The commute to and from work was hard and really boring. I hated staying at the office from morning to evening. And not having time for myself was the biggest problem. When I said 'I want to quit,' everyone around me said 'Everyone lives like this, so you can do it too,' but I really hated it."},
         {"korean": "다른 사람들은 할 수 있지만 저는 하고 싶지 않았어요. 제가 원하는 일이 아니었고 재미가 없었어요. 한 달에 한 번 항상 같은 돈을 받을 수 있지만 저는 돈이 가장 중요하지 않은 것 같아요. 제 시간과 제가 재미있고 하고 싶은 일이 가장 중요해요. 전에는 몰랐지만 회사에 다니면서 그것을 알았어요.", "english": "Other people can do it, but I didn't want to. It wasn't the work I wanted, and it wasn't fun. You can get the same pay once a month, but for me money doesn't seem to be the most important thing. My own time, and work that is fun and that I want to do, are the most important. I didn't know that before, but I realized it while working at the company."},
         {"korean": "그래서 회사를 그만두고 지금 온라인으로 한국어를 가르치고 있어요. 집에서 일할 수 있어서 정말 좋고 제가 하고 싶은 시간에 일을 할 수 있어요. 사실 저는 집에 있는 것을 좋아해서 이 일이 정말 좋아요. 수업이 없을 때는 운동도 할 수 있고 취미 생활도 할 수 있어요.", "english": "So I quit the company and now I teach Korean online. It's really nice that I can work from home and work at the times I want. Actually, I like being at home, so I really love this job. When I don't have a class, I can exercise and enjoy my hobbies too."},
         {"korean": "그리고 회사에 갈 때 버스하고 지하철을 타고 아침하고 점심을 사서 돈을 많이 썼어요. 하지만 지금은 집에서 일해서 돈을 안 써요. 집에서 아침하고 점심을 만들어서 먹어요. 지금 일을 할 때도 가끔 스트레스를 받지만 그래도 괜찮아요.", "english": "Also, when I commuted I took the bus and subway and bought breakfast and lunch, so I spent a lot of money. But now I work from home, so I don't spend money. I make and eat breakfast and lunch at home. Even now I sometimes get stressed at work, but it's still okay."},
         {"korean": "그리고 카페에서 일을 하고 있어요. 카페 일은 저에게 아르바이트라고 생각해요. 왜냐하면 보통 오전에만 일해요. 커피를 만드는 것이 재미있고 제가 커피를 좋아해서 저에게 잘 맞는 일인 것 같아요. 한국어를 가르치는 일을 할 때는 제가 시간을 정할 수 있어서 좋아요.", "english": "I also work at a cafe. I think of the cafe work as a part-time job, because I usually only work in the mornings. Making coffee is fun and I like coffee, so it seems like a good fit for me. With teaching Korean, I like that I can set my own hours."},
         {"korean": "하지만 카페에서 일할 때 항상 오전에 일을 해요. 그래서 시간을 못 바꿔요. 한국어 가르치는 일을 하면 보통 한 주에 한 번 또는 이 주에 한 번 돈을 받을 수 있어요. 그런데 카페에서 일하면 한 달에 한 번 돈을 받아요. 보통 한국에서 일이나 아르바이트를 할 때는 한 달에 한 번 돈을 받을 수 있어요. 그리고 일을 못 할 때는 보통 한 달 전에 이야기해요. 그러면 다른 아르바이트생이 일을 대신해 줘요.", "english": "But when I work at the cafe I always work in the morning, so I can't change my hours. With teaching Korean I usually get paid once a week or once every two weeks, but at the cafe I get paid once a month. Usually for a job or part-time job in Korea you get paid once a month. And when you can't work, you usually tell them a month in advance, and then another part-timer covers your shift."},
         {"korean": "저는 지금 일을 두 개하고 있는데 다 좋아하는 일이에요. 그리고 유튜브도 취미로 하고 있어요. 많은 영상을 업로드하지 못하지만 열심히 하려고 해요. 저는 요즘은 이렇게 일을 하고 있어요.", "english": "I'm doing two jobs right now, and I like both of them. I also do YouTube as a hobby. I can't upload many videos, but I'm trying my best. These days, this is how I work."},
         {"korean": "여러분은 어떤 일을 하고 있어요? 여러분은 싫어하지만 계속 일을 하고 있어요? 또는 좋아하는 일을 하고 있어요? 여러분의 일에 대해서 댓글로 써 주세요. 그럼 다음에 봐요.", "english": "What kind of work do you do? Are you doing work you dislike but keep doing anyway? Or are you doing work you love? Please write about your work in the comments. See you next time."}
       ]$json$::jsonb,
       $json$[
         {"term": "직업", "meaning": "job / occupation", "example": "여러분의 직업은 뭐예요?"},
         {"term": "아르바이트", "meaning": "part-time job", "example": "지금 아르바이트를 하고 있어요?"},
         {"term": "회사", "meaning": "company / office", "example": "저는 2년 전에 회사에 다녔어요."},
         {"term": "다니다", "meaning": "to attend / commute to (work, school)", "example": "회사에 다녔어요."},
         {"term": "걸리다", "meaning": "to take (time)", "example": "집에서 회사까지 버스로 한 시간이 걸렸어요."},
         {"term": "환승하다", "meaning": "to transfer (transit)", "example": "지하철역에 가서 환승했어요."},
         {"term": "출근하다", "meaning": "to go to work / commute", "example": "준비하고 출근했어요."},
         {"term": "퇴근하다", "meaning": "to leave work / clock out", "example": "5시에 퇴근해서 집에 가요."},
         {"term": "졸리다", "meaning": "to be sleepy", "example": "아침에는 졸려서 항상 아메리카노를 마셨어요."},
         {"term": "지루하다", "meaning": "to be bored / boring", "example": "회사에 갈 때 정말 지루했어요."},
         {"term": "그만두다", "meaning": "to quit / stop (doing)", "example": "그래서 회사를 그만뒀어요."},
         {"term": "정하다", "meaning": "to decide / set", "example": "제가 시간을 정할 수 있어서 좋아요."},
         {"term": "바꾸다", "meaning": "to change", "example": "항상 오전에 일해서 시간을 못 바꿔요."},
         {"term": "대신하다", "meaning": "to replace / cover for", "example": "다른 아르바이트생이 일을 대신해 줘요."},
         {"term": "중요하다", "meaning": "to be important", "example": "제 시간이 가장 중요해요."},
         {"term": "벌써", "meaning": "already", "example": "그러면 8시예요. 벌써 저녁이에요."}
       ]$json$::jsonb,
       $json$[
         {"question": "화자는 왜 회사를 그만뒀어요?", "options": ["자기 시간이 없고 하고 싶은 일이 아니어서", "돈을 너무 적게 받아서", "회사가 멀어서 이사해야 해서", "동료들과 사이가 안 좋아서"], "answerIndex": 0, "explanation": "제 시간이 없는 것이 가장 문제였고, 제가 하고 싶은 일이 아니어서 회사를 그만뒀어요."},
         {"question": "화자는 지금 무슨 일을 하고 있어요?", "options": ["온라인으로 한국어를 가르치고 카페에서 일해요", "회사에서 사무직으로 일해요", "빵집에서 빵을 만들어요", "유튜브로만 돈을 벌어요"], "answerIndex": 0, "explanation": "지금 온라인으로 한국어를 가르치고, 카페에서 아르바이트도 하고 있어요. 유튜브는 취미로 해요."},
         {"question": "화자에게 가장 중요한 것은 뭐예요?", "options": ["자기 시간과 재미있고 하고 싶은 일", "한 달에 받는 돈", "회사에서의 승진", "동료와의 점심시간"], "answerIndex": 0, "explanation": "돈보다 제 시간과 제가 재미있고 하고 싶은 일이 가장 중요하다고 했어요."}
       ]$json$::jsonb
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM reading_units WHERE user_id = 1 AND episode = 'EP 04');
