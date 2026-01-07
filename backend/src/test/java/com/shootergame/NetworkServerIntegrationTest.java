package com.shootergame;

import static org.junit.jupiter.api.Assertions.*;

import java.net.InetSocketAddress;
import java.net.URI;
import java.time.Duration;

import org.jspace.ActualField;
import org.jspace.FormalField;
import org.jspace.SequentialSpace;
import org.jspace.Space;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.google.gson.Gson;

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
        WebSocketClient client = new WebSocketClient(new URI("ws://localhost:" + port)) {
            @Override
            public void onOpen(ServerHandshake handshakedata) {}
            @Override
            public void onMessage(String message) {}
            @Override
            public void onClose(int code, String reason, boolean remote) {}
            @Override
            public void onError(Exception ex) { ex.printStackTrace(); }
        };

        client.connectBlocking();
        client.send(gson.toJson(java.util.Map.of("type", "register", "playerId", 42)));

        // wait up to 1s for tuple to appear
        Object[] tuple = null;
        long deadline = System.currentTimeMillis() + 1000;
        while (System.currentTimeMillis() < deadline) {
            tuple = space.getp(new ActualField("player"), new FormalField(Integer.class));
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
        WebSocketClient client = new WebSocketClient(new URI("ws://localhost:" + port)) {
            @Override
            public void onOpen(ServerHandshake handshakedata) {}
            @Override
            public void onMessage(String message) {}
            @Override
            public void onClose(int code, String reason, boolean remote) {}
            @Override
            public void onError(Exception ex) { ex.printStackTrace(); }
        };

        client.connectBlocking();
        client.send(gson.toJson(java.util.Map.of("type", "input", "playerId", 7, "action", "UP")));

        // wait up to 1s for event tuple
        Object[] ev = null;
        long deadline = System.currentTimeMillis() + 1000;
        while (System.currentTimeMillis() < deadline) {
            ev = space.getp(new ActualField("event"), new FormalField(Integer.class), new FormalField(String.class), new FormalField(Long.class));
            if (ev != null) break;
            Thread.sleep(20);
        }

        assertNotNull(ev, "event tuple must appear");
        assertEquals(7, ev[1]);
        assertEquals("UP", ev[2]);

        client.close();
    }

}
