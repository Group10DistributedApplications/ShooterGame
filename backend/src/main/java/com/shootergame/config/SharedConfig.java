package com.shootergame.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Loads shared JSON config placed at project root `shared/config.json`.
 * Searches parent directories so it works whether the backend starts from the module or project root.
 */
public final class SharedConfig {
    private static final Logger logger = LoggerFactory.getLogger(SharedConfig.class);
    private static final String REL_PATH = "shared/config.json";
    private static final Gson gson = new Gson();
    private static JsonObject json = new JsonObject();

    static {
        try {
            Optional<Path> p = findSharedConfig();
            if (p.isPresent()) {
                String s = Files.readString(p.get());
                json = gson.fromJson(s, JsonObject.class);
                logger.info("Loaded shared config from {}", p.get().toAbsolutePath());
            } else {
                logger.info("No shared/config.json found; using defaults");
            }
        } catch (IOException e) {
            logger.warn("Failed to load shared config; using defaults", e);
        }
    }

    private SharedConfig() {}

    private static Optional<Path> findSharedConfig() {
        Path cwd = Path.of("").toAbsolutePath();
        for (int i = 0; i < 5; i++) {
            Path candidate = cwd.resolve(REL_PATH);
            if (Files.exists(candidate)) return Optional.of(candidate);
            cwd = cwd.getParent();
            if (cwd == null) break;
        }
        return Optional.empty();
    }

    public static int getInt(String key, int defaultValue) {
        try {
            if (json != null && json.has(key)) return json.get(key).getAsInt();
        } catch (Exception e) {
            logger.warn("Invalid int for key {}", key, e);
        }
        return defaultValue;
    }

    public static long getLong(String key, long defaultValue) {
        try {
            if (json != null && json.has(key)) return json.get(key).getAsLong();
        } catch (Exception e) {
            logger.warn("Invalid long for key {}", key, e);
        }
        return defaultValue;
    }

    public static String getString(String key, String defaultValue) {
        try {
            if (json != null && json.has(key)) return json.get(key).getAsString();
        } catch (Exception e) {
            logger.warn("Invalid string for key {}", key, e);
        }
        return defaultValue;
    }
}
