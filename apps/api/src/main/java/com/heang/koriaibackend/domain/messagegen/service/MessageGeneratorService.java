package com.heang.koriaibackend.domain.messagegen.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heang.koriaibackend.common.ai.OpenAiService;
import com.heang.koriaibackend.common.ai.dto.OpenAiResult;
import com.heang.koriaibackend.common.utils.PromptTemplates;
import com.heang.koriaibackend.domain.messagegen.dto.GenerateMessageRequest;
import com.heang.koriaibackend.domain.messagegen.dto.GenerateMessageResponse;
import com.heang.koriaibackend.domain.messagegen.dto.MessageVariation;
import com.heang.koriaibackend.domain.usage.service.ApiUsageLogService;
import com.heang.koriaibackend.domain.users.mapper.UserMapper;
import com.heang.koriaibackend.domain.users.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageGeneratorService {

    public static final List<String> CATEGORIES = List.of(
            "Reporting Progress",
            "Asking Questions",
            "Requesting Help",
            "Meeting Communication",
            "Deployment Updates",
            "Bug Reports",
            "Requesting Time Off",
            "Status Update to Manager",
            "Declining a Request Politely",
            "Apologizing for a Mistake",
            "Scheduling a Meeting"
    );

    private final OpenAiService openAiService;
    private final ApiUsageLogService apiUsageLogService;
    private final UserMapper userMapper;
    private final ObjectMapper objectMapper;

    @Value("${openai.model:gpt-5-mini}")
    private String model;

    public List<String> categories() {
        return CATEGORIES;
    }

    public GenerateMessageResponse generate(Long userId, GenerateMessageRequest request) {
        User user = userMapper.findById(userId).orElse(null);
        String level = (user != null && user.getKoreanLevel() != null) ? user.getKoreanLevel() : "BEGINNER";

        String prompt = PromptTemplates.messageGeneratorPrompt(request.intent(), request.category(), level);
        OpenAiResult result = openAiService.generate(prompt, model);
        apiUsageLogService.log(userId, "MESSAGE_GEN", result);

        GeneratorPayload payload = parsePayload(result.content());
        return new GenerateMessageResponse(
                request.intent(),
                request.category(),
                payload.variations() != null ? payload.variations() : Collections.emptyList(),
                payload.note());
    }

    private GeneratorPayload parsePayload(String json) {
        try {
            String cleaned = json.trim();
            int start = cleaned.indexOf('{');
            int end = cleaned.lastIndexOf('}');
            if (start != -1 && end != -1) {
                cleaned = cleaned.substring(start, end + 1);
            }
            return objectMapper.readValue(cleaned, GeneratorPayload.class);
        } catch (JsonProcessingException e) {
            return new GeneratorPayload(Collections.emptyList(),
                    "Could not generate message variations. Please try rephrasing your intent.");
        }
    }

    private record GeneratorPayload(List<MessageVariation> variations, String note) {
    }
}
