package com.shootergame.util;

import java.util.List;
import org.jspace.ActualField;
import org.jspace.FormalField;
import org.jspace.Space;

/**
 * Central place for tuple space constants and helpers.
 */
public class TupleSpaces {

    /**
     * Player registration tuples.
     * Format: ("player", playerId)
     */
    public static final String PLAYER = "player";

    /**
     * Input event tuples.
     * Format: ("input", playerId, action, payload)
     */
    public static final String INPUT = "input";

    private TupleSpaces() {
        // Utility class
    }

    // Helper APIs
    public static void putPlayer(Space space, int playerId) throws InterruptedException {
        space.put(PLAYER, playerId);
    }

    public static void putInput(Space space, int playerId, String action, String payload) throws InterruptedException {
        space.put(INPUT, playerId, action, payload);
    }

    public static List<Object[]> queryAllPlayers(Space space) throws InterruptedException {
        return space.queryAll(new ActualField(PLAYER), new FormalField(Integer.class));
    }

    public static Object[] getInputBlocking(Space space) throws InterruptedException {
        return space.get(new ActualField(INPUT), new FormalField(Integer.class), new FormalField(String.class), new FormalField(String.class));
    }
}
