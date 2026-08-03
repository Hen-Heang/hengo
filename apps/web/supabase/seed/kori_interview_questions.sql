-- Seed data for kori_interview_questions — the 20 K-Specialist Q&A pairs for
-- the "weather" topic (한국 여름날씨와 캄보디아 날씨의 다른 점과 생활 및
-- 건강에 미치는 영향), supplied directly by the candidate/mentor. Shared
-- (created_by_user_id is null) and read-only via RLS, so this runs with
-- elevated rights (Supabase SQL editor / MCP), not through the app.
-- Re-runnable: existing slugs are skipped.

insert into kori_interview_questions
  (slug, topic_id, question_ko, question_en, sample_answer_ko, sample_answer_en, category, difficulty, priority, keywords, display_order)
values

('weather-why-topic', 'weather',
 '왜 이 주제를 선택했어요?',
 'Why did you choose this topic?',
 '저는 캄보디아에서 왔고, 지금 한국에서 생활하고 있습니다. 두 나라의 여름을 직접 경험했기 때문에 이 주제를 선택했습니다. 특히 한국의 여름은 생각보다 습해서 인상적이었습니다.',
 'I am from Cambodia, and I currently live in Korea. I chose this topic because I have personally experienced summer in both countries. I was especially surprised by how humid the Korean summer is.',
 'topic_selection', 'beginner', 'must_practice', array['캄보디아', '경험', '주제선택'], 1),

('weather-korea-summer-feature', 'weather',
 '한국 여름의 가장 큰 특징은 무엇입니까?',
 'What is the biggest characteristic of summer in Korea?',
 '한국 여름의 가장 큰 특징은 덥고 습하다는 것입니다. 장마철에는 비도 많이 옵니다. 그래서 실제 온도보다 더 덥게 느껴집니다.',
 'The biggest characteristic of summer in Korea is that it is hot and humid. It also rains a lot during the rainy season. Because of this, it feels hotter than the actual temperature.',
 'korean_summer', 'beginner', 'must_practice', array['덥다', '습하다', '장마'], 2),

('weather-cambodia-weather', 'weather',
 '캄보디아 날씨는 어떻습니까?',
 'How is the weather in Cambodia?',
 '캄보디아는 일 년 내내 더운 편입니다. 건기와 우기 두 계절이 있습니다. 특히 3월부터 5월까지는 기온이 40도 가까이 올라갑니다.',
 'Cambodia is hot throughout the year. It has two seasons: the dry season and the rainy season. From March to May, the temperature can rise to nearly 40 degrees.',
 'cambodian_weather', 'normal', 'must_practice', array['건기', '우기', '캄보디아'], 3),

('weather-biggest-difference', 'weather',
 '한국과 캄보디아 여름의 가장 큰 차이점은 무엇입니까?',
 'What is the biggest difference between summer in Korea and Cambodia?',
 '가장 큰 차이점은 습도와 비입니다. 한국 여름은 덥고 습하며 비가 많이 옵니다. 반면에 캄보디아의 가장 더운 시기는 덥지만 비교적 건조합니다.',
 'The biggest differences are humidity and rain. Summer in Korea is hot, humid, and rainy. In contrast, Cambodia''s hottest season is hot but relatively dry.',
 'comparison', 'challenging', 'must_practice', array['습도', '차이점', '비교'], 4),

('weather-which-heat-harder', 'weather',
 '어느 나라의 더위가 더 힘듭니까?',
 'Which country''s heat is more difficult to deal with?',
 '저는 한국의 더위가 더 힘들게 느껴집니다. 캄보디아의 기온은 더 높지만 저는 그 날씨에 익숙합니다. 한국은 습도가 높아서 땀이 많이 나고 몸이 더 피곤합니다.',
 'For me, the heat in Korea feels more difficult. Cambodia has higher temperatures, but I am used to that weather. Korea''s high humidity makes me sweat more and feel more tired.',
 'comparison', 'challenging', 'must_practice', array['습도', '피곤', '적응'], 5),

('weather-first-jangma', 'weather',
 '한국의 장마를 처음 경험했을 때 어땠어요?',
 'How did you feel the first time you experienced Korea''s rainy season?',
 '비가 며칠 동안 계속 와서 놀랐습니다. 밖에 나갈 때 항상 우산을 가지고 다녀야 해서 조금 불편했습니다. 하지만 지금은 날씨를 미리 확인하는 습관이 생겼습니다.',
 'I was surprised because it rained continuously for several days. It was a little inconvenient because I always had to carry an umbrella. However, I now have a habit of checking the weather in advance.',
 'korean_summer', 'normal', 'recommended', array['장마', '우산', '습관'], 6),

