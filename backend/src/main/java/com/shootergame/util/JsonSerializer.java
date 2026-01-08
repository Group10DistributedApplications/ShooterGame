package com.shootergame.util;

import com.google.gson.Gson;
import com.google.gson.JsonElement;

/**
 * Central place for all JSON serialization/deserialization.
 * Wraps Gson and avoids creating instances throughout the codebase.
 */
public class JsonSerializer {

    private final Gson gson = new Gson();

    /**
     * Serialize an object to JSON string.
     */
    public String toJson(Object obj) {
        return gson.toJson(obj);
    }

    /**
     * Deserialize a JSON string to an object of the specified type.
     */
    public <T> T fromJson(String json, Class<T> classOfT) {
        return gson.fromJson(json, classOfT);
    }

    /**
     * Deserialize a JSON element to an object of the specified type.
     */
    public <T> T fromJson(JsonElement json, Class<T> classOfT) {
        return gson.fromJson(json, classOfT);
    }
}
