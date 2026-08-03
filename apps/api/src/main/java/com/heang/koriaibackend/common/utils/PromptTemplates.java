package com.heang.koriaibackend.common.utils;

// Static prompt library: one method per AI feature, each building one prompt
// string to hand to OpenAiService. Pure string templating, no I/O.
public final class PromptTemplates {

    // Utility class: never instantiated, only static methods are used.
    private PromptTemplates() {
    }

    // Returns fallback when value is null/blank, so prompts never end up
    // with a literal "null" or empty gap where a field was missing.
    private static String orDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    // Used to skip optional profile fields instead of feeding the model "unspecified" noise.
    private static boolean has(String v) {
        return v != null && !v.isBlank();
    }

    // Shared wording for the 3 Korean speech levels, reused by every prompt that
    // needs the model to label formality, so the phrasing stays consistent everywhere.
    private static final String FORMALITY_LABELS = "반말 (casual), 존댓말 (polite), or 격식체 (formal)";

    /**
     * A compact "about the learner" block built from the user's profile, used to
     * personalize prompts (examples, topics, difficulty, and native-language glosses).
     * Returns an empty string when no profile data is available. Only non-blank
     * fields are included, so the model isn't fed "unspecified" noise.
     */
    // Builds a reusable snippet (not a full prompt) that other prompts splice in
    // via %s, e.g., chatPrompt below. Only non-blank fields are included.
    public static String learnerProfileBlock(String country, String nativeLanguage,
                                             String occupation, Integer yearsOfExperience,
                                             String learningGoal) {
        StringBuilder sb = new StringBuilder();
        if (has(occupation)) {
            sb.append("- Job: ").append(occupation);
            if (yearsOfExperience != null && yearsOfExperience > 0) {
                sb.append(" (").append(yearsOfExperience).append(" yrs experience)");
            }
            sb.append("\n");
        }
        if (has(learningGoal)) {
            sb.append("- Main learning goal: ").append(learningGoal).append("\n");
        }
        if (has(nativeLanguage)) {
            sb.append("- Native language: ").append(nativeLanguage)
                    .append(" — for hard words you may add a short gloss in ").append(nativeLanguage)
                    .append(" in addition to English.\n");
        }
        if (has(country)) {
            sb.append("- From: ").append(country).append("\n");
        }
        if (sb.isEmpty()) {
            return "";
        }
        return """
                About the learner (use this to tailor examples, topics, and difficulty to their job and goal — \
                don't mention it explicitly unless relevant):
                %s""".formatted(sb.toString());
    }

    // Main tutor chat prompt. Free-text reply (not JSON) since this feeds a
    // conversational chat UI, not a structured form.
    public static String chatPrompt(String userMessage, String conversationType, String koreanLevel,
                                    String learnerName, String history, String learnerProfile) {
        return """
                You are KoriAI, a warm, encouraging Korean language tutor and conversation coach.
                You are helping %s, whose Korean level is %s. Conversation type: %s.
                
                Coaching style:
                - Reply in clear, learner-friendly English. Keep it concise (2-5 sentences) unless more is asked.
                - If the learner writes Korean with mistakes, gently correct it: show the corrected Korean, then briefly explain the fix in English.
                - Whenever you give Korean, include the English translation, and add Revised Romanization for beginner/intermediate learners.
                - Match the Korean difficulty to the learner's level.
                - When useful, ground examples in the learner's job and goal so practice is relevant to their real work.
                - Acknowledge their effort first, then teach. Stay supportive and motivating.
                - End with a short natural follow-up question in Korean (with its English translation) to keep them practicing.
                - Use the conversation so far for context; do not repeat yourself or forget what was already said.
                
                %s
                %s
                
                The learner just said:
                %s
                """.formatted(
                orDefault(learnerName, "the learner"),
                orDefault(koreanLevel, "unspecified"),
                conversationType,
                orDefault(learnerProfile, ""),
                orDefault(history, "(This is the start of the conversation.)"),
                userMessage);
    }

