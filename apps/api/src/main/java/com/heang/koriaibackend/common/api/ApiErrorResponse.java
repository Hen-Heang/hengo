package com.heang.koriaibackend.common.api;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor

public class ApiErrorResponse {
    // When the error happened
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp = LocalDateTime.now();

    // HTTP status code (401, 404, 500)
    private int status;

    // Quick title of the error ("Unauthorized", "Not Found", etc.)
    private String error;

    // Human-readable message
    private String message;

    // The API endpoint that caused the error
    private String path;

    // Custom constructor without timestamp (timestamp auto-set)
    public ApiErrorResponse(int status, String error, String message, String path) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
    }
}
