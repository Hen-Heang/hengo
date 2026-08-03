# KoriAI Backend

REST API backend for KoriAI — an AI-powered Korean language learning platform. Built with Spring Boot, MyBatis, PostgreSQL, and OpenAI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Spring Boot 4.0.3 |
| Language | Java 17 |
| Database | PostgreSQL |
| ORM | MyBatis + Flyway migrations |
| Auth | JWT (stateless) |
| AI | OpenAI API — `gpt-5-mini` (chat, corrections, vocab) + `gpt-4o-mini-tts` (TTS) |
| Deployment | Railway (Docker) |

---

## Getting Started

### Prerequisites
- Java 17+
- PostgreSQL running locally
- OpenAI API key

### Environment Variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=sk-proj-...
DB_URL=jdbc:postgresql://localhost:5432/aitestdb
DB_USERNAME=postgres
DB_PASSWORD=123
JWT_SECRET=your-long-random-secret
```

### Run Locally

```bash
export $(cat .env | xargs) && ./mvnw spring-boot:run
```

Server starts on `http://localhost:8080`

### Run Tests

```bash
export $(cat .env | xargs) && ./mvnw test
```

---

## API Reference

**Base URL:** `http://localhost:8080/api`

> All endpoints require `Authorization: Bearer <token>` except `/auth/**`, `/health`, and the Telegram webhook (`POST /telegram/webhook`, verified via the `X-Telegram-Bot-Api-Secret-Token` header instead).

---

### Authentication `/api/auth`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/register` | `{email, password, displayName, koreanLevel}` | Create a new account |
| POST | `/login` | `{email, password}` | Returns JWT token |

**`koreanLevel` values:** `beginner`, `intermediate`, `advanced`

---

### Chat `/api/chat`

| Method | Path | Body / Params | Description |
|--------|------|--------------|-------------|
| POST | `/conversations` | `{title, conversationType, scenarioId?}` | Create a new conversation |
| GET | `/conversations` | `?limit=20&offset=0` | List user's conversations |
| GET | `/conversations/{id}/messages` | `?limit=100&offset=0` | Get messages in a conversation |
| POST | `/send` | `{conversationId, message}` | Send message — waits for full reply |
| POST | `/stream` | `{conversationId, message}` | Send message — **streaming SSE response** |

#### Streaming Response Format (`/stream`)

Returns `text/event-stream`. Events arrive as:

```
event: start
data: {"userMessageId": 1}

event: token
data: {"token": "안녕"}

event: token
data: {"token": "하세요!"}

event: done
data: {"assistantMessageId": 2}

event: error
data: {"message": "Streaming failed"}
```

---

### Corrections `/api/corrections`

| Method | Path | Body / Params | Description |
|--------|------|--------------|-------------|
| POST | `/check` | `{text}` | Check Korean grammar/spelling, returns corrections |
| GET | `/history` | `?limit=30` | User's past correction history |

**Response includes:** `correctedText`, `explanation`, `grammarPoints[]`, `changes[]` (with original/corrected/reason per change)

---


### Vocabulary `/api/vocab`

| Method | Path | Body / Params | Description |
|--------|------|--------------|-------------|
| GET | `/` | — | All saved vocab words |
| POST | `/save` | `{term, meaning, example?, category?}` | Save a vocab word manually |
| GET | `/review/due` | — | Cards due for spaced-repetition review |
| POST | `/{id}/review` | `?correct=true` | Mark a card as reviewed |
| POST | `/generate` | `?category=food&count=10` | AI-generate vocab cards (max 20) |

---

### Dashboard `/api/dashboard`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/progress` | Streak, weekly minutes, words saved, accuracy, daily activity chart |
| GET | `/streak` | `{streakDays, activityToday}` |

---

### Scenarios `/api/scenarios`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all 8 learning scenarios |
| GET | `/{id}` | Get one scenario by ID |

