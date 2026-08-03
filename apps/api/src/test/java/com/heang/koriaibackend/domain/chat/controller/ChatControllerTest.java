package com.heang.koriaibackend.domain.chat.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heang.koriaibackend.domain.chat.dto.ChatSendResponse;
import com.heang.koriaibackend.domain.chat.service.ChatService;
import com.heang.koriaibackend.domain.chat.model.Conversation;
import com.heang.koriaibackend.domain.chat.model.Message;
import com.heang.koriaibackend.security.jwt.JwtAuthenticationFilter;
import com.heang.koriaibackend.security.model.AuthUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ChatController.class)
@AutoConfigureMockMvc(addFilters = false)
class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private ChatService chatService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void setAuthContext() {
        AuthUser authUser = new AuthUser(1L, "user@test.com");
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(authUser, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @AfterEach
    void clearAuthContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createConversation_ShouldReturnConversation() throws Exception {
        Conversation conversation = Conversation.builder()
                .id(10L)
                .userId(1L)
                .title("Cafe Practice")
                .conversationType("ROLE_PLAY")
                .modelUsed("gpt-5-mini")
                .messageCount(0)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
        when(chatService.createConversation(eq(1L), any())).thenReturn(conversation);

        mockMvc.perform(post("/api/chat/conversations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Cafe Practice",
                                "conversationType", "role_play"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.code").value(200))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.modelUsed").value("gpt-5-mini"));
    }

    @Test
    void sendMessage_ShouldReturnAssistantReply() throws Exception {
        ChatSendResponse response = new ChatSendResponse(10L, 101L, 102L, "안녕하세요!");
        when(chatService.sendMessage(1L, "Hello", 10L)).thenReturn(response);

        mockMvc.perform(post("/api/chat/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "conversationId", 10,
                                "message", "Hello"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.code").value(200))
                .andExpect(jsonPath("$.data.assistantReply").value("안녕하세요!"));
    }

    @Test
    void getConversationMessages_ShouldReturnList() throws Exception {
        Message message = Message.builder()
                .id(201L)
                .conversationId(10L)
                .role("ASSISTANT")
                .content("반가워요")
                .tokensUsed(20)
                .createdAt(OffsetDateTime.now())
                .build();
        when(chatService.getConversationMessages(1L, 10L, 100, 0)).thenReturn(List.of(message));

        mockMvc.perform(get("/api/chat/conversations/10/messages")
                        .param("limit", "100")
                        .param("offset", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.code").value(200))
                .andExpect(jsonPath("$.data[0].role").value("ASSISTANT"));
    }
}
