package com.heang.koriaibackend.domain.messagegen.dto;

import java.util.List;

public record GenerateMessageResponse(
        String intent,
        String category,
        List<MessageVariation> variations,
        String note
) {
}