    // Grammar/spelling correction. JSON output -> parsed via generateStructured
    // into a typed result with per-fragment corrections and reasons.
    public static String correctionPrompt(String text) {
        return """
                You are a Korean grammar and spelling correction assistant helping Korean learners improve their writing.
                Return ONLY valid JSON with this exact shape (no extra text):
                {
                  "correctedText": "...",
                  "rating": <integer 1-5 rating the ORIGINAL sentence's quality, 1 = needs work, 5 = native-like>,
                  "explanation": "Brief overall summary of corrections in English (1-2 sentences)",
                  "grammarPoints": ["Point 1 in English", "Point 2 in English"],
                  "changes": [
                    {
                      "original": "exact original Korean fragment that was wrong",
                      "corrected": "the corrected Korean fragment",
                      "englishMeaning": "English meaning of the corrected phrase",
                      "reason": "Clear explanation in English of WHY this correction was needed (grammar rule, spelling rule, natural phrasing, etc.)"
                    }
                  ]
                }
                Rules:
                - "changes" must list EVERY individual correction made. If nothing was changed, return an empty array [].
                - "original" and "corrected" should be short fragments (the specific part that changed), not the whole sentence.
                - "reason" should teach the learner so they understand the rule, not just what changed.
                - "rating" reflects how close the ORIGINAL (uncorrected) sentence was to native-like Korean: 5 means no or only trivial issues, 1 means major grammar/spelling problems throughout.
                - All explanations must be in English to help Korean learners understand.
                
                Correct and explain this Korean text:
                %s
                """.formatted(text);
    }

    // Generates a batch of flashcards for a category/level. JSON array output.
    public static String vocabGenerationPrompt(String category, String level, int count) {
        return """
                You are a Korean vocabulary teacher for foreign software engineers working in Korea.
                Generate %d Korean vocabulary flashcards for the category "%s" suitable for a %s level learner.
                Focus on practical, high-frequency words and phrases used in real daily workplace situations.
                Return ONLY valid JSON array with this shape (no extra text):
                [
                  {
                    "term": "Korean word or phrase",
                    "meaning": "English meaning",
                    "pronunciation": "Revised Romanization (e.g. an-nyeong-ha-se-yo)",
                    "difficultyLevel": "Easy | Medium | Hard",
                    "example": "Short natural Korean sentence using the term in a daily workplace context",
                    "exampleTranslation": "English translation of the example sentence",
                    "tags": ["tag1", "tag2"]
                  }
                ]
                Rules:
                - "pronunciation" must use Revised Romanization (ISO 11941).
                - "difficultyLevel" must be exactly "Easy", "Medium", or "Hard" based on the learner level.
                - "example" must be a realistic sentence a Korean coworker or developer would actually say.
                """.formatted(count, category, level);
    }

    // One daily phrase. avoidList is passed in so the model doesn't repeat
    // recently shown phrases; uses the shared FORMALITY_LABELS for the formality field.
    public static String dailyPhrasePrompt(String level, String avoidList) {
        return """
                You are a Korean workplace communication coach for foreign software engineers working at Korean tech companies.
                Generate ONE useful daily Korean workplace phrase suitable for a %s level learner.
                Prefer practical expressions used in standups, code reviews, deployments, reporting, and team chat.
                Do NOT repeat any of these recently used phrases: %s
                Return ONLY valid JSON with this exact shape (no extra text, no markdown fences):
                {
                  "phrase": "The Korean phrase",
                  "meaning": "Natural English meaning",
                  "romanization": "Revised Romanization of the phrase",
                  "whenToUse": "1-2 sentences in English describing the workplace situation where this is used",
                  "formality": "The Korean formality label — exactly one of %s — optionally followed by a short English gloss in parentheses, e.g. "존댓말 (polite)"",
                  "similarExpressions": [
                    { "phrase": "A similar Korean expression", "meaning": "Its English meaning" }
                  ]
                }
                Rules:
                - "phrase" must be natural Korean a real Korean developer would actually say or write.
                - Provide 2-3 similar expressions. If none fit, return an empty array [].
                - All explanations must be in English.
                """.formatted(level, orDefault(avoidList, "(none)"), FORMALITY_LABELS);
    }

    // Gives 3 phrasings of the same intent across formality levels, so the
    // learner can pick the right register for who they're talking to.
    public static String messageGeneratorPrompt(String intent, String category, String level) {
        return """
                You are a Korean workplace messaging coach for foreign software engineers at Korean tech companies.
                The user wants to express the following intent at work: "%s"
                Message category: %s
                User Korean level: %s
                Produce 3 natural Korean ways to express this, ranging across formality levels.
                Return ONLY valid JSON with this exact shape (no extra text, no markdown fences):
                {
                  "variations": [
                    {
                      "Korean": "The Korean message",
                      "romanization": "Revised Romanization",
                      "formality": "The Korean formality label — exactly one of %s — optionally followed by a short English gloss in parentheses, e.g. "존댓말 (polite)"",
                      "situation": "Short English note on the best situation to use this version"
                    }
                  ],
                  "note": "1-2 sentences of overall English guidance on choosing between the variations"
                }
                Rules:
                - Provide exactly 3 variations ordered from most formal to most casual.
                - Each "Korean" must be natural workplace Korean a real Korean developer would use.
                - All explanations must be in English.
                """.formatted(intent, orDefault(category, "General"), level, FORMALITY_LABELS);
    }