**Available scenarios:** Restaurant, Convenience Store, Subway, Job Interview, Doctor Visit, University, Business Negotiation, Discussing Current Events

---

### Text-to-Speech `/api/tts`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/` | `{text, voice}` | Returns `audio/mpeg` — Korean TTS via OpenAI |

**Text limit:** 500 characters

---

### Goals `/api/goals`

| Method | Path | Body / Params | Description |
|--------|------|--------------|-------------|
| GET | `/` | — | List user's goals |
| GET | `/starred` | — | List starred/pinned goals |
| GET | `/{id}` | — | Get a goal by ID |
| POST | `/` | `{title, description?, targetDate?, noDuration?, status?, metadata?}` | Create a goal |
| PUT | `/{id}` | `UpdateGoalRequest` | Update a goal |
| DELETE | `/{id}` | — | Delete a goal and its tasks |
| POST | `/{goalId}/star` | — | Toggle starred status, returns `{isStarred}` |
| GET | `/{id}/tasks` | — | List tasks for a goal |
| POST | `/{id}/generate-tasks` | `GenerateTasksRequest?` | AI-generate tasks for a goal |
| POST | `/{id}/coach/stream` | `CoachStreamRequest` | Per-goal AI coach chat — **streaming SSE** |
| GET | `/{goalId}/members` | — | List goal members |
| GET | `/by-share-code/{shareCode}` | — | Preview a goal by its share code |
| POST | `/by-share-code/{shareCode}/join` | — | Join a goal via share code |
| DELETE | `/{goalId}/members/me` | — | Leave a goal |
| DELETE | `/{goalId}/members/{userId}` | — | Remove a member (owner only) |
| POST | `/{goalId}/share-code/regenerate` | — | Regenerate the share code, returns `{shareCode}` |
| PUT | `/{goalId}/members/last-seen` | — | Update caller's last-seen timestamp in the goal |

### Goal Themes `/api/goal-themes`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/` | — | List user's goal themes |
| POST | `/` | `SaveGoalThemeRequest` | Create a theme |
| PUT | `/{id}` | `SaveGoalThemeRequest` | Update a theme |
| DELETE | `/{id}` | — | Delete a theme |

### Goal Notifications `/api/goal-notifications`

| Method | Path | Body / Params | Description |
|--------|------|--------------|-------------|
| GET | `/` | `?onlyUnread=false` | List notifications |
| POST | `/invite` | `CreateInviteRequest` | Invite a user to a goal |
| PUT | `/{id}/read` | — | Mark a notification as read |
| PUT | `/{id}/respond` | `?accept=true` | Accept/decline a goal invite |

### Tasks `/api/tasks`

| Method | Path | Body / Params | Description |
|--------|------|--------------|-------------|
| GET | `/` | `?goalId=&from=&to=` | List tasks (optionally scoped to a goal or date range) |
| POST | `/` | `CreateTaskRequest` | Create a standalone or goal-linked task |
| PUT | `/{id}` | `UpdateTaskRequest` | Update a task |
| DELETE | `/{id}` | — | Delete a task |

---

### Notes `/api/notes`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/` | — | List user's notes |
| GET | `/{slug}` | — | Get a note by slug |
| POST | `/` | `{slug, title, description?, icon?, category?, content?, tags?}` | Create a note |
| PUT | `/{slug}` | Same as create | Update a note |
| DELETE | `/{slug}` | — | Delete a note, returns `{deleted}` |

---

### Reading `/api/reading/units`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/` | — | List user's reading units |
| GET | `/{id}` | — | Get a reading unit |
| POST | `/` | `{episode?, title, titleEnglish, category, level, summary?, source?, grammarNote?, paragraphs[], vocab?[], quiz?[]}` | Create a reading unit |
| PUT | `/{id}` | Same as create | Update a reading unit |
| DELETE | `/{id}` | — | Delete a reading unit, returns `{deleted}` |

---

