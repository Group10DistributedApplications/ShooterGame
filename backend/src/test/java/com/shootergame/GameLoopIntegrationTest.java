package com.shootergame;

import static org.junit.jupiter.api.Assertions.*;

import java.net.InetSocketAddress;
import java.net.URI;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

import org.jspace.SequentialSpace;
import org.jspace.Space;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.google.gson.Gson;

public class GameLoopIntegrationTest {

    private NetworkServer server;
    private Space space;
    private int port;
    private GameLoop gameLoop;

    @BeforeEach
    public void setup() throws Exception {
        space = new SequentialSpace();
        try (java.net.ServerSocket ss = new java.net.ServerSocket(0)) {
            port = ss.getLocalPort();
        }
        server = new NetworkServer(new InetSocketAddress("localhost", port), space);
        server.start();
        Thread.sleep(200);
        gameLoop = new GameLoop(space, server);
        gameLoop.start();
    }

    @AfterEach
    public void tearDown() throws Exception {
        if (gameLoop != null) gameLoop.stop();
        if (server != null) server.stop();
    }

    @Test
    public void broadcastsStateAfterInput() throws Exception {
        BlockingQueue<String> messages = new ArrayBlockingQueue<>(10);
        Gson gson = new Gson();

        WebSocketClient client = new WebSocketClient(new URI("ws://localhost:" + port)) {
            @Override
            public void onOpen(ServerHandshake handshakedata) {}
            @Override
            public void onMessage(String message) { messages.offer(message); }
            @Override
            public void onClose(int code, String reason, boolean remote) {}
            @Override
            public void onError(Exception ex) { ex.printStackTrace(); }
        };

        client.connectBlocking();

        // send input; GameLoop should consume eventual 'event' and then broadcast 'state'
        client.send(gson.toJson(java.util.Map.of("type", "input", "playerId", 5, "action", "RIGHT")));

        // wait up to 2s for a state message (there may be earlier 'event' messages)
        String stateMsg = null;
        long deadline = System.currentTimeMillis() + 2000;
        while (System.currentTimeMillis() < deadline) {
            String m = messages.poll(200, java.util.concurrent.TimeUnit.MILLISECONDS);
            if (m == null) continue;
            if (m.contains("\"type\":\"state\"")) {
                stateMsg = m;
                break;
            }
        }
        assertNotNull(stateMsg, "expected a state broadcast within timeout");
        assertTrue(stateMsg.contains("5"), "state JSON should include player id 5");

        client.close();
    }

}
