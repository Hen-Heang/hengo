-- Sync the K-Specialist weather Q&A bank with the mentor-reviewed final script.
-- Keeps answers short enough for speaking while matching the final wording.

insert into public.kori_interview_questions
  (slug, topic_id, question_ko, question_en, sample_answer_ko, sample_answer_en, category, difficulty, priority, keywords, display_order)
values
  (
    'weather-why-topic', 'weather',
    '왜 이 주제를 선택했습니까?',
    'Why did you choose this topic?',
    '저는 캄보디아 사람이라서 더운 날씨에 익숙합니다. 하지만 한국에서 처음 여름을 보내면서 두 나라의 더위가 많이 다르게 느껴졌습니다. 그래서 제 경험을 이야기하고 싶어서 이 주제를 선택했습니다.',
    'I am Cambodian, so I am used to hot weather. But during my first summer in Korea, the heat in the two countries felt very different. I chose this topic because I wanted to talk about my own experience.',
    'topic_selection', 'beginner', 'must_practice',
    array['왜', '주제', '선택', '이유'], 1
  ),
  (
    'weather-korea-summer-feature', 'weather',
    '한국 여름의 가장 큰 특징은 무엇입니까?',
    'What is the biggest characteristic of Korean summer?',
    '한국은 기온이 낮을 때도 있지만 습도가 높습니다. 밖에서 조금만 걸어도 땀이 나고, 오히려 한국이 더 덥게 느껴질 때도 많습니다. 그리고 장마 때는 며칠 동안 비가 계속 옵니다.',
    'Korea can have lower temperatures, but the humidity is high. Even after a short walk I sweat, and Korea can actually feel hotter. During the rainy season, rain can continue for several days.',
    'korean_summer', 'beginner', 'must_practice',
    array['한국 여름', '특징', '습도', '오히려', '장마'], 2
  ),
  (
    'weather-biggest-difference', 'weather',
    '한국과 캄보디아의 가장 큰 차이는 무엇입니까?',
    'What is the biggest difference between Korea and Cambodia?',
    '한국에서는 습도와 비를 많이 신경 씁니다. 하지만 캄보디아에서는 강한 햇빛과 높은 기온을 더 많이 신경 씁니다. 제 경험으로는 이것이 가장 큰 차이입니다.',
    'In Korea, I pay more attention to humidity and rain. In Cambodia, I pay more attention to strong sunlight and high temperatures. In my experience, this is the biggest difference.',
    'comparison', 'beginner', 'must_practice',
    array['가장 큰 차이', '차이점', '두 나라', '습도', '햇빛'], 3
  ),
  (
    'weather-which-heat-harder', 'weather',
    '어느 나라의 더위가 더 힘듭니까?',
    'Which country''s heat feels harder?',
    '기온은 캄보디아가 더 높습니다. 하지만 한국은 습도가 높아서 오히려 한국이 더 덥게 느껴질 때도 많습니다.',
    'Cambodia has higher temperatures. However, Korea has high humidity, so Korea can actually feel hotter to me.',
    'comparison', 'normal', 'must_practice',
    array['어느 나라', '더 힘듭니까', '더 덥게', '오히려', '습도'], 4
  ),
  (
    'weather-first-jangma', 'weather',
    '한국의 장마를 경험해 보니 어땠습니까?',
    'How was your experience of Korea''s rainy season?',
    '장마는 며칠 동안 비가 계속 오는 것을 말합니다. 그래서 장마 때에는 밖에 나가기 전에 반드시 날씨를 확인하고 우산을 항상 가지고 다닙니다.',
    'The rainy season means rain continues for several days. So during it, I always check the weather before going out and always carry an umbrella.',
    'korean_summer', 'beginner', 'must_practice',
    array['장마', '비', '며칠', '날씨 확인', '우산'], 5
  ),
  (
    'weather-cambodia-hottest-season', 'weather',
    '캄보디아에서 가장 더운 시기는 언제입니까?',
    'When is the hottest period in Cambodia?',
    '캄보디아는 특히 3월부터 5월까지 많이 덥고, 4월이 가장 덥습니다. 기온이 37도에서 40도까지 올라갈 때도 있습니다.',
    'Cambodia is especially hot from March to May, and April is the hottest month. Temperatures can rise from 37 to 40 degrees.',
    'cambodian_weather', 'beginner', 'must_practice',
    array['가장 더운', '3월', '4월', '5월', '37도', '40도'], 6
  ),
  (
    'weather-cambodia-hot-day-activity', 'weather',
    '캄보디아에서는 더운 날에 보통 무엇을 했습니까?',
    'What did you usually do on hot days in Cambodia?',
    '낮에 너무 더울 때면 주로 실내에 들어가서 쉬고는 했습니다. 저녁에는 조금 시원해져서 친구들과 밖에 나갔습니다. 가끔 캄폿이나 시아누크빌에 여행도 갔습니다.',
    'When it was too hot during the day, I usually went indoors and rested. In the evening it became cooler, so I went outside with friends. Sometimes we traveled to Kampot or Sihanoukville.',
    'cambodian_weather', 'beginner', 'must_practice',
    array['캄보디아', '더운 날', '실내', '저녁', '캄폿', '시아누크빌'], 7
  ),
  (
    'weather-effect-on-health', 'weather',
    '더운 날씨가 건강에 어떤 영향을 줍니까?',
    'How does hot weather affect your health?',
    '한국에서는 습도가 높아서 땀이 많이 나고, 밤에도 너무 더우면 잠을 잘 못 잘 때가 있습니다. 반면에 캄보디아에서는 햇빛이 아주 강해서 밖에 오래 있으면 쉽게 피곤해집니다.',
    'In Korea, high humidity makes me sweat a lot, and very hot nights can make it hard to sleep. In Cambodia, strong sunlight makes me tired easily if I stay outside too long.',
    'health', 'normal', 'must_practice',
    array['건강', '영향', '땀', '잠', '반면에', '피곤'], 8
  ),
  (
    'weather-health-management', 'weather',
    '여름에 건강을 어떻게 관리합니까?',
    'How do you take care of your health in hot weather?',
    '저는 물을 자주 마십니다. 너무 더운 시간대에는 밖에 오래 있지 않으려고 하고, 피곤할 때는 시원한 곳에서 쉬는 편입니다.',
    'I drink water often. I try not to stay outside during the hottest hours, and when I am tired I usually rest in a cool place.',
    'health', 'beginner', 'must_practice',
    array['건강 관리', '물', '더운 시간대', '시원한 곳', '쉬는 편'], 9
  ),
  (
    'weather-summer-drink-difference', 'weather',
    '더운 날에 어떤 음료를 좋아합니까?',
    'What drinks do you like on hot days?',
    '캄보디아에서는 주로 코코넛 커피를 많이 마셨는데, 한국에서는 더운 날에 수박 주스를 마시는 것을 좋아합니다. 둘 다 달고 시원하고, 저에게는 두 나라의 더운 날씨를 생각나게 합니다.',
    'In Cambodia, I often drank coconut coffee, while in Korea I like watermelon juice on hot days. Both are sweet and cool, and they remind me of the hot weather in the two countries.',
    'personal_experience', 'beginner', 'recommended',
    array['음료', '코코넛 커피', '수박 주스', '달고 시원'], 10
  ),
  (
    'weather-yeouido-pool', 'weather',
    '여의도 한강 수영장에 갔을 때 어땠습니까?',
    'How was your visit to the Yeouido Hangang swimming pool?',
    '친구와 함께 여의도 한강 수영장에 갔습니다. 한국에서 여름을 맞는 것도, 수영을 한 것도 처음이었습니다. 사람이 많았고 분위기가 화기애애하고 즐거워서 캄보디아에 돌아가서도 잊지 못할 좋은 추억이 되었습니다.',
    'I went to the Yeouido Hangang swimming pool with my friend. It was both my first summer in Korea and my first time swimming here. The atmosphere was warm and cheerful, so it became a memory I will not forget even after returning to Cambodia.',
    'personal_experience', 'beginner', 'must_practice',
    array['여의도', '수영장', '기억에 남는', '화기애애', '추억'], 11
  ),
  (
    'weather-adapted', 'weather',
    '지금은 한국 여름에 익숙해졌습니까?',
    'Are you used to Korean summer now?',
    '지금은 한국 여름에 조금씩 익숙해지고 있습니다. 이제는 날씨를 미리 확인하고, 물을 자주 마시고, 건강도 잘 관리하려고 노력합니다.',
    'I am gradually getting used to Korean summer. Now I check the weather in advance, drink water often, and try to take good care of my health.',
    'adaptation', 'beginner', 'must_practice',
    array['지금', '익숙', '날씨 확인', '물', '건강 관리'], 12
  ),
  (
    'weather-summer-lesson', 'weather',
    '두 나라의 더운 날씨를 경험하면서 무엇을 느꼈습니까?',
    'What did you learn from experiencing hot weather in both countries?',
    '한국에 오기 전에는 캄보디아 사람이니까 한국 여름은 괜찮겠다고 생각했습니다. 하지만 직접 경험해 보니까 단순히 기온만 중요한 것이 아니었습니다. 습도, 비, 햇빛의 세기에 따라서 느끼는 더위가 많이 달랐습니다.',
    'Before coming to Korea, I thought Korean summer would be fine because I am Cambodian. But after experiencing it myself, I learned that temperature alone is not what matters. Humidity, rain, and the strength of sunlight change how hot the weather feels.',
    'adaptation', 'normal', 'must_practice',
    array['무엇을 느꼈습니까', '경험', '기온만', '습도', '비', '햇빛의 세기'], 13
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
  display_order = excluded.display_order,
  updated_at = now();
