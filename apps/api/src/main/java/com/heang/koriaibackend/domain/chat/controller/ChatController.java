package com.heang.koriaibackend.domain.chat.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.domain.chat.dto.ChatConversationResponse;
import com.heang.koriaibackend.domain.chat.dto.ChatMessageResponse;
import com.heang.koriaibackend.domain.chat.dto.ChatSendResponse;
import com.heang.koriaibackend.domain.chat.dto.CreateChatConversationRequest;
import com.heang.koriaibackend.domain.chat.dto.RenameConversationRequest;
import com.heang.koriaibackend.domain.chat.dto.SendChatMessageRequest;
import com.heang.koriaibackend.domain.chat.service.ChatService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Validated
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/conversations")
    public ApiResponse<ChatConversationResponse> createConversation(@Valid @RequestBody CreateChatConversationRequest req) {
        Long userId = SecurityUtils.currentUserId();
        return ApiResponse.success(ChatConversationResponse.from(chatService.createConversation(userId, req)));
    }

    @PostMapping("/send")
    public ApiResponse<ChatSendResponse> sendMessage(@Valid @RequestBody SendChatMessageRequest req) {
        Long userId = SecurityUtils.currentUserId();
        return ApiResponse.success(chatService.sendMessage(userId, req.message(), req.conversationId()));
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamMessage(@Valid @RequestBody SendChatMessageRequest req) {
        Long userId = SecurityUtils.currentUserId();
        return chatService.streamMessage(userId, req.message(), req.conversationId());
    }

    @GetMapping("/conversations")
    public ApiResponse<List<ChatConversationResponse>> getConversations(@RequestParam(defaultValue = "20") int limit,
                                                                        @RequestParam(defaultValue = "0") int offset) {
        Long userId = SecurityUtils.currentUserId();
        List<ChatConversationResponse> data = chatService.getConversations(userId, limit, offset)
                .stream()
                .map(ChatConversationResponse::from)
                .toList();
        return ApiResponse.success(data);
    }

    @PutMapping("/conversations/{id}")
    public ApiResponse<ChatConversationResponse> renameConversation(@PathVariable("id") Long id,
                                                                    @Valid @RequestBody RenameConversationRequest req) {
        Long userId = SecurityUtils.currentUserId();
        return ApiResponse.success(
                ChatConversationResponse.from(chatService.renameConversation(userId, id, req.title())));
    }

    @DeleteMapping("/conversations/{id}")
    public ApiResponse<Map<String, Boolean>> deleteConversation(@PathVariable("id") Long id) {
        Long userId = SecurityUtils.currentUserId();
        chatService.deleteConversation(userId, id);
        return ApiResponse.success(Map.of("deleted", true));
    }

    @GetMapping("/conversations/{id}/messages")
    public ApiResponse<List<ChatMessageResponse>> getConversationMessages(@PathVariable("id") Long conversationId,
                                                                          @RequestParam(defaultValue = "100") int limit,
                                                                          @RequestParam(defaultValue = "0") int offset) {
        Long userId = SecurityUtils.currentUserId();
        List<ChatMessageResponse> data = chatService.getConversationMessages(userId, conversationId, limit, offset)
                .stream()
                .map(ChatMessageResponse::from)
                .toList();
        return ApiResponse.success(data);
    }
}
