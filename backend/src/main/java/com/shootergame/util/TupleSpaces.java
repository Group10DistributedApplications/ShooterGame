package com.shootergame.util;

/**
 * Central place for tuple space constants and helpers.
 * Avoids magic strings throughout the codebase.
 */
public class TupleSpaces {

    /**
     * Tuple identifier for player registration tuples.
     * Format: ("player", playerId)
     */
    public static final String PLAYER = "player";

    /**
     * Tuple identifier for input event tuples.
     * Format: ("input", playerId, action, payload)
     */
    public static final String INPUT = "input";

    private TupleSpaces() {
        // Utility class
    }
}
