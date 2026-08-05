-- Fifteen shared, script-aligned follow-ups for the weather interview topic.
-- The live project already contains the 20-question base seed plus the
-- separately applied 30-question extension. This focused seed avoids
-- duplicating either set and remains safe to run more than once.

with question_seed (
  slug,
  question_ko,
  question_en,
  sample_answer_ko,
  sample_answer_en,
  category,
  difficulty,
  priority,
  keywords,
  order_offset
) as (
  values
    (
      'weather-cambodia-hot-place',
      '캄보디아에서 날씨가 더울 때 어디에 갔습니까?',
      'Where did you go when the weather was hot in Cambodia?',
      '날씨가 더울 때 가끔 친구들과 캄폿이나 시아누크빌 같은 바닷가에 갔습니다. 바다에서 수영하고 시원한 바람을 느끼면서 더위를 식혔습니다.',
      'When the weather was hot, I sometimes went to seaside areas such as Kampot or Sihanoukville with my friends. We swam and enjoyed the cool breeze to escape the heat.',
      'personal_experience',
      'beginner',
      'must_practice',
      array['캄폿', '시아누크빌', '바닷가'],
      1
    ),
    (
      'weather-cambodia-why-seaside',
      '왜 바다에 자주 갔습니까?',
      'Why did you go to the seaside?',
      '날씨가 너무 더워서 시원하게 수영하고 싶었습니다. 친구들과 즐거운 시간을 보내고 싶어서 바다에 갔습니다.',
      'The weather was very hot, so I wanted to cool down by swimming. I also went because I wanted to spend an enjoyable time with my friends.',
      'personal_experience',
      'beginner',
      'recommended',
      array['수영', '더위', '친구'],
      2
    ),
    (
      'weather-cambodia-seaside-activities',
      '바다에서는 친구들과 무엇을 했습니까?',
      'What did you do at the seaside with your friends?',
      '친구들과 바다에서 수영하고 해변을 걸었습니다. 시원한 바람을 느끼면서 사진도 찍었습니다.',
      'I swam in the sea and walked along the beach with my friends. We also took photos while enjoying the cool breeze.',
      'personal_experience',
      'beginner',
      'recommended',
      array['수영', '해변', '사진'],
      3
    ),
    (
      'weather-cambodia-seaside-memory',
      '캄보디아 바다에서 가장 기억에 남는 것은 무엇입니까?',
      'What do you remember most about the seaside in Cambodia?',
      '친구들과 함께 수영한 것이 가장 기억에 남습니다. 날씨는 더웠지만 바닷바람이 시원해서 기분이 좋았습니다.',
      'Swimming with my friends is what I remember most. The weather was hot, but the sea breeze was cool and made me feel good.',
      'personal_experience',
      'normal',
      'recommended',
      array['추억', '바닷바람', '수영'],
      4
    ),
    (
      'weather-korea-cambodia-summer-activities',
      '한국과 캄보디아의 여름 활동은 어떻게 다릅니까?',
      'How are summer activities different in Korea and Cambodia?',
      '두 나라 모두 더운 날에 수영장이나 바다에 갑니다. 하지만 캄보디아에서는 가장 더운 낮 시간을 피하고, 저녁에 더 많이 활동하는 편입니다.',
      'In both countries, people visit swimming pools or beaches on hot days. However, in Cambodia, people tend to avoid the hottest daytime hours and do more activities in the evening.',
      'comparison',
      'normal',
      'must_practice',
      array['여름활동', '낮시간', '비교'],
      5
    ),
    (
      'weather-cambodia-new-year',
      '캄보디아 새해는 언제이고, 사람들은 보통 무엇을 합니까?',
      'When is Cambodian New Year, and what do people usually do?',
      '캄보디아 새해는 4월에 있습니다. 날씨는 아주 덥지만, 많은 사람들이 가족과 시간을 보내거나 여행을 갑니다.',
      'Cambodian New Year is in April. Although the weather is very hot, many people spend time with their families or travel.',
      'cambodian_weather',
      'normal',
      'recommended',
      array['캄보디아새해', '4월', '가족'],
      6
    ),
    (
      'weather-korea-hot-day-drink',
      '한국에서 더운 날에 어떤 음료를 좋아합니까?',
      'What drink do you like on hot days in Korea?',
      '저는 한국에서 더운 날에 수박 주스를 마시는 것을 좋아합니다. 시원하고 달아서 마시면 기분이 좋아집니다.',
      'I like drinking watermelon juice on hot days in Korea. It is cool and sweet, so it makes me feel good.',
      'personal_experience',
      'beginner',
      'recommended',
      array['수박주스', '음료', '시원하다'],
      7
    ),
    (
      'weather-cambodia-hot-day-drink',
      '캄보디아에서 더운 날에 어떤 음료를 자주 마셨습니까?',
      'What drink did you often have on hot days in Cambodia?',
      '캄보디아에서는 더운 날에 코코넛 커피를 자주 마셨습니다. 달고 시원해서 더운 날씨와 잘 어울립니다.',
      'In Cambodia, I often drank coconut coffee on hot days. It is sweet and cool, so it goes well with hot weather.',
      'personal_experience',
      'beginner',
      'recommended',
      array['코코넛커피', '음료', '더운날'],
      8
    ),
    (
      'weather-summer-drink-difference',
      '한국과 캄보디아에서 마시는 여름 음료는 어떻게 다릅니까?',
      'How are the summer drinks you have in Korea and Cambodia different?',
      '한국에서는 수박 주스를 마시고, 캄보디아에서는 코코넛 커피를 마십니다. 두 음료 모두 달고 시원하지만 맛과 재료가 다릅니다.',
      'In Korea, I drink watermelon juice, while in Cambodia, I drink coconut coffee. Both drinks are sweet and cool, but their flavors and ingredients are different.',
      'comparison',
      'normal',
      'must_practice',
      array['수박주스', '코코넛커피', '비교'],
      9
    ),
    (
      'weather-rain-pattern-difference',
      '한국과 캄보디아에서는 비가 오는 모습이 어떻게 다릅니까?',
      'How is the rain different in Korea and Cambodia?',
      '한국에서는 장마철에 비가 오랫동안 내립니다. 하지만 캄보디아에서는 비가 갑자기 많이 내렸다가 빨리 그칠 때가 많습니다.',
      'In Korea, rain continues for a long time during the rainy season. However, in Cambodia, it often rains heavily and suddenly and then stops quickly.',
      'comparison',
      'challenging',
      'must_practice',
      array['장마철', '갑자기', '비교'],
      10
    ),
    (
      'weather-umbrella-or-shade',
      '왜 한국에서는 우산이 중요하고 캄보디아에서는 그늘이 중요하다고 생각합니까?',
      'Why do you think umbrellas are important in Korea and shade is important in Cambodia?',
      '한국에서는 장마철에 비가 오래 내리기 때문에 우산이 중요합니다. 캄보디아에서는 햇빛이 매우 강하고 더워서 그늘을 찾는 것이 더 중요합니다.',
      'In Korea, umbrellas are important because rain can continue for a long time during the rainy season. In Cambodia, finding shade is more important because the sunlight is very strong and the weather is hot.',
      'comparison',
      'challenging',
      'recommended',
      array['우산', '그늘', '햇빛'],
      11
    ),
    (
      'weather-han-river-cycling',
      '한국 여름에 꼭 해 보고 싶은 일은 무엇입니까?',
      'What is something you really want to do during the Korean summer?',
      '저는 저녁에 한강에서 자전거를 타고 싶습니다. 자전거를 타면서 시원한 바람과 여름 풍경을 즐기고 싶습니다.',
      'I want to ride a bicycle along the Han River in the evening. I want to enjoy the cool breeze and the summer scenery while riding.',
      'personal_experience',
      'beginner',
      'must_practice',
      array['한강', '자전거', '저녁'],
      12
    ),
    (
      'weather-why-evening-cycling',
      '왜 저녁에 한강에서 자전거를 타고 싶습니까?',
      'Why do you want to ride a bicycle along the Han River in the evening?',
      '저녁에는 날씨가 조금 시원해서 자전거를 타기 좋습니다. 운동도 하고 푸른 나무와 강 풍경도 볼 수 있기 때문입니다.',
      'I want to ride in the evening because the weather is cooler. I can exercise and also enjoy the green trees and river view.',
      'personal_experience',
      'normal',
      'recommended',
      array['한강', '자전거', '풍경'],
      13
    ),
    (
      'weather-yeongjongdo-plan',
      '영종도에 가면 무엇을 하고 싶습니까?',
      'What would you like to do if you visit Yeongjongdo?',
      '영종도 바닷가를 걸으면서 시원한 바람을 느끼고 싶습니다. 한국의 여름 바다도 즐기고 싶습니다.',
      'I want to walk near the beach in Yeongjongdo and feel the cool breeze. I also want to enjoy the Korean summer by the sea.',
      'personal_experience',
      'beginner',
      'recommended',
      array['영종도', '바닷가', '바람'],
      14
    ),
    (
      'weather-summer-lesson',
      '두 나라의 여름을 경험하면서 무엇을 배웠습니까?',
      'What did you learn from experiencing summer in both countries?',
      '날씨에 맞게 생활하고 건강을 관리하는 것이 중요하다는 것을 배웠습니다. 앞으로도 물을 자주 마시고 더운 시간에는 충분히 쉬려고 합니다.',
      'I learned that it is important to adjust the way I live to the weather and take care of my health. I will continue to drink water often and rest enough during the hottest hours.',
      'adaptation',
      'challenging',
      'must_practice',
      array['경험', '건강관리', '적응'],
      15
    )
),
base_order as (
  select coalesce(max(display_order), 0) as max_order
  from public.kori_interview_questions
  where topic_id = 'weather'
    and slug not in (select slug from question_seed)
)
insert into public.kori_interview_questions (
  slug,
  topic_id,
  question_ko,
  question_en,
  sample_answer_ko,
  sample_answer_en,
  category,
  difficulty,
  priority,
  keywords,
  display_order
)
select
  question_seed.slug,
  'weather',
  question_seed.question_ko,
  question_seed.question_en,
  question_seed.sample_answer_ko,
  question_seed.sample_answer_en,
  question_seed.category,
  question_seed.difficulty,
  question_seed.priority,
  question_seed.keywords,
  base_order.max_order + question_seed.order_offset
from question_seed
cross join base_order
on conflict (slug) do nothing;