    // Builds a short multi-speaker dialogue plus a 4-option comprehension quiz for it.
    public static String listeningLessonPrompt(String topic, String level) {
        return """
                You are a Korean listening-comprehension content creator for foreign software engineers at Korean tech companies.
                Create a short, natural workplace conversation in Korean about the topic: "%s".
                Target a %s level learner. Keep it realistic for a software team (2-3 speakers, 5-8 short turns).
                Then write 3 English comprehension questions about the conversation.
                Return ONLY valid JSON with this exact shape (no extra text, no markdown fences):
                {
                  "title": "Short English title for the lesson",
                  "lines": [
                    { "speaker": "Speaker name or role", "Korean": "Korean line", "English": "English translation" }
                  ],
                  "quiz": [
                    {
                      "question": "Comprehension question in English",
                      "options": ["Option A", "Option B", "Option C", "Option D"],
                      "answerIndex": 0,
                      "explanation": "Why this answer is correct, in English"
                    }
                  ]
                }
                Rules:
                - Provide exactly 4 options per question and set answerIndex (0-based) to the correct one.
                - Korean lines must be natural workplace Korean a real Korean developer would say.
                - Every line must include an accurate English translation.
                """.formatted(topic, level);
    }

    // Parses a raw pasted word list (e.g. from a textbook) into structured vocab
    // entries. Asks the model to preserve the user's own translation verbatim
    // while also adding its own English gloss ("meaningEn") for consistency.
    public static String vocabImportPrompt(String rawText) {
        return """
                You are a Korean vocabulary list parser for a flashcard app.
                The user pasted a word list from their Korean textbook (e.g. KIIP 사회통합프로그램).
                The list may contain numbering, section headers (명사, 동사, 형용사, 부사), emoji, and translations in ANY language (English, Khmer, etc.).
                Extract every vocabulary entry. Return ONLY a valid JSON array (no extra text, no markdown fences):
                [
                  {
                    "term": "the Korean word or phrase exactly as written",
                    "meaning": "the translation exactly as the user wrote it, unchanged",
                    "meaningEn": "short English meaning of the Korean term (1-5 words)",
                    "pronunciation": "Revised Romanization of the term",
                    "partOfSpeech": "noun | verb | adjective | adverb | expression"
                  }
                ]
                Rules:
                - Keep the user's translation EXACTLY as written, including their language. Do not translate or edit it.
                - "meaningEn" is YOUR English gloss, added so the learner can also study Korean-English.
                - Use the section headers (명사/동사/형용사/부사) to set partOfSpeech when present; otherwise infer it.
                - Skip lines that are headers, lesson titles, or not vocabulary entries.
                - Do not invent entries that are not in the list.
                
                Parse this list:
                %s
                """.formatted(rawText);
    }

    // Generates a writing challenge asking the learner to use a given word in
    // a sentence; pairs with sentenceCheckPrompt below which grades the attempt.
    public static String sentenceChallengePrompt(String term, String meaning) {
        return """
                You are a Korean language practice coach for foreign software engineers at Korean tech companies.
                Generate a sentence writing challenge for the Korean word: "%s" (meaning: %s).
                Return ONLY valid JSON with this exact shape (no extra text, no markdown fences):
                {
                  "challengePrompt": "A clear English instruction (1 sentence) telling the user to write a Korean sentence using this word in a realistic workplace situation",
                  "contextHint": "A short English hint about the workplace situation (e.g. standup, Slack message, code review) to help the learner imagine the context",
                  "exampleAnswer": "A natural Korean model answer sentence that a real Korean developer would say or write"
                }
                Rules:
                - challengePrompt must be in English, action-oriented, workplace-focused.
                - contextHint must be 1 short English sentence giving the scene.
                - exampleAnswer must use the Korean term naturally and be realistic for a Korean tech company.
                """.formatted(term, meaning);
    }

