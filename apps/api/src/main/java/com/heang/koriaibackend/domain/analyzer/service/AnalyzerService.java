package com.heang.koriaibackend.domain.analyzer.service;

import com.heang.koriaibackend.common.ai.OpenAiService;
import com.heang.koriaibackend.common.utils.JsonUtils;
import com.heang.koriaibackend.common.ai.OpenAiService.StructuredAiResult;
import com.heang.koriaibackend.common.utils.PromptTemplates;
import com.heang.koriaibackend.domain.analyzer.dto.AnalysisBreakdownItem;
import com.heang.koriaibackend.domain.analyzer.dto.AnalysisResult;
import com.heang.koriaibackend.domain.analyzer.dto.MessageAnalysisResponse;
import com.heang.koriaibackend.domain.analyzer.dto.SuggestedReply;
import com.heang.koriaibackend.domain.analyzer.mapper.MessageAnalysisMapper;
import com.heang.koriaibackend.domain.analyzer.model.MessageAnalysis;
import com.heang.koriaibackend.domain.usage.service.ApiUsageLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalyzerService {

    private final MessageAnalysisMapper messageAnalysisMapper;
    private final OpenAiService openAiService;
    private final ApiUsageLogService apiUsageLogService;
    private final JsonUtils jsonUtils;

    @Value("${openai.model:gpt-5-mini}")
    private String model;

    @Transactional
    public MessageAnalysisResponse analyze(Long userId, String text, String source) {
        String prompt = PromptTemplates.analyzerPrompt(text, source);
        StructuredAiResult<AnalysisResult> result = openAiService.generateStructured(prompt, model, AnalysisResult.class);
        AnalysisResult r = result.value();

        List<AnalysisBreakdownItem> breakdown = r.breakdown == null ? Collections.emptyList()
                : r.breakdown.stream()
                        .map(b -> new AnalysisBreakdownItem(b.fragment, b.meaning, b.note))
                        .toList();
        List<SuggestedReply> replies = r.suggestedReplies == null ? Collections.emptyList()
                : r.suggestedReplies.stream()
                        .map(s -> new SuggestedReply(s.korean, s.english, s.formality))
                        .toList();

        MessageAnalysis analysis = MessageAnalysis.builder()
                .userId(userId)
                .source(source)
                .originalText(text)
                .literalMeaning(r.literalMeaning)
                .naturalMeaning(r.naturalMeaning)
                .businessContext(r.businessContext)
                .politenessLevel(r.politenessLevel)
                .tone(r.tone)
                .breakdown(jsonUtils.toJsonSafe(breakdown))
                .suggestedReplies(jsonUtils.toJsonSafe(replies))
                .modelUsed(result.meta().model())
                .build();
        messageAnalysisMapper.insert(analysis);
        apiUsageLogService.log(userId, "ANALYZER", result.meta());

        return MessageAnalysisResponse.from(analysis, breakdown, replies);
    }

    public List<MessageAnalysisResponse> history(Long userId, int limit) {
        return messageAnalysisMapper.findByUserId(userId, limit).stream()
                .map(it -> MessageAnalysisResponse.from(it, parseBreakdown(it.getBreakdown()), parseReplies(it.getSuggestedReplies())))
                .toList();
    }

    private List<AnalysisBreakdownItem> parseBreakdown(String json) {
        return jsonUtils.parseList(json, AnalysisBreakdownItem.class);
    }

    private List<SuggestedReply> parseReplies(String json) {
        return jsonUtils.parseList(json, SuggestedReply.class);
    }
}
