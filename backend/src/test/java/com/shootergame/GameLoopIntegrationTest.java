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

import com.shootergame.game.GameLoop;
import com.shootergame.game.input.InputConsumer;
import com.shootergame.network.NetworkServer;
import com.google.gson.Gson;

/**
 * End-to-end integration tests for the complete game processing pipeline.
 * 
 * Tests the full stack from WebSocket input through to broadcast output.
 * - Player input messages flow through the entire system
 * - InputConsumer processes tuples from the tuple space
 * - GameLoop applies inputs and broadcasts state updates
 * - Clients receive state broadcasts in response to their actions
 * 
 * Scope: NetworkServer + GameLoop + InputConsumer (full stack)
 * Focus: Complete flow: client input → tuple → processing → broadcast
 */
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
        // start input consumer so GameLoop receives inputs
        InputConsumer ic = new InputConsumer(space, gameLoop);
        ic.start();
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

        // Register so the server knows which game this socket belongs to and will broadcast state to it
        client.send(gson.toJson(java.util.Map.of("type", "register", "playerId", 5, "gameId", "default")));
        // Small delay to allow the server to store the registration before inputs arrive
        Thread.sleep(100);

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
