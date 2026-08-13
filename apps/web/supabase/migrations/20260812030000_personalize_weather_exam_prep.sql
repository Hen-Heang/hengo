-- Personalize the K-Specialist weather question bank for Heang's real Q&A.
-- Goal: short formal answers, real experiences, and listening catch-keywords.
-- Safe to re-run: existing slugs are updated; missing slugs are inserted.

insert into public.kori_interview_questions
  (slug, topic_id, question_ko, question_en, sample_answer_ko, sample_answer_en, category, difficulty, priority, keywords, display_order)
values
  (
    'weather-why-topic', 'weather',
    '왜 이 주제를 선택했습니까?',
    'Why did you choose this topic?',
    '저는 캄보디아 사람이라서 더운 날씨에 익숙합니다. 그런데 한국에서 처음 여름을 보내면서 두 나라의 더위가 많이 다르다고 느꼈습니다. 그래서 제 경험을 이야기하고 싶어서 이 주제를 선택했습니다.',
    'I am Cambodian, so I am used to hot weather. But during my first summer in Korea, I felt that the heat in the two countries was very different. I chose this topic because I wanted to talk about my own experience.',
    'topic_selection', 'beginner', 'must_practice',
    array['왜', '주제', '선택', '이유'], 1
  ),
  (
    'weather-korea-summer-feature', 'weather',
    '한국 여름의 가장 큰 특징은 무엇입니까?',
    'What is the biggest characteristic of Korean summer?',
    '저는 습도가 높은 것이 가장 큰 특징이라고 생각합니다. 밖에서 조금만 걸어도 땀이 많이 납니다. 장마 때는 비도 오래 옵니다.',
    'I think the high humidity is the biggest characteristic. I sweat a lot even after walking outside for a short time. During the rainy season, rain can also continue for a long time.',
    'korean_summer', 'beginner', 'must_practice',
    array['한국 여름', '특징', '어떻습니까', '힘든 점'], 2
  ),
  (
    'weather-biggest-difference', 'weather',
    '한국과 캄보디아의 가장 큰 차이는 무엇입니까?',
    'What is the biggest difference between Korea and Cambodia?',
    '한국에서는 습도와 비를 많이 신경 씁니다. 캄보디아에서는 강한 햇빛과 높은 기온을 더 많이 신경 씁니다. 저는 이것이 가장 큰 차이라고 느꼈습니다.',
    'In Korea, I pay more attention to humidity and rain. In Cambodia, I pay more attention to strong sunlight and high temperatures. I feel this is the biggest difference.',
    'comparison', 'beginner', 'must_practice',
    array['가장 큰 차이', '어떻게 다릅니까', '차이점', '두 나라'], 3
  ),
  (
    'weather-which-heat-harder', 'weather',
    '어느 나라의 더위가 더 힘듭니까?',
    'Which country''s heat is more difficult for you?',
    '기온은 캄보디아가 더 높습니다. 하지만 저는 캄보디아 날씨에 익숙합니다. 한국은 습도가 높아서 생각보다 더 힘들게 느껴질 때가 있습니다.',
    'Cambodia has a higher temperature, but I am used to Cambodian weather. Korea has high humidity, so it sometimes feels more difficult than I expected.',
    'comparison', 'normal', 'must_practice',
    array['어느 나라', '어디', '더 힘듭니까', '한국 여름'], 4
  ),
  (
    'weather-first-jangma', 'weather',
    '한국의 장마를 경험해 보니 어땠습니까?',
    'How was your experience of Korea''s rainy season?',
    '한국에서는 비가 오래 올 때가 있어서 처음에는 조금 불편했습니다. 그래서 요즘은 밖에 나가기 전에 날씨를 확인하고 우산을 가지고 다닙니다.',
    'In Korea, rain can continue for a long time, so it was a little inconvenient at first. Now I check the weather before going out and carry an umbrella.',
    'korean_summer', 'beginner', 'must_practice',
    array['장마', '비', '불편', '우산'], 5
  ),
  (
    'weather-cambodia-hot-day-activity', 'weather',
    '캄보디아에서는 더운 날에 보통 무엇을 했습니까?',
    'What did you usually do on hot days in Cambodia?',
    '낮에는 너무 더워서 주로 실내에서 쉬었습니다. 저녁에는 조금 시원해져서 친구들과 밖에 나갔습니다. 가끔 캄폿이나 시아누크빌에 여행도 갔습니다.',
    'It was too hot during the day, so I usually rested indoors. In the evening, it became cooler, so I went outside with my friends. Sometimes I also traveled to Kampot or Sihanoukville.',
    'cambodian_weather', 'beginner', 'must_practice',
    array['캄보디아', '더운 날', '무엇을 했습니까', '더위'], 6
  ),
  (
    'weather-effect-on-health', 'weather',
    '더운 날씨가 건강에 어떤 영향을 줍니까?',
    'How does hot weather affect your health?',
    '한국에서는 습도가 높아서 땀이 많이 나고, 밤에 더우면 잠을 잘 못 잘 때가 있습니다. 캄보디아에서는 햇빛이 강해서 밖에 오래 있으면 쉽게 피곤해집니다.',
    'In Korea, high humidity makes me sweat a lot, and hot nights can make it difficult to sleep. In Cambodia, strong sunlight makes me tired easily if I stay outside too long.',
    'health', 'normal', 'must_practice',
    array['건강', '영향', '힘든 점', '날씨 때문에'], 7
  ),
  (
    'weather-health-management', 'weather',
    '여름에 건강을 어떻게 관리합니까?',
    'How do you take care of your health in summer?',
    '저는 물을 자주 마십니다. 너무 더운 시간에는 밖에 오래 있지 않고, 피곤할 때는 시원한 곳에서 쉽니다.',
    'I drink water often. I do not stay outside for a long time during the hottest hours, and I rest in a cool place when I am tired.',
    'health', 'beginner', 'must_practice',
    array['건강 관리', '어떻게', '무엇을 합니까', '더위 피하기'], 8
  ),
  (
    'weather-summer-drink-difference', 'weather',
    '한국과 캄보디아에서 여름에 어떤 음료를 마십니까?',
    'What drinks do you have during summer in Korea and Cambodia?',
    '한국에서는 수박 주스를 좋아합니다. 캄보디아에서는 코코넛 커피를 자주 마셨습니다. 둘 다 시원하고 달아서 더운 날에 좋습니다.',
    'In Korea, I like watermelon juice. In Cambodia, I often drank coconut coffee. Both are cold and sweet, so they are nice on hot days.',
    'personal_experience', 'beginner', 'recommended',
    array['음료', '무엇을 마십니까', '한국에서', '캄보디아에서'], 9
  ),
  (
    'weather-yeouido-pool', 'weather',
    '여의도 한강 수영장에 갔을 때 어땠습니까?',
    'How was your visit to the Yeouido Hangang swimming pool?',
    '친구와 함께 여의도 한강 수영장에 갔습니다. 한국에서 여름에 수영한 것은 처음이었습니다. 사람이 많았지만 분위기가 즐거워서 좋은 추억이 되었습니다.',
    'I went to the Yeouido Hangang swimming pool with my friend. It was my first time swimming in Korea during summer. There were many people, but the atmosphere was fun and it became a good memory.',
    'personal_experience', 'beginner', 'must_practice',
    array['여의도', '수영장', '기억에 남는', '이번 여름'], 10
  ),
  (
    'weather-adapted', 'weather',
    '지금은 한국 여름에 익숙해졌습니까?',
    'Are you used to Korean summer now?',
    '아직 완전히 익숙하지는 않지만 조금씩 익숙해지고 있습니다. 요즘은 날씨를 미리 확인하고 물을 자주 마시면서 건강을 관리하려고 합니다.',
    'I am not completely used to it yet, but I am gradually getting used to it. These days, I check the weather in advance and drink water often to take care of my health.',
    'adaptation', 'beginner', 'must_practice',
    array['지금', '익숙해졌습니까', '적응', '처음과 지금'], 11
  ),
  (
    'weather-summer-lesson', 'weather',
    '두 나라의 여름을 경험하면서 무엇을 느꼈습니까?',
    'What did you learn from experiencing summer in both countries?',
    '처음에는 캄보디아 사람이라서 한국 여름도 괜찮을 거라고 생각했습니다. 하지만 직접 경험해 보니까 기온만 중요한 것이 아니었습니다. 습도, 비, 햇빛에 따라 느끼는 더위가 다르다는 것을 알게 되었습니다.',
    'At first, I thought Korean summer would be fine because I am Cambodian. But after experiencing it myself, I learned that temperature is not the only important factor. Humidity, rain, and sunlight change how the heat feels.',
    'adaptation', 'normal', 'must_practice',
    array['무엇을 느꼈습니까', '배웠습니까', '경험', '생각이 달라'], 12
  ),
  (
    'weather-seonyudo-did', 'weather',
    '여름에 다른 곳에도 가 봤습니까?',
    'Did you visit any other places during summer?',
    '친구와 선유도공원에도 갔습니다. 공원을 오래 걸어서 조금 피곤했지만, 나무와 강을 보고 저녁에는 서울 야경도 봤습니다. 사진도 많이 찍었습니다.',
    'I also went to Seonyudo Park with my friend. We walked for a long time, so I was a little tired, but I saw the trees and river, enjoyed Seoul''s night view, and took many photos.',
    'personal_experience', 'beginner', 'optional',
    array['다른 곳', '또 어디', '친구', '무엇을 했습니까'], 90
  ),
  (
    'weather-han-river-cycling', 'weather',
    '한국 여름에 앞으로 해 보고 싶은 일이 있습니까?',
    'What would you like to try during Korean summer?',
    '저는 자전거 타는 것을 좋아합니다. 그래서 저녁에 한강에서 자전거를 타고 싶습니다. 운동도 하고 시원한 바람과 강 풍경도 즐기고 싶습니다.',
    'I like riding a bicycle, so I want to ride along the Han River in the evening. I want to exercise and enjoy the cool breeze and river view.',
    'personal_experience', 'beginner', 'optional',
    array['해 보고 싶은 일', '한강', '자전거', '운동'], 91
  )
on conflict (slug) do update set
  topic_id = excluded.topic_id,
  question_ko = excluded.question_ko,
  question_en = excluded.question_en,
  sample_answer_ko = excluded.sample_answer_ko,
  sample_answer_en = excluded.sample_answer_en,
  category = excluded.category,
  difficulty = excluded.difficulty,
  priority = excluded.priority,
  keywords = excluded.keywords,
  display_order = excluded.display_order;
