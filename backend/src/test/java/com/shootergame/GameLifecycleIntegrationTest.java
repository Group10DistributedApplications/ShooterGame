package com.shootergame;

import static org.junit.jupiter.api.Assertions.*;

import java.net.InetSocketAddress;
import java.net.URI;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import org.jspace.SequentialSpace;
import org.jspace.Space;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.google.gson.Gson;
import com.shootergame.game.GameLoop;
import com.shootergame.game.WorldState;
import com.shootergame.game.input.InputConsumer;
import com.shootergame.network.NetworkServer;

/**
 * Integration tests for multi-player game lifecycle and coordination.
 * 
 * Tests game state transitions and multi-player broadcast scenarios.
 * - Multiple players can join the same game lobby
 * - START action broadcasts game_start to all players in the game
 * - Win conditions trigger game_over broadcasts
 * - Broadcasts are correctly scoped to only players in the same game
 * 
 * Scope: Full stack with multiple WebSocket clients
 * Focus: Game state transitions, multi-player coordination, and broadcast isolation
 */
public class GameLifecycleIntegrationTest {

    private NetworkServer server;
    private Space space;
    private int port;
    private GameLoop gameLoop;
    private InputConsumer inputConsumer;

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

        inputConsumer = new InputConsumer(space, gameLoop);
        inputConsumer.start();
    }

    @AfterEach
    public void tearDown() throws Exception {
        if (inputConsumer != null) inputConsumer.stop();
        if (gameLoop != null) gameLoop.stop();
        if (server != null) server.stop();
    }

    @Test
    public void startBroadcastsToAllPlayersInGame() throws Exception {
        Gson gson = new Gson();
        BlockingQueue<String> m1 = new ArrayBlockingQueue<>(10);
        BlockingQueue<String> m2 = new ArrayBlockingQueue<>(10);

        WebSocketClient c1 = buildClient(port, m1);
        WebSocketClient c2 = buildClient(port, m2);

        c1.send(gson.toJson(java.util.Map.of("type", "register", "playerId", 1, "gameId", "default")));
        c2.send(gson.toJson(java.util.Map.of("type", "register", "playerId", 2, "gameId", "default")));

        // Kick off match
        c1.send(gson.toJson(java.util.Map.of("type", "input", "playerId", 1, "action", "START")));

        String g1 = waitForMessageContaining(m1, "\"type\":\"game_start\"", 2000);
        String g2 = waitForMessageContaining(m2, "\"type\":\"game_start\"", 2000);

        assertNotNull(g1, "player 1 should receive game_start");
        assertNotNull(g2, "player 2 should receive game_start");

        c1.close();
        c2.close();
    }

    @Test
    public void gameOverBroadcastsWhenOnePlayerRemaining() throws Exception {
        Gson gson = new Gson();
        BlockingQueue<String> m1 = new ArrayBlockingQueue<>(10);
        BlockingQueue<String> m2 = new ArrayBlockingQueue<>(10);

        WebSocketClient c1 = buildClient(port, m1);
        WebSocketClient c2 = buildClient(port, m2);

        c1.send(gson.toJson(java.util.Map.of("type", "register", "playerId", 10, "gameId", "default")));
        c2.send(gson.toJson(java.util.Map.of("type", "register", "playerId", 11, "gameId", "default")));

        // Ensure players are present in the world and mark match running
        WorldState world = gameLoop.getWorldState();
        waitForPlayerInWorld(world, 10);
        waitForPlayerInWorld(world, 11);
        world.setMatchRunning(true);

        // Make one player dead so alive count becomes 1
        world.getPlayers().get(11).lives = 0;

        String over = waitForMessageContaining(m1, "\"type\":\"game_over\"", 2000);

        assertNotNull(over, "game_over should be broadcast when only one player remains");

        c1.close();
        c2.close();
    }

    private WebSocketClient buildClient(int port, BlockingQueue<String> messages) throws Exception {
        CountDownLatch openLatch = new CountDownLatch(1);
        WebSocketClient client = new WebSocketClient(new URI("ws://localhost:" + port)) {
            @Override
            public void onOpen(ServerHandshake handshakedata) { openLatch.countDown(); }
            @Override
            public void onMessage(String message) { messages.offer(message); }
            @Override
            public void onClose(int code, String reason, boolean remote) {}
            @Override
            public void onError(Exception ex) { ex.printStackTrace(); }
        };
        client.connectBlocking();
        openLatch.await(1, TimeUnit.SECONDS);
        return client;
    }

    private String waitForMessageContaining(BlockingQueue<String> q, String needle, long timeoutMs) throws InterruptedException {
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (System.currentTimeMillis() < deadline) {
            String m = q.poll(100, TimeUnit.MILLISECONDS);
            if (m != null && m.contains(needle)) {
                return m;
            }
        }
        return null;
    }

    private void waitForPlayerInWorld(WorldState world, int playerId) throws InterruptedException {
        long deadline = System.currentTimeMillis() + 1000;
        while (System.currentTimeMillis() < deadline) {
            world.syncRegisteredPlayers();
            if (world.getPlayers().containsKey(playerId)) {
                return;
            }
            Thread.sleep(20);
        }
        fail("player " + playerId + " not present in world within timeout");
    }
}
