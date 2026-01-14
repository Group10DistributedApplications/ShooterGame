package com.shootergame;

import static org.junit.jupiter.api.Assertions.*;

import java.net.InetSocketAddress;
import java.net.URI;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import org.jspace.ActualField;
import org.jspace.FormalField;
import org.jspace.SequentialSpace;
import org.jspace.Space;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.shootergame.network.NetworkServer;
import com.shootergame.util.TupleSpaces;

import com.google.gson.Gson;

/**
 * Integration tests for the network layer and tuple space.
 * 
 * Tests low-level WebSocket message handling and tuple space operations.
 * - Player registration creates tuples in the game-scoped tuple space
 * - Input messages are correctly converted to tuple space entries
 * - The tuple space APIs work correctly for per-game isolation
 * 
 * Scope: NetworkServer + TupleSpaces (no GameLoop or InputConsumer)
 * Focus: Message parsing, tuple creation, and data persistence
 */
public class NetworkServerIntegrationTest {

    private NetworkServer server;
    private Space space;
    private int port;

    @BeforeEach
    public void setup() throws Exception {
        space = new SequentialSpace();
        // allocate an ephemeral free port reliably
        try (java.net.ServerSocket ss = new java.net.ServerSocket(0)) {
            port = ss.getLocalPort();
        }
        server = new NetworkServer(new InetSocketAddress("localhost", port), space);
        server.start();
        // wait briefly for server to bind
        Thread.sleep(200);
        assertTrue(port > 0, "server bound to a port");
    }

    @AfterEach
    public void tearDown() throws Exception {
        if (server != null) server.stop();
    }

    @Test
    public void registerCreatesPlayerTuple() throws Exception {
        Gson gson = new Gson();
        CountDownLatch open = new CountDownLatch(1);

        WebSocketClient client = new WebSocketClient(new URI("ws://localhost:" + port)) {
            @Override
            public void onOpen(ServerHandshake handshakedata) { open.countDown(); }
            @Override
            public void onMessage(String message) {}
            @Override
            public void onClose(int code, String reason, boolean remote) {}
            @Override
            public void onError(Exception ex) { ex.printStackTrace(); }
        };

        client.connectBlocking();
        open.await(1, TimeUnit.SECONDS);
        client.send(gson.toJson(java.util.Map.of("type", "register", "playerId", 42, "gameId", "default")));

        // wait up to 1s for player tuple in game-scoped space
        Object[] tuple = null;
        long deadline = System.currentTimeMillis() + 1000;
        while (System.currentTimeMillis() < deadline) {
            List<Object[]> regs = TupleSpaces.queryAllPlayers(space, "default");
            if (regs != null) {
                for (Object[] r : regs) {
                    if (r.length >= 2 && r[1] instanceof Number && ((Number) r[1]).intValue() == 42) {
                        tuple = r;
                        break;
                    }
                }
            }
            if (tuple != null) break;
            Thread.sleep(20);
        }

        assertNotNull(tuple, "player tuple must be present");
        assertEquals(42, tuple[1]);

        client.close();
    }

    @Test
    public void inputProducesEventTuple() throws Exception {
        Gson gson = new Gson();
        CountDownLatch open = new CountDownLatch(1);

        WebSocketClient client = new WebSocketClient(new URI("ws://localhost:" + port)) {
            @Override
            public void onOpen(ServerHandshake handshakedata) { open.countDown(); }
            @Override
            public void onMessage(String message) {}
            @Override
            public void onClose(int code, String reason, boolean remote) {}
            @Override
            public void onError(Exception ex) { ex.printStackTrace(); }
        };

        client.connectBlocking();
        open.await(1, TimeUnit.SECONDS);
        client.send(gson.toJson(java.util.Map.of("type", "register", "playerId", 7, "gameId", "default")));
        // brief pause to ensure registration is processed before sending input
        Thread.sleep(50);

        client.send(gson.toJson(java.util.Map.of("type", "input", "playerId", 7, "action", "UP")));

        // wait up to 1s for input tuple from the game-scoped space
        CompletableFuture<Object[]> fut = CompletableFuture.supplyAsync(() -> {
            try {
                return TupleSpaces.getInputBlocking(space);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return null;
            }
        });

        Object[] ev = fut.get(2, TimeUnit.SECONDS);

        assertNotNull(ev, "input tuple must appear");
        assertEquals(7, ((Number) ev[1]).intValue());
        assertEquals("UP", ev[2]);

        client.close();
    }

}
