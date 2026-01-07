package com.shootergame;

import org.jspace.*;

public class Main {

    public static void main(String[] args) throws InterruptedException {
        Space space = new SequentialSpace();

        space.put("hello", "jSpace");

        Object[] t = space.get(
            new ActualField("hello"),
            new FormalField(String.class)
        );

        System.out.println("Received tuple: " + t[1]);
    }
}