### Daily Phrase `/api/daily-phrase`

| Method | Path | Body / Params | Description |
|--------|------|--------------|-------------|
| GET | `/today` | — | Get (or generate) today's phrase |
| GET | `/history` | — | List past phrases |
| POST | `/{id}/learned` | `?learned=true` | Mark phrase learned/unlearned |
| POST | `/{id}/flashcard` | — | Add phrase to vocab/flashcards |
| GET | `/{id}/practice` | — | Get a sentence-practice challenge for the phrase |
| POST | `/{id}/check-practice` | `{sentence}` | Check a practice attempt |
| DELETE | `/{id}` | — | Delete a phrase |

---

### Achievements `/api/achievements`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get achievement summary (unlocked + progress) |
| POST | `/check` | Evaluate and return newly-unlocked achievements |

---

### Message Analyzer `/api/analyzer`

| Method | Path | Body / Params | Description |
|--------|------|--------------|-------------|
| POST | `/analyze` | `{text, source?}` | Analyze a workplace Korean message (Slack/KakaoTalk-style) |
| GET | `/history` | `?limit=30` | Past analyses |

---

### Foundations `/api/foundations`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/progress` | — | Per-track lesson progress |
| POST | `/lessons/{lessonId}/complete` | `{track, accuracy, completed}` | Record a lesson completion |

---

### Interview Scripts `/api/interview/scripts`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/{topicId}` | — | Get the saved script for a topic |
| PUT | `/{topicId}` | `{sections: {sectionId: content}}` | Save/update a script |

---

### Listening `/api/listening`

| Method | Path | Body / Params | Description |
|--------|------|--------------|-------------|
| GET | `/topics` | — | List available topics |
| POST | `/generate` | `?topic=` | AI-generate a new listening lesson |
| GET | `/lessons` | — | List user's lessons |
| GET | `/lessons/{id}` | — | Get one lesson |
| POST | `/attempts` | `{lessonId, answers[]}` | Submit quiz answers |

---

### Message Generator `/api/message-generator`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/categories` | — | List message categories |
| POST | `/generate` | `{intent, category?}` | AI-generate workplace message variants |

---

### Practice `/api/practice`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/today` | Aggregated "what to practice today" across daily phrase, vocab review, listening, etc. |

---

### Push Notifications `/api/push` & `/api/telegram`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/push/telegram/link` | — | Start Telegram linking, returns a `t.me` deep link |
| GET | `/push/telegram/status` | — | `{linked}` |
| DELETE | `/push/telegram` | — | Unlink Telegram |
| GET | `/push/web/vapid-public-key` | — | Get the Web Push VAPID public key |
| POST | `/push/web/subscribe` | `{endpoint, keys: {p256dh, auth}}` | Register a browser push subscription |
| POST | `/push/web/unsubscribe` | `{endpoint}` | Remove a browser subscription |
| POST | `/push/devices` | `{token, ...}` | Register an FCM device token |
| POST | `/push/devices/unregister` | `{token}` | Unregister an FCM device token |
| POST | `/telegram/webhook` | Telegram `Update` payload | **Public.** Telegram bot webhook, verified via `X-Telegram-Bot-Api-Secret-Token` |

---

### Users `/api/users`

| Method | Path | Body / Params | Description |
|--------|------|--------------|-------------|
| GET | `/search` | `?q=&limit=10` | Search users by name/email (excludes self) |
| GET | `/{id}` | — | Get a user profile |
| PUT | `/{id}/profile` | `{displayName, koreanLevel}` | Update profile |
| PUT | `/{id}/preferred-model` | `{preferredModel}` | Set the OpenAI model used for this user's chats |
| POST | `/{id}/profile-image` | `multipart/form-data` field `file` | Upload a profile image (own account only) |
| GET | `/{id}/profile-image` | — | Stream the raw image bytes (`Cache-Control: private, max-age=3600`) |

