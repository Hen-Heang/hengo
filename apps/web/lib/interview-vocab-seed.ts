// Curated starter vocabulary for the Korea-vs-Cambodia summer-weather topic.
// Deliberately NOT a new table/UI: these just get inserted as normal rows into
// kori_vocab_cards (via vocabApi.save, lib/api/vocab.ts) so review/SRS/mastery
// all reuse the existing /vocab page and lib/srs.ts scheduler as-is.

export interface InterviewVocabSeedItem {
  category: string
  term: string
  meaning: string
  example: string
  exampleTranslation: string
}

// Free-text category strings (kori_vocab_cards.category has no enum) — kept
// as an explicit list so the interview progress card can count how many of
// these specific starter items a user has already loaded/mastered.
export const INTERVIEW_VOCAB_CATEGORIES = [
  "Summer",
  "Heat",
  "Humidity",
  "Rain",
  "Rainy Season",
  "Dry Season",
  "Adaptation",
  "Health",
  "Exercise",
  "Food",
  "Air Conditioner",
  "Sleep",
  "Daily Life",
  "Transportation",
] as const

export const INTERVIEW_VOCAB_SEED: InterviewVocabSeedItem[] = [
  { category: "Summer", term: "여름", meaning: "summer", example: "한국의 여름은 6월부터 8월까지입니다.", exampleTranslation: "Summer in Korea is from June to August." },
  { category: "Heat", term: "덥다", meaning: "to be hot", example: "오늘은 정말 덥습니다.", exampleTranslation: "It is really hot today." },
  { category: "Heat", term: "무덥다", meaning: "to be sweltering, muggy", example: "장마가 끝나면 날씨가 더 무더워집니다.", exampleTranslation: "After the rainy season ends, the weather gets even more sweltering." },
  { category: "Heat", term: "폭염", meaning: "heat wave", example: "폭염 때는 낮에 밖에 나가지 않는 것이 좋습니다.", exampleTranslation: "During a heat wave, it's best not to go outside during the day." },
  { category: "Heat", term: "열대야", meaning: "tropical night (a night that stays hot)", example: "열대야 때문에 잠을 잘 못 잤습니다.", exampleTranslation: "I couldn't sleep well because of the tropical night." },
  { category: "Humidity", term: "습하다", meaning: "to be humid", example: "한국의 여름은 덥고 습합니다.", exampleTranslation: "Summer in Korea is hot and humid." },
  { category: "Humidity", term: "습도", meaning: "humidity (noun)", example: "습도가 높아서 실제 온도보다 더 덥게 느껴집니다.", exampleTranslation: "The humidity is high, so it feels hotter than the actual temperature." },
  { category: "Rainy Season", term: "장마", meaning: "rainy season", example: "장마철에는 비가 계속 옵니다.", exampleTranslation: "It rains continuously during the rainy season." },
  { category: "Rain", term: "소나기", meaning: "rain shower", example: "오후에 갑자기 소나기가 내렸습니다.", exampleTranslation: "A rain shower suddenly fell in the afternoon." },
  { category: "Rain", term: "우산", meaning: "umbrella", example: "장마철에는 우산을 항상 가지고 다닙니다.", exampleTranslation: "I always carry an umbrella during the rainy season." },
  { category: "Health", term: "더위를 먹다", meaning: "to suffer from heat exhaustion", example: "물을 충분히 마시지 않으면 더위를 먹을 수 있습니다.", exampleTranslation: "If you don't drink enough water, you can suffer from heat exhaustion." },
  { category: "Health", term: "냉방병", meaning: "air-conditioning sickness", example: "에어컨을 너무 세게 틀면 냉방병에 걸릴 수 있습니다.", exampleTranslation: "If you run the air conditioner too strong, you can get air-conditioning sickness." },
  { category: "Health", term: "땀", meaning: "sweat", example: "습도가 높아서 땀이 많이 납니다.", exampleTranslation: "The humidity is high, so I sweat a lot." },
  { category: "Air Conditioner", term: "에어컨", meaning: "air conditioner", example: "더운 날에는 에어컨이 있는 실내에서 시간을 보냅니다.", exampleTranslation: "On hot days, people spend time indoors where there is air conditioning." },
  { category: "Air Conditioner", term: "선풍기", meaning: "electric fan", example: "캄보디아에서는 선풍기를 자주 사용합니다.", exampleTranslation: "In Cambodia, people frequently use electric fans." },
  { category: "Exercise", term: "산책하다", meaning: "to take a walk", example: "선유도공원을 걸으며 산책했습니다.", exampleTranslation: "I took a walk around Seonyudo Park." },
  { category: "Exercise", term: "수영하다", meaning: "to swim", example: "여의도 한강 수영장에서 수영했습니다.", exampleTranslation: "I swam at the Yeouido Hangang swimming pool." },
  { category: "Food", term: "냉면", meaning: "cold noodles", example: "더운 여름에는 냉면이 시원하고 맛있습니다.", exampleTranslation: "In the hot summer, naengmyeon is refreshing and delicious." },
  { category: "Food", term: "삼계탕", meaning: "ginseng chicken soup (eaten to gain strength in summer)", example: "사람들은 삼계탕을 먹으면서 힘을 얻습니다.", exampleTranslation: "People eat samgyetang to regain their energy." },
  { category: "Sleep", term: "잠을 설치다", meaning: "to sleep poorly", example: "밤에도 더워서 잠을 설쳤습니다.", exampleTranslation: "It was hot even at night, so I slept poorly." },
  { category: "Transportation", term: "대중교통", meaning: "public transportation", example: "장마철에는 대중교통을 이용하는 것이 더 편합니다.", exampleTranslation: "During the rainy season, it's more convenient to use public transportation." },
  { category: "Daily Life", term: "야경", meaning: "night view", example: "선유도공원에서 서울의 야경을 구경했습니다.", exampleTranslation: "I enjoyed the night view of Seoul at Seonyudo Park." },
  { category: "Summer", term: "기온", meaning: "temperature", example: "캄보디아는 3월부터 5월까지 기온이 40도 가까이 올라갑니다.", exampleTranslation: "In Cambodia, the temperature can rise to nearly 40 degrees from March to May." },
  { category: "Dry Season", term: "건기", meaning: "dry season", example: "캄보디아는 건기와 우기 두 계절이 있습니다.", exampleTranslation: "Cambodia has two seasons: the dry season and the rainy season." },
  { category: "Rainy Season", term: "우기", meaning: "rainy/wet season (Cambodia)", example: "캄보디아의 우기에는 비가 많이 옵니다.", exampleTranslation: "It rains a lot during Cambodia's rainy season." },
  { category: "Heat", term: "그늘", meaning: "shade", example: "낮에는 너무 더워서 보통 그늘에서 쉽니다.", exampleTranslation: "During the day it's too hot, so people usually rest in the shade." },
  { category: "Adaptation", term: "적응하다", meaning: "to adapt", example: "저는 조금씩 한국 여름에 적응하고 있습니다.", exampleTranslation: "I am gradually adapting to Korean summer." },
  { category: "Daily Life", term: "활기차다", meaning: "to be lively, energetic", example: "사람이 많아서 분위기가 활기찼습니다.", exampleTranslation: "It was crowded, so the atmosphere was lively." },
  { category: "Daily Life", term: "상쾌하다", meaning: "to be refreshing, fresh (air)", example: "공원의 공기가 상쾌해서 기분이 좋았습니다.", exampleTranslation: "The park's air was refreshing, so I felt good." },
  { category: "Health", term: "힘을 얻다", meaning: "to gain strength/energy", example: "사람들은 삼계탕을 먹으면서 힘을 얻습니다.", exampleTranslation: "People gain strength by eating samgyetang." },
  { category: "Health", term: "수분을 섭취하다", meaning: "to stay hydrated, take in fluids", example: "더울 때는 수분을 충분히 섭취해야 합니다.", exampleTranslation: "You need to stay well-hydrated when it's hot." },
  { category: "Food", term: "팥빙수", meaning: "shaved ice dessert with red beans", example: "여름에는 팥빙수 같은 시원한 음식을 즐겨 먹습니다.", exampleTranslation: "In summer, people enjoy cool food like patbingsu." },
]
