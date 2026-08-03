package com.heang.koriaibackend.domain.users.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heang.koriaibackend.domain.users.model.User;
import com.heang.koriaibackend.domain.users.service.UserService;
import com.heang.koriaibackend.security.jwt.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private User sampleUser() {
        return User.builder()
                .id(1L)
                .email("user@test.com")
                .displayName("Test User")
                .koreanLevel("BEGINNER")
                .preferredModel("gpt-5-mini")
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
    }

    @Test
    void create_ShouldReturnUser() throws Exception {
        when(userService.existsByEmail(any())).thenReturn(false);
        when(userService.create(any())).thenReturn(sampleUser());

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "user@test.com",
                                "password", "password123",
                                "displayName", "Test User",
                                "koreanLevel", "BEGINNER",
                                "preferredModel", "gpt-5-mini"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.code").value(200))
                .andExpect(jsonPath("$.data.email").value("user@test.com"))
                .andExpect(jsonPath("$.data.koreanLevel").value("BEGINNER"));
    }

    @Test
    void create_WhenEmailExists_ShouldReturnError() throws Exception {
        when(userService.existsByEmail(any())).thenReturn(true);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "user@test.com",
                                "password", "password123",
                                "displayName", "Test User",
                                "koreanLevel", "BEGINNER",
                                "preferredModel", "gpt-5-mini"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.code").value(1101));
    }

    @Test
    void findById_ShouldReturnUser() throws Exception {
        when(userService.findById(1L)).thenReturn(Optional.of(sampleUser()));

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.code").value(200))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.displayName").value("Test User"));
    }

    @Test
    void findById_WhenNotFound_ShouldReturn404() throws Exception {
        when(userService.findById(anyLong())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.code").value(404));
    }

    @Test
    void updateProfile_ShouldReturnUpdatedUser() throws Exception {
        User updated = sampleUser();
        updated.setDisplayName("Updated Name");
        updated.setKoreanLevel("INTERMEDIATE");
        when(userService.updateProfile(eq(1L), any())).thenReturn(Optional.of(updated));

        mockMvc.perform(put("/api/users/1/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "displayName", "Updated Name",
                                "koreanLevel", "INTERMEDIATE"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.code").value(200))
                .andExpect(jsonPath("$.data.displayName").value("Updated Name"))
                .andExpect(jsonPath("$.data.koreanLevel").value("INTERMEDIATE"));
    }

    @Test
    void updatePreferredModel_ShouldReturnUpdatedUser() throws Exception {
        User updated = sampleUser();
        updated.setPreferredModel("gpt-5-mini");
        when(userService.updatePreferredModel(eq(1L), any())).thenReturn(Optional.of(updated));

        mockMvc.perform(put("/api/users/1/preferred-model")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("preferredModel", "gpt-5-mini"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.code").value(200))
                .andExpect(jsonPath("$.data.preferredModel").value("gpt-5-mini"));
    }

    @Test
    void delete_ShouldReturnDeleted() throws Exception {
        when(userService.deleteById(1L)).thenReturn(true);

        mockMvc.perform(delete("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.code").value(200))
                .andExpect(jsonPath("$.data.deleted").value(true));
    }

    @Test
    void delete_WhenNotFound_ShouldReturn404() throws Exception {
        when(userService.deleteById(anyLong())).thenReturn(false);

        mockMvc.perform(delete("/api/users/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.code").value(404));
    }
}
