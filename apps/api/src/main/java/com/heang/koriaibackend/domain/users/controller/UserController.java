package com.heang.koriaibackend.domain.users.controller;

import com.heang.koriaibackend.common.api.ApiResponse;
import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.domain.users.dto.CreateUserRequest;
import com.heang.koriaibackend.domain.users.dto.UpdatePreferredModelRequest;
import com.heang.koriaibackend.domain.users.dto.UpdateStudyRemindersRequest;
import com.heang.koriaibackend.domain.users.dto.UpdateUserProfileRequest;
import com.heang.koriaibackend.domain.users.dto.UserResponse;
import com.heang.koriaibackend.domain.users.service.UserService;
import com.heang.koriaibackend.security.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Validated
public class UserController {

    private final UserService userService;

    @PostMapping
    public ApiResponse<?> create(@Valid @RequestBody CreateUserRequest req) {
        return ApiResponse.success(UserResponse.from(userService.create(req)));
    }

    @GetMapping("/search")
    public ApiResponse<List<UserResponse>> search(@RequestParam("q") String q,
                                                  @RequestParam(name = "limit", defaultValue = "10") int limit) {
        List<UserResponse> results = userService.search(q, SecurityUtils.currentUserId(), limit)
                .stream().map(UserResponse::from).toList();
        return ApiResponse.success(results);
    }

    @GetMapping("/{id}")
    public ApiResponse<?> findById(@PathVariable Long id) {
        return userService.findById(id)
                .<ApiResponse<?>>map(user -> ApiResponse.success(UserResponse.from(user)))
                .orElseGet(() -> ApiResponse.error(Code.NOT_FOUND, Map.of("message", "User not found")));
    }

    @PutMapping("/{id}/profile")
    public ApiResponse<?> updateProfile(@PathVariable Long id, @Valid @RequestBody UpdateUserProfileRequest req) {
        return userService.updateProfile(id, req)
                .<ApiResponse<?>>map(user -> ApiResponse.success(UserResponse.from(user)))
                .orElseGet(() -> ApiResponse.error(Code.NOT_FOUND, Map.of("message", "User not found")));
    }

    @PutMapping("/{id}/preferred-model")
    public ApiResponse<?> updatePreferredModel(@PathVariable Long id, @Valid @RequestBody UpdatePreferredModelRequest req) {
        return userService.updatePreferredModel(id, req)
                .<ApiResponse<?>>map(user -> ApiResponse.success(UserResponse.from(user)))
                .orElseGet(() -> ApiResponse.error(Code.NOT_FOUND, Map.of("message", "User not found")));
    }

    @PutMapping("/{id}/study-reminders")
    public ApiResponse<?> updateStudyReminders(@PathVariable Long id, @Valid @RequestBody UpdateStudyRemindersRequest req) {
        if (!id.equals(SecurityUtils.currentUserId())) {
            return ApiResponse.error(Code.INSUFFICIENT_PERMISSIONS, Map.of("message", "You can only update your own settings"));
        }
        return userService.updateStudyReminders(id, req)
                .<ApiResponse<?>>map(user -> ApiResponse.success(UserResponse.from(user)))
                .orElseGet(() -> ApiResponse.error(Code.NOT_FOUND, Map.of("message", "User not found")));
    }

    private static final long MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp");

    @PostMapping(value = "/{id}/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<?> uploadProfileImage(@PathVariable Long id,
                                             @RequestPart("file") MultipartFile file) {
        if (!id.equals(SecurityUtils.currentUserId())) {
            return ApiResponse.error(Code.INSUFFICIENT_PERMISSIONS, Map.of("message", "You can only update your own image"));
        }
        if (file == null || file.isEmpty()) {
            return ApiResponse.error(Code.BAD_REQUEST, Map.of("message", "No file provided"));
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            return ApiResponse.error(Code.BAD_REQUEST, Map.of("message", "Image must be 2 MB or smaller"));
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            return ApiResponse.error(Code.BAD_REQUEST, Map.of("message", "Only JPEG, PNG, or WebP images are allowed"));
        }
        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            return ApiResponse.error(Code.SYSTEM_ERROR, Map.of("message", "Could not read uploaded file"));
        }
        return userService.updateProfileImage(id, contentType.toLowerCase(), data)
                .<ApiResponse<?>>map(user -> ApiResponse.success(UserResponse.from(user)))
                .orElseGet(() -> ApiResponse.error(Code.NOT_FOUND, Map.of("message", "User not found")));
    }

    @GetMapping("/{id}/profile-image")
    public ResponseEntity<byte[]> getProfileImage(@PathVariable Long id) {
        return userService.getProfileImage(id)
                .map(user -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(user.getProfileImageContentType()))
                        .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePrivate())
                        .body(user.getProfileImageData()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Map<String, Boolean>> delete(@PathVariable Long id) {
        boolean deleted = userService.deleteById(id);
        if (!deleted) {
            return ApiResponse.error(Code.NOT_FOUND, Map.of("deleted", false));
        }
        return ApiResponse.success(Map.of("deleted", true));
    }
}