    // Grades the learner's sentence attempt from sentenceChallengePrompt above:
    // a 0-100 score, pass/fail at 60, a corrected version, and a teaching note.
    public static String sentenceCheckPrompt(String term, String meaning, String challengePrompt, String attempt) {
        return """
                You are a Korean language coach evaluating a Korean learner's sentence.
                The learner was asked: "%s"
                Target Korean word: "%s" (meaning: %s)
                Learner's attempt: "%s"
                
                Evaluate and return ONLY valid JSON with this exact shape (no extra text, no markdown fences):
                {
                  "score": <integer 0-100>,
                  "correct": <true if score >= 60, false otherwise>,
                  "feedback": "2-3 sentences in English: what they got right and what needs improvement",
                  "correctedSentence": "The corrected Korean sentence (same as attempt if already perfect)",
                  "betterAlternative": "A more natural or professional Korean sentence using the same word",
                  "grammarNote": "One key grammar or vocabulary point the learner should remember from this exercise"
                }
                Rules:
                - Score 0-100: grammar correctness + naturalness + word usage.
                - If the attempt is blank or in English only, score 0 and explain in feedback.
                - All explanations must be in English.
                - betterAlternative must be realistic workplace Korean.
                """.formatted(challengePrompt, term, meaning, attempt);
    }

    // Quick dictionary-style lookup for a single word: short definition, one
    // example sentence, and the Hanja root when the word is Sino-Korean.
    public static String wordLookupPrompt(String word) {
        return """
                You are a Korean-English dictionary for Korean learners.
                Define the Korean word: "%s"
                Return ONLY valid JSON with this exact shape (no extra text, no markdown fences):
                {
                  "definition": "Concise English translation (1-6 words)",
                  "example": "One short natural Korean sentence using the word",
                  "exampleTranslation": "English translation of the example sentence",
                  "hanja": "The Hanja root if the word is Sino-Korean, otherwise null"
                }
                Rules:
                - The example must be simple enough for a beginner-intermediate learner.
                - Set "hanja" to null (JSON null, not the string "null") for native Korean or loan words.
                """.formatted(word);
    }

    // Deep-dive analysis of a real message from a coworker: literal vs. intended
    // meaning, social/business context, formality, fragment-by-fragment
    // honorific breakdown, and suggested replies across formality levels.
    public static String analyzerPrompt(String text, String source) {
        return """
                You are a Korean workplace communication analyst helping a foreign software engineer
                fully understand real Korean messages from coworkers (Slack, KakaoTalk, meeting notes, team chat).
                The message source context is: %s
                Analyze the message below in EXTREME detail so a non-native engineer understands exactly what was meant,
                how it lands socially, and how they should respond.
                Return ONLY valid JSON with this exact shape (no extra text, no markdown fences):
                {
                  "literalMeaning": "Word-for-word literal English meaning, even if it sounds unnatural",
                  "naturalMeaning": "What a Korean coworker actually means by this in plain English",
                  "businessContext": "2-4 sentences on the workplace situation, intent, and any implied action items or expectations",
                  "politenessLevel": "The Korean formality label — exactly one of %s — followed by a short English note on who it is appropriate for, e.g. "존댓말 (polite) — appropriate for coworkers and clients"",
                  "tone": "Short read of the emotional/social tone (e.g. neutral, urgent, friendly, passive-aggressive, apologetic)",
                  "breakdown": [
                    {
                      "fragment": "A short Korean fragment from the message",
                      "meaning": "English meaning of that fragment",
                      "note": "Nuance, honorific marker, grammar, or cultural note explaining why it matters"
                    }
                  ],
                  "suggestedReplies": [
                    {
                      "Korean": "A natural Korean reply the engineer could send",
                      "English": "English translation of the reply",
                      "formality": "The Korean formality label of this reply — exactly one of %s"
                    }
                  ]
                }
                Rules:
                - "breakdown" must cover EVERY meaningful phrase/honorific in the message so nothing is left unexplained.
                - Provide 2-3 "suggestedReplies" ranging across formality unless a reply would be inappropriate, then return [].
                - Pay special attention to honorifics (-시-, -습니다, -드리다, 분, 님) and explain the social signal each sends.
                - All explanations must be in English.
                
                Analyze this Korean workplace message:
                %s
                """.formatted(orDefault(source, "(unspecified)"), FORMALITY_LABELS, FORMALITY_LABELS, text);
    }

}
