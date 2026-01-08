package com.shootergame.network;

import org.java_websocket.WebSocket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gson.JsonObject;
import com.shootergame.util.JsonSerializer;
import com.shootergame.util.TupleSpaces;

import org.jspace.Space;

/**
 * Interprets incoming messages and delegates to appropriate handlers.
 * Validates message shape and routes to game systems.
 */
public class MessageHandler {

    private static final Logger logger = LoggerFactory.getLogger(MessageHandler.class);

    private final Space space;
    private final ClientRegistry clientRegistry;
    private final JsonSerializer serializer;

    public MessageHandler(Space space, ClientRegistry clientRegistry, JsonSerializer serializer) {
        this.space = space;
        this.clientRegistry = clientRegistry;
        this.serializer = serializer;
    }

    /**
     * Handle an incoming message from a client.
     */
    public void handle(WebSocket conn, String message) {
        try {
            JsonObject obj = serializer.fromJson(message, JsonObject.class);
            String type = obj.has("type") ? obj.get("type").getAsString() : "";

            logger.debug("Received message from {} type={}", conn.getRemoteSocketAddress(), type);

            switch (type) {
                case "register":
                    handleRegister(conn, obj);
                    break;
                case "input":
                    handleInput(conn, obj);
                    break;
                case "ping":
                    handlePing(conn);
                    break;
                default:
                    sendError(conn, "unknown message type");
            }

        } catch (Exception e) {
            logger.error("Error processing message", e);
            sendError(conn, e.getMessage());
        }
    }

    private void handleRegister(WebSocket conn, JsonObject obj) {
        if (!obj.has("playerId")) {
            sendError(conn, "playerId required for register");
            return;
        }

        int playerId = obj.get("playerId").getAsInt();

        try {
            clientRegistry.register(conn, playerId);
            space.put(TupleSpaces.PLAYER, playerId);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            sendError(conn, "Operation interrupted");
            return;
        }

        conn.send(serializer.toJson(new java.util.HashMap<>(
            java.util.Map.of("type", "registered", "playerId", playerId))));

        logger.info("Registered player {} (connected={})", playerId, clientRegistry.getClientCount());
    }

    private void handleInput(WebSocket conn, JsonObject obj) {
        if (!obj.has("playerId") || !obj.has("action")) {
            sendError(conn, "playerId and action required for input");
            return;
        }

        int playerId = obj.get("playerId").getAsInt();
        String action = obj.get("action").getAsString();
        String payload = obj.has("payload") ? obj.get("payload").getAsString() : "";

        try {
            // Write to tuple space
            space.put(TupleSpaces.INPUT, playerId, action, payload);
            logger.debug("Stored input: player={} action={} payload={}", playerId, action, payload);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            sendError(conn, "Operation interrupted");
        }
    }

    private void handlePing(WebSocket conn) {
        conn.send(serializer.toJson(new java.util.HashMap<>(
            java.util.Map.of("type", "pong", "ts", System.currentTimeMillis()))));
    }

    private void sendError(WebSocket conn, String message) {
        try {
            conn.send(serializer.toJson(new java.util.HashMap<>(
                java.util.Map.of("type", "error", "message", message))));
        } catch (Exception e) {
            logger.error("Failed to send error to client", e);
        }
    }
}
