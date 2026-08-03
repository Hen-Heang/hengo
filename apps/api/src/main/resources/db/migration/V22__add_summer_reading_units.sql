-- Seed two beginner Korean podcast reading units (summer theme) for the owner
-- account (user_id = 1). Guarded on the user existing so the migration is a
-- no-op on fresh/local databases where user 1 has not been created yet.

INSERT INTO reading_units (user_id, episode, title, title_english, category, level, summary, source,
                           grammar_note, paragraphs, vocab, quiz)
SELECT 1, 'EP 18', '여름휴가', 'Summer Holidays', 'DAILY_LIFE', 'Beginner',
       'A relaxed beginner talk about summer holidays in Korea: when students and office workers take time off, the host''s old summer part-time jobs and winter trips abroad, a two-week summer trip to France, and quiet plans to rest at home this year.',
       'Korean Learner Podcast',
       $json${
         "pattern": "-(으)ㄹ 것 같아요",
         "explanation": "Used to express a guess or expectation — \"I think / I will probably…\". Attach to a verb stem. Example: 아마 3일 정도만 쉴 것 같아요 = I think I will only rest about 3 days."
       }$json$::jsonb,
       $json$[
         {"korean": "여러분 안녕하세요~ 잘 지냈어요? 저는 잘 지내고 있어요. 지금 한국은 여름이에요.", "english": "Hello everyone~ How have you been? I am doing well. Right now it is summer in Korea."},
         {"korean": "요즘 날씨가 정말 더워요. 한국에서 보통 7월이나 8월에 쉬어요. 학교에서는 방학을 해요. 회사원들은 휴가를 보내요. 학생들은 보통 7월에서 8월까지 쉬어요. 한 달 정도 방학이 있어요. 대학교는 방학이 조금 더 길어요. 보통 2달 반 정도 방학을 해요. 학생이 아니면 사람마다 달라요. 제 친구들은 보통 3일에서 일주일 정도 휴가가 있어요. 제 남자친구는 보통 2주나 3주쯤 쉬어요. 저는 보통 1주일에서 2주일 정도 쉬어요.", "english": "The weather is really hot these days. In Korea people usually take a break in July or August. Schools have vacation. Office workers take time off. Students usually rest from July to August — about a month of vacation. Universities have a slightly longer break, usually about two and a half months. If you are not a student it varies from person to person. My friends usually get about three days to a week off. My boyfriend usually rests about two or three weeks. I usually take about one to two weeks off."},
         {"korean": "여러분은 여름에 휴가를 가요? 보통 어디로 휴가를 가요? 학생이면 지금 방학을 했어요? 저는 대학생 때 방학에 아르바이트를 했어요. 도서관에서 아르바이트를 했어요. 도서관에 일이 많이 없었어요. 그래서 일이 없을 때 보통 책을 읽었어요.", "english": "Do you go on vacation in summer? Where do you usually go? If you are a student, are you on break now? When I was a university student I worked a part-time job during the break. I worked part-time at a library. There was not much work at the library, so when there was nothing to do I usually read books."},
         {"korean": "학생 때는 여름 방학에 아르바이트를 하거나 공부를 했어요. 그런데 가끔 겨울 방학에 해외여행을 했어요. 여름에 해외여행을 가면 너무 비싸요. 그런데 겨울에는 조금 더 싸요. 그래서 겨울에 해외여행을 많이 했어요.", "english": "As a student I worked part-time or studied during summer break. But sometimes I traveled abroad during winter break. Traveling overseas in summer is too expensive, but in winter it is a bit cheaper, so I traveled abroad a lot in winter."},
         {"korean": "학교를 졸업한 후에 코로나가 있었어요. 그래서 해외여행을 못 갔어요. 국내 여행도 못 했어요. 그런데 저는 작년에 여름휴가를 갔어요. 2주 동안 프랑스에 갔어요. 처음으로 여름에 해외여행을 갔어요. 프랑스에서 좋은 시간을 보냈어요. 남자친구하고 프랑스에서 여행을 했어요. 프랑스 북쪽하고 남쪽을 여행했어요. 바닷가에도 많이 갔어요. 사람이 많지 않아서 좋았어요. 저는 프랑스에서 처음 여름에 바다에 갔어요. 저는 수영을 못해서 바다에서 수영을 하지 않았어요. 그런데 맛있는 음식을 많이 먹어서 좋았어요.", "english": "After I graduated, COVID happened, so I could not travel abroad. I could not even travel domestically. But last year I went on a summer holiday. I went to France for two weeks — it was my first time traveling abroad in summer. I had a great time in France. I traveled there with my boyfriend. We traveled around the north and south of France and went to the beach a lot. It was nice because there were not many people. It was my first time going to the sea in summer in France. I cannot swim, so I did not swim in the sea, but I ate a lot of delicious food, which was great."},
         {"korean": "그런데 올해는 이렇게 긴 휴가가 없어요. 왜냐하면 일이 너무 많아요. 그리고 올해 1월에 프랑스에 갔고 5월에 일본에 갔어요. 그래서 지금은 일을 더 하려고 해요. 아마 3일 정도만 쉴 것 같아요. 저는 보통 여름에 가족하고 휴가를 보내요. 여름에 정말 더워서 수영장이나 계곡에 가요. 시원한 계곡에서 수영을 하고 맛있는 것을 먹어요. 저는 사람이 너무 많은 곳을 안 좋아해요. 그래서 여름에 바닷가에 안 가요. 바닷가에 사람이 정말 정말 많아요. 그리고 제 집에서 바닷가가 멀어요. 그래서 한국에서는 바닷가에 거의 안 가요. 제 가족들은 모두 사람이 많은 곳을 안 좋아해요.", "english": "But this year I do not have such a long vacation, because I have too much work. Also, this year I went to France in January and Japan in May, so now I plan to work more. I think I will only rest about three days. I usually spend my summer vacation with my family. It gets really hot in summer, so we go to a pool or a mountain valley. We swim in the cool valley and eat tasty food. I do not like very crowded places, so I do not go to the beach in summer. The beach is really, really crowded. Also, the beach is far from my house, so I almost never go to the beach in Korea. My whole family dislikes crowded places."},
         {"korean": "그래서 수영장이 있는 에어비앤비에 갈 때도 있어요. 에어비앤비에서 바비큐도 해요. 그러면 조용하고 평화롭게 휴가를 즐길 수 있어요. 그런데 올해는 수영장이나 바닷가에 안 가요. 아마 조용한 곳에 가서 쉴 거예요. 올해는 가족들이 다 바빠요. 같이 여행을 가고 싶지만 아직 모르겠어요. 그래서 집에서 혼자 쉬는 것도 좋을 것 같아요. 이번 휴가는 시원한 집에서 쉬고 맛있는 음식을 먹고 싶어요. 그리고 제가 좋아하는 드라마나 영화도 보고 싶어요. 또는 친구들을 만나서 놀고 싶어요.", "english": "So sometimes we go to an Airbnb with a pool. We also have a barbecue at the Airbnb. That way we can enjoy a quiet and peaceful vacation. But this year I am not going to a pool or the beach. I will probably go somewhere quiet and rest. This year my whole family is busy. I want to travel together, but I am not sure yet. So just resting at home alone might be nice too. This vacation I want to relax in a cool house and eat delicious food. I also want to watch dramas and movies I like. Or I want to meet up with friends and hang out."},
         {"korean": "여러분은 올해 언제 여름 휴가를 보낼 거예요? 학생이면 지금 방학을 했어요? 이번 휴가에 뭐 할 거예요? 또는 방학에 뭐 할 거예요? 댓글에 써 주세요! 여러분이 좋은 휴가를 보내면 좋겠어요! 그럼 다음에 봐요. 안녕히 가세요~", "english": "When will you spend your summer vacation this year? If you are a student, are you on break now? What will you do this vacation? Or what will you do during the break? Please write it in the comments! I hope you have a good vacation! See you next time. Goodbye~"}
       ]$json$::jsonb,
       $json$[
         {"term": "여름휴가", "meaning": "summer holiday / summer vacation", "example": "저는 작년에 여름휴가를 갔어요."},
         {"term": "방학", "meaning": "school vacation / break", "example": "학생들은 보통 한 달 정도 방학이 있어요."},
         {"term": "휴가", "meaning": "vacation / leave (from work)", "example": "회사원들은 여름에 휴가를 보내요."},
         {"term": "아르바이트", "meaning": "part-time job", "example": "저는 도서관에서 아르바이트를 했어요."},
         {"term": "해외여행", "meaning": "overseas travel", "example": "겨울에 해외여행을 많이 했어요."},
         {"term": "바닷가", "meaning": "beach / seaside", "example": "바닷가에 사람이 정말 많아요."},
         {"term": "계곡", "meaning": "(mountain) valley / stream", "example": "시원한 계곡에서 수영을 해요."},
         {"term": "졸업하다", "meaning": "to graduate", "example": "학교를 졸업한 후에 코로나가 있었어요."}
       ]$json$::jsonb,
       $json$[
         {"question": "한국에서 학생들은 보통 언제 방학을 해요?", "options": ["7월에서 8월까지", "12월에서 2월까지", "3월에서 5월까지", "1년 내내"], "answerIndex": 0, "explanation": "학생들은 보통 7월에서 8월까지 쉬어요."},
         {"question": "화자는 작년 여름휴가에 어디에 갔어요?", "options": ["프랑스", "일본", "미국", "한국 바닷가"], "answerIndex": 0, "explanation": "작년에 2주 동안 프랑스에 갔어요."},
         {"question": "화자는 왜 여름에 바닷가에 잘 안 가요?", "options": ["사람이 너무 많고 집에서 멀어서", "수영을 아주 좋아해서", "바닷가가 가까워서", "돈이 많아서"], "answerIndex": 0, "explanation": "바닷가에 사람이 많고 집에서 멀어서 거의 안 가요."}
       ]$json$::jsonb
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1);

