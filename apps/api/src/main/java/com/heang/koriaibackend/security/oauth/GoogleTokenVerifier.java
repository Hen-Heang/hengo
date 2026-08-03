package com.heang.koriaibackend.security.oauth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.heang.koriaibackend.common.api.Code;
import com.heang.koriaibackend.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.List;

/**
 * Verifies Google ID tokens (signature, issuer, expiry, and audience) using Google's
 * published public keys, which the underlying verifier fetches and caches automatically.
 *
 * <p>The accepted audiences come from the {@code google.client-ids} property. If no client
 * IDs are configured, the verifier fails to closed (every token is rejected).
 */
@Component
public class GoogleTokenVerifier {

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifier(@Value("${google.client-ids:}") String clientIdsRaw) {
        List<String> audiences = Arrays.stream(clientIdsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(audiences)
                .build();
    }

    /**
     * @return the verified token payload (email, name, etc.)
     * @throws BusinessException with {@link Code#OAUTH_ERROR} if the token is missing, expired,
     *                           tampered with, or its audience is not accepted.
     */
    public GoogleIdToken.Payload verify(String idTokenString) {
        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new BusinessException(Code.OAUTH_ERROR);
            }
            return idToken.getPayload();
        } catch (GeneralSecurityException | IOException e) {
            throw new BusinessException(Code.OAUTH_ERROR);
        }
    }
}
