package com.shootergame.network;

import java.net.InetSocketAddress;
import java.util.Map;

import org.jspace.Space;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.shootergame.util.JsonSerializer;

/**
 * WebSocket server that manages client connections and lifecycle.
 * Delegates message interpretation to MessageHandler.
 */
public class NetworkServer extends WebSocketServer {

    private static final Logger logger = LoggerFactory.getLogger(NetworkServer.class);

    private final Space space;
    private final ClientRegistry clientRegistry;
    private final MessageHandler messageHandler;
    private final JsonSerializer serializer;

    public NetworkServer(InetSocketAddress address, Space space) {
        super(address);
        this.space = space;
        this.serializer = new JsonSerializer();
        this.clientRegistry = new ClientRegistry();
        this.messageHandler = new MessageHandler(space, clientRegistry, serializer);
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        logger.info("Client connected: {}", conn.getRemoteSocketAddress());
        clientRegistry.registerConnection(conn);
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        logger.info("Client disconnected: {} (code={}, reason={})", 
            conn.getRemoteSocketAddress(), code, reason);
        clientRegistry.unregister(conn);
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        messageHandler.handle(conn, message);
    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        logger.error("WebSocket error ({}): {}", 
            (conn != null ? conn.getRemoteSocketAddress() : "server"), 
            ex.getMessage(), ex);
    }

    @Override
    public void onStart() {
        logger.info("WebSocket server started on {}", getAddress());
    }

    public void broadcast(String message) {
        for (WebSocket socket : clientRegistry.getAllSockets()) {
            try {
                socket.send(message);
            } catch (Exception e) {
                logger.error("Error broadcasting to {}: {}", 
                    socket.getRemoteSocketAddress(), e.getMessage());
            }
        }
    }

    public void broadcastToGame(String gameId, String message) {
        for (WebSocket socket : clientRegistry.getSocketsForGame(gameId)) {
            try {
                socket.send(message);
            } catch (Exception e) {
                logger.error("Error broadcasting to {}: {}", 
                    socket.getRemoteSocketAddress(), e.getMessage());
            }
        }
    }

    public ClientRegistry getClientRegistry() {
        return clientRegistry;
    }
}