INSERT INTO reading_units (user_id, episode, title, title_english, category, level, summary, source,
                           grammar_note, paragraphs, vocab, quiz)
SELECT 1, 'EP 30', '여름 준비', 'Preparing for Summer', 'DAILY_LIFE', 'Beginner',
       'Choisusu shares how she gets ready for summer in Korea: swapping winter clothes for summer ones, switching to cooler bedding, cleaning fans and the air conditioner before the rainy season (jangma), and using sunscreen and a parasol against the strong sun.',
       'Choisusu Korean Podcast',
       $json${
         "pattern": "-(으)ㄴ 후에",
         "explanation": "Means \"after doing something\". Attach to a verb stem to say one action happens after another. Example: 겨울옷을 정리한 후에 여름옷을 꺼내요 = After organizing the winter clothes, I take out the summer clothes."
       }$json$::jsonb,
       $json$[
         {"korean": "안녕하세요, 여러분~ 저 최수수예요! 잘 지냈어요? 요즘 한국은 날씨가 정말 더워요. 이제 여름이 시작했어요. 오늘 낮에는 33도였고, 밤에는 25도예요. 저는 여름이 오면 여름을 위해 준비를 해요. 그래서 오늘은 여름 준비에 대해서 이야기할 거예요.", "english": "Hello everyone~ It is me, Choisusu! How have you been? The weather in Korea is really hot these days. Summer has now started. Today it was 33 degrees during the day and 25 degrees at night. When summer comes, I get ready for it. So today I am going to talk about preparing for summer."},
         {"korean": "먼저, 저는 겨울옷을 정리해요. 여러분은 여름옷하고 겨울옷을 정리하나요? 옷장이 작아서 옷 정리를 해야 해요. 여름이 되면 겨울옷을 안 입어요. 그래서 재킷이나 두꺼운 옷을 상자에 넣어요. 긴바지도 잘 접어서 상자에 넣어요. 긴팔은 서랍에 넣었어요. 그리고 따뜻한 양말도 서랍에 넣었어요.", "english": "First, I organize my winter clothes. Do you sort out your summer and winter clothes? My closet is small, so I have to tidy up my clothes. When summer comes I do not wear winter clothes, so I put jackets and thick clothes in a box. I fold my long pants neatly and put them in the box too. I put long-sleeve tops in a drawer, and I put warm socks in the drawer as well."},
         {"korean": "겨울옷을 정리한 후에는 여름옷을 꺼내요. 오랫동안 여름옷을 안 입었어요. 그래서 저는 먼저 빨래를 했어요. 빨래한 후에 옷을 정리해요. 그래서 지금 제 옷장에는 여름옷만 있어요. 음악을 들으면서 옷을 정리하니까 기분이 좋았어요.", "english": "After organizing the winter clothes, I take out the summer clothes. I had not worn my summer clothes for a long time, so first I did the laundry. After washing them, I organize the clothes. So now there are only summer clothes in my closet. Tidying up while listening to music put me in a good mood."},
         {"korean": "그리고 겨울에 추워서 따뜻한 이불하고 베개가 있었어요. 그런데 여름에는 더워서 안 써요. 그래서 시원한 이불하고 베개를 침대에 놓았어요. 옷하고 이불을 정리한 후에 선풍기를 닦았어요. 왜냐하면 오랫동안 안 써서 먼지가 있었어요.", "english": "Also, because winter is cold I had a warm blanket and pillow. But in summer it is hot, so I do not use them. So I put a cool blanket and pillow on the bed. After organizing the clothes and bedding, I wiped down the fan, because it was dusty from not being used for a long time."},
         {"korean": "저는 집에 큰 선풍기만 있었어요. 그런데 큰 선풍기를 안 쓰고 싶었어요. 왜냐하면 며칠 전에 많이 안 더웠어요. 그래서 최근에 작은 선풍기를 샀어요. 이 작은 선풍기를 책상 위에 놓고 쓸 수 있어요.", "english": "I only had a big fan at home, but I did not want to use the big fan, because a few days ago it was not very hot. So recently I bought a small fan. I can put this small fan on my desk and use it."},
         {"korean": "요즘 많이 덥지만 저는 에어컨을 안 켜요. 왜냐하면 아직 많이 습하지 않아요. 선풍기만 있어도 시원해요. 그래서 에어컨을 안 켜도 괜찮아요.", "english": "It is quite hot these days, but I do not turn on the air conditioner, because it is not very humid yet. Just having a fan is cool enough. So it is fine even without turning on the air conditioner."},
         {"korean": "그런데 한국에서는 보통 7월에 장마가 있어요. 여름에 비가 계속 올 때 '장마'라고 해요. 보통 한 달 동안 비가 계속 와요. 장마 때 정말 습하고 더워요. 저는 습한 걸 안 좋아해서 습할 때 에어컨을 켜요. 그런데 에어컨을 켜기 전에 청소해야 돼요. 왜냐하면 에어컨 안에 먼지가 정말 많아요. 주말에 시간이 많아서 에어컨을 청소했어요. 그래서 이제 에어컨을 켤 수 있어요. 아마 날씨가 더 더우면 에어컨을 켤 거예요.", "english": "But in Korea there is usually a rainy season in July. When it keeps raining in summer, we call it jangma. Usually it rains continuously for about a month. During jangma it is really humid and hot. I do not like humidity, so when it is humid I turn on the air conditioner. But before turning on the air conditioner I have to clean it, because there is a lot of dust inside it. I had plenty of time on the weekend, so I cleaned the air conditioner. So now I can turn it on. I will probably turn it on if the weather gets hotter."},
         {"korean": "저는 며칠 전에 대전에 여행을 갔어요. 밖에서 많이 걸어야 했어요. 그래서 선크림을 샀어요. 저는 사실 선크림을 잘 안 발라요. 왜냐하면 저는 선크림 바르는 것을 안 좋아해요. 하지만 대전에서는 밖에서 많이 걸어서 선크림을 발랐어요.", "english": "A few days ago I took a trip to Daejeon. I had to walk a lot outside, so I bought sunscreen. Honestly, I do not really put on sunscreen, because I do not like applying it. But in Daejeon I walked a lot outside, so I put on sunscreen."},
         {"korean": "그리고 작년에 양산을 샀어요. 양산은 여름에 햇빛 때문에 쓰는 우산이에요. 가끔 햇빛 때문에 피부가 아파요. 그래서 양산을 써야 해요. 한국에서는 선글라스보다 양산을 더 많이 쓰는 것 같아요. 저는 양산을 쓰지만 선글라스는 안 써요.", "english": "Also, last year I bought a parasol. A parasol is an umbrella you use in summer because of the sunlight. Sometimes the sunlight makes my skin hurt, so I have to use a parasol. In Korea it seems people use parasols more than sunglasses. I use a parasol, but I do not wear sunglasses."},
         {"korean": "여러분은 양산을 써요? 아니면 선글라스를 써요? 댓글에 써 주세요! 오늘은 여름 준비에 대해서 이야기했어요. 여러분은 어떤 여름 준비를 해요? 댓글에 써 주세요! 오늘 팟캐스트도 들어 주셔서 감사하고 다음에 또 봐요! 안녕히 가세요!", "english": "Do you use a parasol? Or do you wear sunglasses? Please write it in the comments! Today I talked about preparing for summer. What kind of summer preparations do you do? Please write it in the comments! Thank you for listening to today's podcast, and see you again next time! Goodbye!"}
       ]$json$::jsonb,
       $json$[
         {"term": "준비하다", "meaning": "to prepare / get ready", "example": "저는 여름을 위해 준비를 해요."},
         {"term": "정리하다", "meaning": "to organize / tidy up", "example": "저는 겨울옷을 정리해요."},
         {"term": "옷장", "meaning": "closet / wardrobe", "example": "옷장이 작아서 옷 정리를 해야 해요."},
         {"term": "서랍", "meaning": "drawer", "example": "긴팔은 서랍에 넣었어요."},
         {"term": "이불", "meaning": "blanket / duvet", "example": "시원한 이불을 침대에 놓았어요."},
         {"term": "선풍기", "meaning": "electric fan", "example": "선풍기만 있어도 시원해요."},
         {"term": "에어컨", "meaning": "air conditioner", "example": "습할 때 에어컨을 켜요."},
         {"term": "장마", "meaning": "the rainy season / monsoon", "example": "한국에서는 보통 7월에 장마가 있어요."},
         {"term": "양산", "meaning": "parasol (sun umbrella)", "example": "햇빛 때문에 양산을 써요."},
         {"term": "선크림", "meaning": "sunscreen", "example": "밖에서 많이 걸어서 선크림을 발랐어요."}
       ]$json$::jsonb,
       $json$[
         {"question": "최수수 씨는 여름이 되면 겨울옷을 어떻게 해요?", "options": ["상자나 서랍에 넣어서 정리해요", "그냥 계속 입어요", "다 버려요", "친구에게 줘요"], "answerIndex": 0, "explanation": "재킷과 두꺼운 옷은 상자에, 긴팔과 양말은 서랍에 넣어요."},
         {"question": "'장마'는 무엇이에요?", "options": ["여름에 비가 계속 오는 기간", "겨울에 눈이 오는 날", "아주 더운 하루", "바람이 많이 부는 날"], "answerIndex": 0, "explanation": "여름에 비가 계속 올 때를 '장마'라고 해요."},
         {"question": "화자는 에어컨을 켜기 전에 왜 청소를 해요?", "options": ["에어컨 안에 먼지가 많아서", "에어컨이 고장 나서", "더 시원해지려고", "새 에어컨이라서"], "answerIndex": 0, "explanation": "에어컨 안에 먼지가 많아서 켜기 전에 청소해야 돼요."}
       ]$json$::jsonb
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1);
