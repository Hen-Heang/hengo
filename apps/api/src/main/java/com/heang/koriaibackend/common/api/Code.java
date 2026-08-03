package com.heang.koriaibackend.common.api;

import lombok.Getter;

@Getter
public enum Code {
    SUCCESS(200, "Success", 200),

    // General HTTP Errors (HTTP 일반 에러)
    BAD_REQUEST(400, "Bad request", 400),
    NOT_FOUND(404, "Not found", 404),

    // Authentication Errors (1000-1099)
    AUTHENTICATION_FAILED(1000, "Authentication failed", 401),
    INVALID_CREDENTIALS(1001, "Invalid username or password", 401),
    ACCOUNT_LOCKED(1002, "Account has been locked", 403),
    ACCOUNT_DISABLED(1003, "Account is disabled", 403),
    TOKEN_EXPIRED(1004, "Authentication token has expired", 401),
    TOKEN_INVALID(1005, "Invalid authentication token", 401),
    INSUFFICIENT_PERMISSIONS(1006, "Insufficient permissions for this operation", 403),
    REFRESH_TOKEN_INVALID(1007, "Invalid or revoked refresh token", 401),
    REFRESH_TOKEN_EXPIRED(1008, "Refresh token has expired", 401),

    // Registration Errors (1100-1199)
    REGISTRATION_FAILED(1100, "Registration failed", 400),
    EMAIL_ALREADY_EXISTS(1101, "Email already exists", 409),
    USERNAME_ALREADY_EXISTS(1102, "Username already exists", 409),
    PASSWORD_TOO_WEAK(1103, "Password does not meet strength requirements", 400),
    EMAIL_CANNOT_BE_NULL(1104, "Email cannot be null or blank", 400),
    INVALID_EMAIL_FORMAT(1105, "Invalid email format", 400),
    PASSWORD_CANNOT_BE_NULL(1106, "Password cannot be null or blank", 400),
    INVALID_PASSWORD(1107, "Invalid password", 400),
    EMAIL_NOT_FOUND(1108, "Email not found", 404),


    // Validation Errors (1400-1499)
    INVALID_ROLE_ID(1400, "Invalid roleId", 400),

    // Password Reset Errors (1200-1299)
    PASSWORD_RESET_FAILED(1200, "Password reset failed", 400),
    PASSWORD_RESET_TOKEN_EXPIRED(1201, "Password reset token has expired", 400),
    PASSWORD_RESET_TOKEN_INVALID(1202, "Invalid password reset token", 400),

    // OAuth Errors (1300-1399)
    OAUTH_ERROR(1300, "OAuth authentication error", 401),
    OAUTH_PROVIDER_NOT_SUPPORTED(1301, "OAuth provider not supported", 400),
    OAUTH_EMAIL_NOT_VERIFIED(1302, "Email not verified by OAuth provider", 401),

    // System Errors (5000-5999)
    SYSTEM_ERROR(5000, "System error", 500),
    DATABASE_ERROR(5001, "Database error", 500),
    SECURITY_ERROR(5002, "Security configuration error", 500),
    JWT_CONFIGURATION_ERROR(5003, "JWT configuration error", 500),

    // General Errors (9000-9999)
    UNKNOWN_ERROR(9999, "Unknown error", 500);

    private final int code;
    private final String message;
    private final int httpCode;

    Code(int code, String message, int httpCode) {
        this.code = code;
        this.message = message;
        this.httpCode = httpCode;
    }

    public static Code fromCode(int code) {
        for (Code exitCode : Code.values()) {
            if (exitCode.getCode() == code) {
                return exitCode;
            }
        }
        return UNKNOWN_ERROR;
    }
}
