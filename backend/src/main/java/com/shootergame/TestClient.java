package com.shootergame;

import java.net.URI;
import java.util.Map;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gson.Gson;

public class TestClient {

    private static final Logger logger = LoggerFactory.getLogger(TestClient.class);

    public static void main(String[] args) throws Exception {
        int playerId = args.length > 0 ? Integer.parseInt(args[0]) : 1;
        URI uri = new URI("ws://localhost:3000");

        Gson gson = new Gson();

        WebSocketClient client = new WebSocketClient(uri) {
            @Override
            public void onOpen(ServerHandshake handshakedata) {
                logger.info("TestClient connected");
            }

            @Override
            public void onMessage(String message) {
                logger.info("TestClient recv: {}", message);
            }

            @Override
            public void onClose(int code, String reason, boolean remote) {
                logger.info("TestClient closed: {}", reason);
            }

            @Override
            public void onError(Exception ex) {
                logger.error("TestClient error", ex);
            }
        };

        client.connectBlocking();

        client.send(gson.toJson(Map.of("type", "register", "playerId", playerId)));

        String[] actions = {"UP", "RIGHT", "DOWN", "LEFT", "FIRE"};

        for (int i = 0; i < 200; i++) {
            String action = actions[i % actions.length];
            client.send(gson.toJson(Map.of("type", "input", "playerId", playerId, "action", action)));
            Thread.sleep(100);
        }

        client.close();
    }

}
