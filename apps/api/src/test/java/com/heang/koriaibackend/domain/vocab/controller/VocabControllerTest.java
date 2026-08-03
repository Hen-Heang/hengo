package com.heang.koriaibackend.domain.vocab.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heang.koriaibackend.domain.vocab.dto.SaveVocabRequest;
import com.heang.koriaibackend.domain.vocab.dto.VocabItemResponse;
import com.heang.koriaibackend.domain.vocab.service.VocabService;
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

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VocabController.class)
@AutoConfigureMockMvc(addFilters = false)
class VocabControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private VocabService vocabService;

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
    void save_ShouldReturnSavedCard() throws Exception {
        SaveVocabRequest request = new SaveVocabRequest(
                "Correction phrase",
                "안녕하세요",
                "Polite hello",
                "안녕하세요, 처음 뵙겠습니다."
        );
        VocabItemResponse response = new VocabItemResponse(
                "1",
                "Correction phrase",
                "안녕하세요",
                "Polite hello",
                "안녕하세요, 처음 뵙겠습니다.",
                "Hello, nice to meet you.",
                "an-nyeong-ha-se-yo",
                "Easy",
                0,
                "2026-03-14",
                List.of(),
                2.5,
                0,
                0,
                0
        );
        when(vocabService.saveManual(eq(1L), eq(request))).thenReturn(response);

        mockMvc.perform(post("/api/vocab/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.code").value(200))
                .andExpect(jsonPath("$.data.term").value("안녕하세요"))
                .andExpect(jsonPath("$.data.meaning").value("Polite hello"));
    }

    @Test
    void delete_ShouldRemoveCardForCurrentUser() throws Exception {
        mockMvc.perform(delete("/api/vocab/42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.code").value(200));

        verify(vocabService).deleteCard(1L, 42L);
    }
}