('weather-effect-on-daily-life', 'weather',
 '더운 날씨가 생활에 어떤 영향을 줍니까?',
 'How does hot weather affect daily life?',
 '날씨가 너무 더우면 낮에 밖에서 활동하기 어렵습니다. 사람들은 에어컨이 있는 실내에서 더 많은 시간을 보냅니다. 에어컨을 많이 사용하기 때문에 전기 요금도 높아질 수 있습니다.',
 'When the weather is too hot, it is difficult to do outdoor activities during the daytime. People spend more time indoors where there is air conditioning. Electricity bills may also increase because people use air conditioners frequently.',
 'daily_life', 'normal', 'must_practice', array['에어컨', '실내', '전기요금'], 7),

('weather-effect-on-health', 'weather',
 '더운 날씨가 건강에 어떤 영향을 줍니까?',
 'How does hot weather affect health?',
 '더우면 쉽게 피곤해지고 집중력도 떨어질 수 있습니다. 물을 충분히 마시지 않으면 더위를 먹을 수도 있습니다. 그래서 물을 자주 마시고 충분히 쉬는 것이 중요합니다.',
 'Hot weather can make people tired easily and reduce concentration. People may suffer from heat-related illness if they do not drink enough water. Therefore, it is important to drink water frequently and get enough rest.',
 'health', 'normal', 'must_practice', array['건강', '더위', '물'], 8),

('weather-health-management', 'weather',
 '한국 여름에 어떻게 건강을 관리합니까?',
 'How do you manage your health during Korean summer?',
 '저는 물을 자주 마시고, 너무 더운 시간에는 밖에 오래 있지 않습니다. 외출할 때는 날씨를 확인하고 우산도 준비합니다. 밤에는 에어컨을 적당히 사용하려고 합니다.',
 'I drink water frequently and avoid staying outside for too long during the hottest hours. I check the weather and prepare an umbrella before going out. At night, I try to use the air conditioner appropriately.',
 'health', 'normal', 'must_practice', array['건강관리', '물', '에어컨'], 9),

('weather-yeouido-pool', 'weather',
 '여의도 한강 수영장에 갔을 때 어땠어요?',
 'How was it when you went to the Yeouido Hangang swimming pool?',
 '친구와 함께 여의도 한강 수영장에 갔습니다. 한국에서 여름에 수영한 것은 처음이었습니다. 사람이 많았지만 정말 즐거웠고 좋은 추억이 되었습니다.',
 'I went to the Yeouido Hangang Swimming Pool with my friend. It was my first time swimming in Korea during the summer. There were many people, but I had a great time, and it became a good memory.',
 'swimming_pool', 'beginner', 'must_practice', array['여의도', '수영장', '추억'], 10),

('weather-pool-memorable', 'weather',
 '수영장에서 가장 기억에 남는 것은 무엇입니까?',
 'What do you remember most about the swimming pool?',
 '많은 사람들이 가족이나 친구와 함께 여름을 즐기는 모습이 기억에 남습니다. 사람이 많아서 조금 복잡했지만 분위기가 활기찼습니다. 저도 친구와 함께 즐거운 시간을 보냈습니다.',
 'I remember seeing many people enjoying the summer with their families and friends. It was a little crowded, but the atmosphere was lively. I also had a great time with my friend.',
 'swimming_pool', 'normal', 'recommended', array['가족', '분위기', '추억'], 11),

('weather-seonyudo-did', 'weather',
 '선유도공원에서는 무엇을 했습니까?',
 'What did you do at Seonyudo Park?',
 '친구와 함께 공원을 걸으며 자연을 구경했습니다. 조금 피곤했지만 공기가 상쾌해서 기분이 좋았습니다. 저녁에는 서울의 야경을 보고 사진도 많이 찍었습니다.',
 'I walked around the park with my friend and enjoyed nature. I felt a little tired, but the fresh air made me feel good. In the evening, I enjoyed the night view of Seoul and took many photos.',
 'seonyudo_park', 'beginner', 'must_practice', array['선유도공원', '산책', '야경'], 12),

('weather-seonyudo-best', 'weather',
 '선유도공원에서 가장 좋았던 점은 무엇입니까?',
 'What was the best part about Seonyudo Park?',
 '가장 좋았던 점은 밤에 본 서울의 풍경입니다. 낮과는 다른 분위기가 있었고 정말 아름다웠습니다. 친구와 사진을 찍은 것도 좋은 추억이 되었습니다.',
 'The best part was the view of Seoul at night. It had a different atmosphere from the daytime and was very beautiful. Taking photos with my friend also became a good memory.',
 'seonyudo_park', 'normal', 'recommended', array['야경', '추억', '사진'], 13),

