package com.shootergame;

import java.net.InetSocketAddress;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.jspace.ActualField;
import org.jspace.FormalField;
import org.jspace.SequentialSpace;
import org.jspace.Space;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

public class NetworkServer extends WebSocketServer {

    private static final Logger logger = LoggerFactory.getLogger(NetworkServer.class);

    private final Space space;
    private final Gson gson = new Gson();
    private final Map<WebSocket, Integer> clients = new ConcurrentHashMap<>();

    public NetworkServer(InetSocketAddress address, Space space) {
        super(address);
        this.space = space;
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        logger.debug("Connection opened: {}", conn.getRemoteSocketAddress());
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        logger.debug("Connection closed: {} (code={}, reason={})", conn.getRemoteSocketAddress(), code, reason);
        clients.remove(conn);
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        try {
            JsonObject obj = gson.fromJson(message, JsonObject.class);
            String type = obj.has("type") ? obj.get("type").getAsString() : "";

            logger.debug("Received message from {}", conn.getRemoteSocketAddress());

            if ("register".equals(type) && obj.has("playerId")) {
                int pid = obj.get("playerId").getAsInt();
                clients.put(conn, pid);
                space.put("player", pid);
                conn.send(gson.toJson(Map.of("type", "registered", "playerId", pid)));
                logger.info("Registered player {}", pid);
                return;
            }

            if ("input".equals(type) && obj.has("playerId") && obj.has("action")) {
                int pid = obj.get("playerId").getAsInt();
                String action = obj.get("action").getAsString();
                space.put("input", pid, action);
                long ts = System.currentTimeMillis();
                space.put("event", pid, action, ts);
                String out = gson.toJson(Map.of("type", "event", "playerId", pid, "action", action, "ts", ts));
                broadcast(out);
                logger.debug("Stored input: player={} action={}", pid, action);
                return;
            }

            if ("ping".equals(type)) {
                conn.send(gson.toJson(Map.of("type", "pong", "ts", System.currentTimeMillis())));
                return;
            }

            conn.send(gson.toJson(Map.of("type", "error", "message", "unknown message type")));

        } catch (Exception e) {
            logger.error("Error processing message", e);
            try {
                conn.send(gson.toJson(Map.of("type", "error", "message", e.getMessage())));
            } catch (Exception ex) {
                logger.error("Failed to send error to client", ex);
            }
        }
    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        logger.error("WebSocket error ({}): {}", (conn != null ? conn.getRemoteSocketAddress() : "server"), ex.getMessage(), ex);
    }

    @Override
    public void onStart() {
        logger.info("WebSocket server started on {}", getAddress());
    }

}
