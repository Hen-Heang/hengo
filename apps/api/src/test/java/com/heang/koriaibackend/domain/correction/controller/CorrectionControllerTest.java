package com.heang.koriaibackend.domain.correction.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heang.koriaibackend.domain.correction.dto.CorrectionChange;
import com.heang.koriaibackend.domain.correction.dto.CorrectionResponse;
import com.heang.koriaibackend.domain.correction.service.CorrectionService;
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

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CorrectionController.class)
@AutoConfigureMockMvc(addFilters = false)
class CorrectionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private CorrectionService correctionService;

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
    void check_ShouldReturnCorrection() throws Exception {
        CorrectionResponse response = new CorrectionResponse(
                1L,
                "안녕 하세요",
                "안녕하세요",
                4,
                "Spacing corrected",
                List.of("Spacing"),
                List.of(new CorrectionChange(" 하", "하", "ha", "spacing")),
                "gpt-5-mini",
                OffsetDateTime.now()
        );
        when(correctionService.check(1L, "안녕 하세요")).thenReturn(response);

        mockMvc.perform(post("/api/corrections/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("text", "안녕 하세요"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.code").value(200))
                .andExpect(jsonPath("$.data.correctedText").value("안녕하세요"));
    }

    @Test
    void history_ShouldReturnCorrectionList() throws Exception {
        CorrectionResponse response = new CorrectionResponse(
                1L,
                "저 는 학생 입니다",
                "저는 학생입니다",
                3,
                "Particle spacing fixed",
                List.of("Particles"),
                List.of(new CorrectionChange(" 는", "는", "topic particle", "particle spacing")),
                "gpt-5-mini",
                OffsetDateTime.now()
        );
        when(correctionService.history(eq(1L), anyInt())).thenReturn(List.of(response));

        mockMvc.perform(get("/api/corrections/history").param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.code").value(200))
                .andExpect(jsonPath("$.data[0].modelUsed").value("gpt-5-mini"));
    }
}
