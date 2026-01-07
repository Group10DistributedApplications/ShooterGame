package com.shootergame;

import org.jspace.*;

public class Main {

    public static void main(String[] args) throws InterruptedException {
        Space space = new SequentialSpace();

        // Simulate player input
        space.put("input", 1, "UP");

        // Server side: read input
        Object[] input = space.get(
            new ActualField("input"),
            new FormalField(Integer.class),
            new FormalField(String.class)
        );

        int playerId = (int) input[1];
        String action = (String) input[2];

        System.out.println("Player " + playerId + " pressed " + action);
    }

}
