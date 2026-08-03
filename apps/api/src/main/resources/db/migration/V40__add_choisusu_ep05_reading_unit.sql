-- Seed the Choisusu EP 05 "집 (House)" beginner reading unit for the owner
-- account (user_id = 1, Henry Heang / henryheang@gmail.com). Guarded on the
-- user existing AND on the episode not already being present, so it is a
-- safe no-op on fresh/local databases and will not create a duplicate if
-- EP 05 was inserted manually beforehand.
-- Uses dollar-quoted (`$json$...$json$::jsonb`) literals so Korean text and
-- apostrophes need no escaping.

INSERT INTO reading_units (user_id, episode, title, title_english, category, level, summary, source,
                           grammar_note, paragraphs, vocab, quiz)
SELECT 1, 'EP 05', '집', 'House', 'DAILY_LIFE', 'Beginner',
       'Choisusu talks about housing in Korea. She describes growing up in a house, moving to a villa, and now living in an apartment with two rooms, a living room, kitchen, bathroom, and balcony. She covers apartment living rules like noise and recycling, what she has heard about Korean dormitories (no kitchen, roommates, curfews), and what she would change about her current place — wishing the kitchen and teaching room were bigger and the hallway quieter.',
       'Choisusu Korean Podcast',
       $json${
         "pattern": "Noun(이)랑 (and, with)  ·  답답하다 (frustrated, stuffy)",
         "explanation": "Noun(이)랑 links two nouns like 하고/와/과: 발코니에는 꽃이랑 식물이 많아요 = There are a lot of flowers and plants on the balcony; 친구하고 놀아요 = 친구랑 놀아요 (I hang out with a friend). 답답하다 describes feeling frustrated or a space feeling stuffy/cramped: 그런데 요즘 한국이 더워서 수업할 때 답답해요 = These days Korea is hot, so it feels stuffy when I'm teaching; 방에 창문이 없어서 답답해요 = This room is stuffy because there are no windows."
       }$json$::jsonb,
       $json$[
         {"korean": "안녕하세요 여러분~ 오늘은 집에 대해서 이야기할 거예요. 여러분은 어떤 집에 살고 있어요? 아파트에 살고 있어요? 주택이나 빌라, 기숙사에 살고 있어요? 저는 아파트에 살고 있어요.", "english": "Hello everyone~ Today I'm going to talk about houses. What kind of house do you live in? Do you live in an apartment? Do you live in a house, villa, or dormitory? I live in an apartment."},
         {"korean": "어렸을 때 10년 동안 주택에서 살았어요. 그리고 가족들하고 빌라로 이사를 갔어요. 2년 전에 아파트로 이사를 왔어요. 그래서 지금은 아파트에서 살아요. 아파트에는 방이 두 개, 거실, 부엌, 화장실, 발코니가 있어요. 아파트에 엘리베이터가 두 개 있어요. 엘리베이터 옆에 계단이 있어요. 가끔 운동하고 싶어서 계단으로 올라가요.", "english": "When I was young I lived in a house for 10 years. Then I moved to a villa with my family. Two years ago I moved into an apartment, so now I live in an apartment. My apartment has two rooms, a living room, a kitchen, a bathroom, and a balcony. There are two elevators in the building, with stairs next to the elevator. Sometimes I take the stairs up because I want to exercise."},
         {"korean": "아파트에 처음 왔을 때 아무것도 없었어요. 그래서 책상, 소파, 에어컨, 침대 다 샀어요. 거실에는 소파하고 텔레비전, 에어컨, 컴퓨터가 있어요. 그리고 부엌에는 냉장고, 테이블, 의자가 있어요. 한 방에는 컴퓨터만 있어요. 거기에서 수업을 해요. 그리고 다른 방에는 침대가 있어요. 그리고 집에 창고가 있어요. 거기에 세탁기가 있어요.", "english": "When I first moved into the apartment there was nothing, so I bought a desk, a sofa, an air conditioner, and a bed — all of it. The living room has a sofa, a TV, an air conditioner, and a computer, and the kitchen has a fridge, a table, and chairs. One room only has a computer — I teach my classes there — and the other room has a bed. There's also a storage room with a washing machine in it."},
         {"korean": "발코니에는 꽃이랑 식물이 많아요. 가끔 발코니에서 밥을 먹어요. 발코니에서 밖을 볼 수 있어서 좋아요. 낮에는 햇빛이 있어서 정말 좋아요. 밤에는 조용하고 앉아서 쉴 수 있어서 좋아요. 발코니에 여러 식물이 있어요. 그래서 일주일에 한 번 아침에 식물에게 물을 줘요.", "english": "There are a lot of flowers and plants on the balcony. Sometimes I eat meals there. I like that I can see outside from the balcony — during the day it's lovely because of the sunlight, and at night it's quiet and nice to sit and relax. There are several plants on the balcony, so I water them once a week in the morning."},
         {"korean": "방이 두 개 있는데 한 개는 제가 수업을 할 때 써요. 그래서 방에 책장, 책상, 컴퓨터가 있어요. 방이 정말 작아서 에어컨이 없어요. 그런데 요즘 한국이 더워서 수업할 때 답답해요. 그래서 보통 선풍기를 틀고 수업을 해요. 겨울에 춥지만 옷을 따뜻하게 입어서 괜찮아요.", "english": "I have two rooms, and I use one of them for teaching. That room has a bookshelf, a desk, and a computer. It's really small, so there's no air conditioner. These days Korea is hot, so it feels stuffy when I'm teaching, so I usually teach with a fan on. It's cold in winter, but I'm fine since I dress warmly."},
         {"korean": "그런데 여름은 너무 더우면 땀이 나서 싫어요. 그래서 요즘 에어컨을 사고 싶어요. 제 집에 에어컨이 거실에만 있어요. 보통 거실하고 큰 방만 시원해요. 큰 방에는 침대하고 옷장, 또 컴퓨터가 있어요. 이 컴퓨터로 게임을 하고 취미 생활을 해요. 텔레비전은 거실에 있어서 가끔 텔레비전을 보면서 잠을 잘 때도 있어요. 소파를 이케아에서 샀는데 침대로 만들 수 있어요. 그래서 침대로 만들어서 텔레비전을 보면서 자요.", "english": "But in summer when it's too hot I sweat, and I don't like that, so these days I want to buy an air conditioner. In my place the air conditioner is only in the living room — usually only the living room and the big room are cool. The big room has a bed, a closet, and also a computer that I use to play games and enjoy my hobbies. The TV is in the living room, so sometimes I fall asleep watching it. I bought the sofa from IKEA, and it folds out into a bed, so I turn it into a bed and sleep while watching TV."},
         {"korean": "아파트는 여러 사람이 함께 살고 있어요. 그래서 시끄럽게 하면 안 돼요. 특히 밤에 걸을 때 조심히 걸어야 해요. 가끔 윗집에서 걷는 소리가 들려요. 그러면 시끄러워서 기분이 나쁠 수 있어요. 그리고 쓰레기를 버릴 때는 분리수거를 해요. 플라스틱, 종이, 비닐, 캔, 병 등 나눠요. 저는 일주일에 한 번 분리수거를 해요. 그리고 음식물 쓰레기, 일반 쓰레기도 버려요. 쓰레기통을 사용하려면 전자 키가 있어야 돼요. 아파트에 살면 전자 열쇠를 받을 수 있어요.", "english": "Many people live together in an apartment, so you shouldn't be noisy — especially at night, you have to walk carefully. Sometimes I hear footsteps from the unit above, and when that happens, it's noisy and can put me in a bad mood. Also, when you throw away trash you have to sort it for recycling — plastic, paper, vinyl, cans, and bottles are all separated. I do recycling once a week, and I also throw away food waste and general waste. You need an electronic key to use the trash bins, and you get one when you live in an apartment."},
         {"korean": "저는 기숙사에 안 살아 봤어요. 친구가 기숙사에서 살았는데 룸메이트하고 잘 맞아서 재밌었다고 말했어요. 그런데 한국 기숙사에는 보통 부엌이 없어요. 그리고 보통 2명이 한 방을 써요. 그래서 요리를 할 수 없어서 불편하지만 학교에 학생 식당이 있어요. 거기에서 아침하고 점심을 먹을 수 있어요.", "english": "I've never lived in a dormitory myself. A friend of mine lived in one and said it was fun because she got along well with her roommate. But Korean dormitories usually don't have a kitchen, and usually two people share one room, so you can't cook, which is inconvenient — but the school has a student cafeteria where you can eat breakfast and lunch."},
         {"korean": "그리고 보통 통금 시간이 있어요. 제 대학교는 통금 시간이 10시였어요. 밤 10시까지 기숙사에 가야 해요. 그리고 친구랑 같이 자면 안 돼요. 기숙사에는 이렇게 여러 규칙이 있어요. 하지만 학교 안에 있어서 빨리 강의실에 갈 수 있고 수업이 없을 때는 가서 쉴 수 있어서 부러웠어요. 지금은 기숙사에 살고 싶진 않지만 학생 때 기숙사에 살아 보고 싶었어요.", "english": "And there's usually a curfew — at my university it was 10 o'clock, so you had to be back at the dorm by 10 p.m. You're also not allowed to sleep over with a friend. Dorms have a lot of rules like this, but since they're inside the school, you can get to the lecture hall quickly, and when you don't have class you can go rest there, which I envied. I don't want to live in a dorm now, but I wish I had lived in one back when I was a student."},
         {"korean": "저는 지금 제가 살고 있는 집이 좋아요. 그렇지만 집이 조금 더 넓으면 좋겠어요. 왜냐하면 수업하는 방이 너무 작아서 답답해요. 그리고 부엌이 좁아서 작은 테이블하고 의자가 있어요. 부엌이 더 넓었으면 좋겠어요. 그러면 요리할 때 편할 것 같아요. 가끔 복도에서 나는 소리가 잘 들려서 불편해요. 그래서 밖에 소리가 잘 안 들렸으면 좋겠어요.", "english": "I like the place I live in now, but I wish it were a little bigger. The room where I teach is too small, so it feels stuffy, and the kitchen is narrow, so it only has a small table and chairs — I wish the kitchen were bigger, since that would make cooking easier. Sometimes I can hear sounds from the hallway clearly, which is uncomfortable, so I wish outside sounds weren't so audible."},
         {"korean": "여러분은 어떤 집에 살고 있어요? 그리고 어떤 집에 살고 싶어요? 집이 어땠으면 좋겠어요? 댓글로 남겨 주세요!", "english": "What kind of house do you live in? And what kind of house would you like to live in? What would you want your house to be like? Leave a comment and let me know!"}
       ]$json$::jsonb,
       $json$[
         {"term": "아파트", "meaning": "apartment", "example": "저는 아파트에 살고 있어요."},
         {"term": "빌라", "meaning": "villa", "example": "가족들하고 빌라로 이사를 갔어요."},
         {"term": "기숙사", "meaning": "dormitory", "example": "저는 기숙사에 안 살아 봤어요."},
         {"term": "발코니", "meaning": "balcony", "example": "발코니에는 꽃이랑 식물이 많아요."},
         {"term": "창고", "meaning": "storage, warehouse", "example": "집에 창고가 있어요. 거기에 세탁기가 있어요."},
         {"term": "분리수거", "meaning": "separate waste collection", "example": "쓰레기를 버릴 때는 분리수거를 해요."},
         {"term": "전자 키", "meaning": "electronic key", "example": "쓰레기통을 사용하려면 전자 키가 있어야 돼요."},
         {"term": "통금 시간", "meaning": "curfew", "example": "제 대학교는 통금 시간이 10시였어요."},
         {"term": "이사하다", "meaning": "to move (home)", "example": "2년 전에 아파트로 이사를 왔어요."},
         {"term": "올라가다", "meaning": "to go up, rise", "example": "가끔 운동하고 싶어서 계단으로 올라가요."},
         {"term": "틀다", "meaning": "to turn on", "example": "보통 선풍기를 틀고 수업을 해요."},
         {"term": "땀이 나다", "meaning": "to sweat", "example": "여름은 너무 더우면 땀이 나서 싫어요."},
         {"term": "답답하다", "meaning": "frustrated, stuffy", "example": "수업할 때 답답해요."},
         {"term": "시끄럽다", "meaning": "noisy", "example": "윗집에서 걷는 소리가 들리면 시끄러워서 기분이 나쁠 수 있어요."},
         {"term": "부럽다", "meaning": "envy, jealous", "example": "수업이 없을 때는 가서 쉴 수 있어서 부러웠어요."},
         {"term": "넓다", "meaning": "wide, spacious", "example": "집이 조금 더 넓으면 좋겠어요."}
       ]$json$::jsonb,
       $json$[
         {"question": "화자는 지금 어디에서 살고 있어요?", "options": ["아파트", "주택", "빌라", "기숙사"], "answerIndex": 0, "explanation": "어렸을 때 주택, 그다음 빌라에서 살다가 2년 전부터 지금은 아파트에서 살고 있어요."},
         {"question": "화자의 방이 답답한 이유는 뭐예요?", "options": ["방이 작은데 에어컨이 없어서", "창문이 없어서", "사람이 너무 많아서", "환기가 안 돼서"], "answerIndex": 0, "explanation": "수업하는 방이 정말 작아서 에어컨이 없고, 한국 여름이 더워서 답답하다고 했어요."},
         {"question": "한국 기숙사에 대한 설명으로 맞는 것은 뭐예요?", "options": ["보통 부엌이 없고 통금 시간이 있어요", "보통 1인실이에요", "부엌이 있어서 요리할 수 있어요", "통금 시간이 없어요"], "answerIndex": 0, "explanation": "한국 기숙사는 보통 부엌이 없고 2명이 한 방을 쓰며, 통금 시간 같은 규칙이 있다고 했어요."}
       ]$json$::jsonb
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM reading_units WHERE user_id = 1 AND episode = 'EP 05');