('weather-adapted', 'weather',
 '한국 여름에 적응했습니까?',
 'Have you adapted to Korean summer?',
 '아직 완전히 적응하지는 못했습니다. 특히 습도가 높고 밤에도 더울 때는 잠을 잘 못 잡니다. 하지만 물을 자주 마시고 실내에서 쉬면서 조금씩 적응하고 있습니다.',
 'I have not completely adapted yet. It is especially difficult to sleep when the humidity is high and the nights are hot. However, I am gradually adapting by drinking water frequently and resting indoors.',
 'adaptation', 'challenging', 'must_practice', array['적응', '습도', '잠'], 14),

('weather-good-things', 'weather',
 '한국 여름의 좋은 점은 무엇입니까?',
 'What is good about Korean summer?',
 '여름에 할 수 있는 활동이 많다는 점이 좋습니다. 한강 수영장에 가거나 공원에서 산책할 수 있습니다. 친구들과 새로운 추억을 만들 수 있어서 좋습니다.',
 'I like that there are many activities to enjoy during the summer. We can visit a Hangang swimming pool or walk in a park. It is also a good opportunity to make new memories with friends.',
 'opinion', 'beginner', 'recommended', array['활동', '추억', '장점'], 15),

('weather-cambodia-hot-day-activity', 'weather',
 '캄보디아에서는 더운 날에 보통 무엇을 합니까?',
 'What do you usually do on a hot day in Cambodia?',
 '낮에는 너무 더워서 보통 실내나 그늘에서 쉽니다. 저녁이 되면 날씨가 조금 시원해져서 친구들과 밖에 나가곤 합니다. 선풍기와 에어컨도 자주 사용합니다.',
 'During the daytime, it is very hot, so people usually rest indoors or in the shade. When the weather becomes cooler in the evening, I often go outside with my friends. People also frequently use fans and air conditioners.',
 'cambodian_weather', 'normal', 'recommended', array['그늘', '선풍기', '저녁'], 16),

('weather-koreans-summer', 'weather',
 '한국 사람들은 여름을 어떻게 보냅니까?',
 'How do Korean people spend their summer?',
 '많은 사람들이 수영장이나 바다에 갑니다. 시원한 카페나 쇼핑몰에서 시간을 보내기도 합니다. 냉면이나 팥빙수 같은 시원한 음식도 즐겨 먹습니다.',
 'Many people visit swimming pools or beaches. They also spend time in cool cafes or shopping malls. They enjoy cold foods such as naengmyeon and patbingsu.',
 'korean_summer', 'beginner', 'recommended', array['수영장', '냉면', '팥빙수'], 17),

('weather-favorite-summer-food', 'weather',
 '한국 여름 음식 중 좋아하는 음식이 있습니까?',
 'Is there a Korean summer food you like?',
 '저는 냉면을 좋아합니다. 날씨가 더울 때 먹으면 시원하고 맛있습니다. 기회가 된다면 삼계탕도 먹어 보고 싶습니다.',
 'I like naengmyeon. It is refreshing and delicious when the weather is hot. I would also like to try samgyetang when I have the opportunity.',
 'daily_life', 'beginner', 'optional', array['냉면', '삼계탕', '음식'], 18),

('weather-beach-or-mountain', 'weather',
 '여름에 바다와 산 중 어디에 가고 싶습니까?',
 'Would you rather go to the beach or the mountains in summer?',
 '저는 바다에 가고 싶습니다. 바다에서 수영하고 시원한 바람을 느끼고 싶습니다. 친구들과 함께 가면 더 즐거울 것 같습니다.',
 'I would like to visit the beach. I want to swim and enjoy the cool breeze. I think it would be more enjoyable if I went with my friends.',
 'opinion', 'normal', 'optional', array['바다', '산', '여름'], 19),

('weather-one-sentence', 'weather',
 '한국 여름을 한 문장으로 표현하면 어떻게 말하겠습니까?',
 'If you had to describe Korean summer in one sentence, how would you say it?',
 '한국의 여름은 덥고 습해서 힘들지만, 친구들과 다양한 활동을 즐길 수 있는 계절이라고 생각합니다.',
 'I think summer in Korea is hot and humid, but it is also a season when people can enjoy many activities with their friends.',
 'opinion', 'challenging', 'recommended', array['한문장', '계절', '정리'], 20)

on conflict (slug) do nothing;
