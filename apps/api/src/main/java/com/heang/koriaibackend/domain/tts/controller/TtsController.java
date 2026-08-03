package com.heang.koriaibackend.domain.tts.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Collections;

@RestController
@RequestMapping("/api/tts")
public class TtsController {

    private static final int CACHE_MAX_ENTRIES = 300;

    @Value("${openai.api-key}")
    private String apiKey;

    // Bounded timeouts so a stalled OpenAI TTS call frees the request thread
    // instead of hanging indefinitely (the default factory has no timeouts).
    // The frontend already degrades gracefully when audio fails to load.
    private final RestTemplate restTemplate = buildRestTemplate();

    private static RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(20));
        return new RestTemplate(factory);
    }

    // Vocab terms and phrases are replayed constantly during review sessions —
    // cache the synthesized audio so repeats skip the OpenAI round trip.
    private final Map<String, byte[]> audioCache = Collections.synchronizedMap(
            new LinkedHashMap<>(64, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, byte[]> eldest) {
                    return size() > CACHE_MAX_ENTRIES;
                }
            });

    public record TtsRequest(String text, String voice) {}

    @PostMapping(produces = "audio/mpeg")
    public ResponseEntity<byte[]> speak(@RequestBody TtsRequest req) {
        String voice = (req.voice() != null && !req.voice().isBlank()) ? req.voice() : "nova";
        String text = req.text() != null ? req.text().trim() : "";
        if (text.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        // Limit text length to control cost
        if (text.length() > 500) {
            text = text.substring(0, 500);
        }

        String cacheKey = voice + "|" + text;
        byte[] cached = audioCache.get(cacheKey);
        if (cached != null) {
            return audioResponse(cached);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of(
                "model", "gpt-4o-mini-tts",
                "input", text,
                "voice", voice,
                "instructions", "Speak as a native Korean speaker using standard Seoul (표준어) pronunciation. "
                        + "Articulate accurately: clear final consonants (받침), correct tense/aspirated consonant "
                        + "distinctions (예: ㄲ/ㄱ, ㅋ/ㄱ), accurate vowel quality, and natural liaison (연음) between "
                        + "syllables. Use natural sentence intonation, rhythm, and stress — warm and conversational, "
                        + "not robotic or word-by-word — at a normal, easy-to-follow conversational pace. "
                        + "Pronounce any non-Korean words or proper nouns naturally in their own language."
        );

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<byte[]> response = restTemplate.exchange(
                "https://api.openai.com/v1/audio/speech",
                HttpMethod.POST,
                entity,
                byte[].class
        );

        byte[] audio = response.getBody();
        if (audio != null && audio.length > 0) {
            audioCache.put(cacheKey, audio);
        }
        return audioResponse(audio);
    }

    private ResponseEntity<byte[]> audioResponse(byte[] audio) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/mpeg"))
                .header("Cache-Control", "private, max-age=86400")
                .body(audio);
    }
}