**Profile image rules:** max **2 MB**, content type must be `image/jpeg`, `image/png`, or `image/webp`. The image is stored in Postgres; `UserResponse.hasProfileImage` indicates whether one is set without transferring the bytes.

---

### Health `/api/health`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | `{status: "UP", name, timestamp}` — public, no auth required |

---

## Data Models

### User
```
id, email, passwordHash, displayName, koreanLevel, preferredModel,
profileImageContentType, profileImageData (bytea), hasProfileImage, createdAt, updatedAt
```
> `profileImageData` is only loaded by the profile-image endpoint; normal lookups carry just the `hasProfileImage` flag.

### Conversation
```
id, userId, scenarioId, title, conversationType, modelUsed, messageCount, createdAt, updatedAt
```

### Message
```
id, conversationId, role (USER | ASSISTANT), content, tokensUsed, createdAt
```

### SentenceCorrection
```
id, userId, originalText, correctedText, explanation, grammarPoints (JSON), changes (JSON), modelUsed, createdAt
```

### VocabCard
```
id, userId, category, term, meaning, example, exampleTranslation, mastery (0–5), nextReviewDate, tags, createdAt
```

### ApiUsageLog
```
id, userId, model, feature, promptTokens, completionTokens, estimatedCostUsd, responseTimeMs, createdAt
```

---

## Project Structure

```
src/
├── main/
│   ├── java/com/heang/koriaibackend/
│   │   ├── ai/                    # OpenAI service + streaming
│   │   ├── common/                # API response wrapper, exceptions, utils
│   │   ├── config/                # Security, CORS, OpenAI, Jackson config
│   │   ├── domain/
│   │   │   ├── achievements/      # Achievement unlocking + XP
│   │   │   ├── analyzer/          # Workplace message analyzer (Slack/KakaoTalk text)
│   │   │   ├── auth/              # Register + login
│   │   │   ├── chat/              # Chat conversations + SSE streaming
│   │   │   ├── conversations/     # Conversation CRUD
│   │   │   ├── correction/        # Grammar correction
│   │   │   ├── dailyphrase/       # Daily phrase + practice challenges
│   │   │   ├── dashboard/         # Progress + streak
│   │   │   ├── foundation/        # Foundation lesson tracks + progress
│   │   │   ├── goal/              # Goals, tasks, themes, members, invites, AI coach
│   │   │   ├── health/            # Health check
│   │   │   ├── interview/         # Interview script builder
│   │   │   ├── listening/         # AI-generated listening lessons + quizzes
│   │   │   ├── messagegen/        # Workplace message generator
│   │   │   ├── messages/          # Message CRUD
│   │   │   ├── note/              # User notes
│   │   │   ├── notification/      # Notification support (used by goal invites)
│   │   │   ├── practice/          # Aggregated "today's practice" feed
│   │   │   ├── push/              # Telegram + Web Push + FCM notifications
│   │   │   ├── reading/           # Reading units
│   │   │   ├── scenarios/         # Hardcoded learning scenarios
│   │   │   ├── tts/               # Text-to-speech
│   │   │   ├── usage/             # API usage logging
│   │   │   ├── users/             # User profile management
│   │   │   └── vocab/             # Vocabulary + spaced repetition
│   │   └── security/              # JWT filter + utilities
│   └── resources/
│       ├── application.yaml       # App config
│       ├── db/migration/          # Flyway SQL migrations
│       └── mapper/                # MyBatis XML mappers
└── test/
```

---

## API Response Format

All endpoints return a consistent wrapper:

```json
{
  "data": { ... },
  "status": {
    "code": 0,
    "message": "Success"
  }
}
```

Error example:
```json
{
  "data": { "message": "Invalid username or password" },
  "status": {
    "code": 1001,
    "message": "Invalid username or password"
  }
}
```

---

## Deployment

Deployed on **Railway** via Docker. See `railway.toml` and `Dockerfile`.

Health check path: `/api/health`
