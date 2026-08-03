package com.heang.koriaibackend.config;

import org.jspecify.annotations.NonNull;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Railway (and Heroku-style) Postgres provide DATABASE_URL as
 * postgresql://user:password@host:port/db, which Spring's JDBC datasource
 * cannot consume directly. When such a URL is present, convert it into
 * spring.datasource.* properties before the context starts.
 */
public class RailwayDatabaseUrlPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, @NonNull SpringApplication application) {
        String raw = environment.getProperty("DATABASE_URL");
        if (raw == null || raw.startsWith("jdbc:")) {
            return;
        }
        if (!raw.startsWith("postgres://") && !raw.startsWith("postgresql://")) {
            return;
        }

        URI uri = URI.create(raw);
        String userInfo = uri.getUserInfo();
        if (userInfo == null) {
            return;
        }
        String[] credentials = userInfo.split(":", 2);
        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getPath();

        Map<String, Object> props = new HashMap<>();
        props.put("spring.datasource.url", jdbcUrl);
        props.put("spring.datasource.username", credentials[0]);
        props.put("spring.datasource.password", credentials.length > 1 ? credentials[1] : "");

        environment.getPropertySources()
                .addFirst(new MapPropertySource("railwayDatabaseUrl", props));
    }
}
