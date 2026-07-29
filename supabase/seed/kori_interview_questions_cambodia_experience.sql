-- Five shared Cambodia-experience follow-ups for the weather interview topic.
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