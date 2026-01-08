package com.shootergame.network;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.java_websocket.WebSocket;

/**
 * Manages the registry of connected clients.
 * Tracks the mapping between WebSocket connections and player IDs.
 */
public class ClientRegistry {

    private final Map<WebSocket, Integer> clients = new ConcurrentHashMap<>();
    private static final int UNREGISTERED = -1;

    /**
     * Register a client connection with a player ID.
     */
    public void register(WebSocket socket, int playerId) {
        clients.put(socket, playerId);
    }

    /**
     * Register a connection without assigning a player id yet.
     */
    public void registerConnection(WebSocket socket) {
        clients.put(socket, UNREGISTERED);
    }

    /**
     * Unregister a client connection.
     */
    public void unregister(WebSocket socket) {
        clients.remove(socket);
    }

    /**
     * Get player ID for a socket connection.
     */
    public Integer getPlayerId(WebSocket socket) {
        Integer v = clients.get(socket);
        if (v == null || v == UNREGISTERED) return null;
        return v;
    }

    /**
     * Check if a socket is registered.
     */
    public boolean isRegistered(WebSocket socket) {
        Integer v = clients.get(socket);
        return v != null && v != UNREGISTERED;
    }

    /**
     * Get all registered sockets.
     */
    public Iterable<WebSocket> getAllSockets() {
        return clients.keySet();
    }

    /**
     * Get number of connected clients.
     */
    public int getClientCount() {
        return clients.size();
    }
}
