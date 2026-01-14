package com.shootergame.game.map;

import java.io.FileReader;
import java.io.Reader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.google.gson.Gson;
import com.google.gson.annotations.SerializedName;

/**
 * Lightweight collision grid built from a Tiled JSON map. Marks tiles as blocked
 * for specified layers (e.g., Walls, Objects). Assumes orthogonal tile map.
 */
public class CollisionMap {
    private final int width;        // tiles
    private final int height;       // tiles
    private final int tileWidth;    // pixels
    private final int tileHeight;   // pixels
    private final boolean[][] blocked; // [y][x]

    public CollisionMap(int width, int height, int tileWidth, int tileHeight, boolean[][] blocked) {
        this.width = width;
        this.height = height;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.blocked = blocked;
    }

    public int getPixelWidth() { return width * tileWidth; }
    public int getPixelHeight() { return height * tileHeight; }

    /** Returns true if a world pixel coordinate lies inside a blocked tile. */
    public boolean isBlocked(double x, double y) {
        int tx = (int)Math.floor(x / tileWidth);
        int ty = (int)Math.floor(y / tileHeight);
        if (tx < 0 || ty < 0 || tx >= width || ty >= height) {
            return true; // outside map treated as blocked
        }
        return blocked[ty][tx];
    }

    /** Load a collision map from a Tiled JSON (.tmj) file for the given layer names. */
    public static CollisionMap fromTiled(Path path, List<String> collidableLayerNames) throws Exception {
        if (!Files.exists(path)) {
            throw new IllegalArgumentException("Map file not found: " + path);
        }
        try (Reader r = new FileReader(path.toFile())) {
            Gson gson = new Gson();
            TiledMap map = gson.fromJson(r, TiledMap.class);
            Set<String> wanted = new HashSet<>(collidableLayerNames);
            boolean[][] blocked = new boolean[map.height][map.width];
            for (Layer layer : map.layers) {
                if (!wanted.contains(layer.name)) continue;
                if (layer.data == null) continue;
                for (int idx = 0; idx < layer.data.length; idx++) {
                    int gid = layer.data[idx];
                    if (gid <= 0) continue; // empty tile
                    int x = idx % layer.width;
                    int y = idx / layer.width;
                    if (y >= 0 && y < map.height && x >= 0 && x < map.width) {
                        blocked[y][x] = true;
                    }
                }
            }
            return new CollisionMap(map.width, map.height, map.tilewidth, map.tileheight, blocked);
        }
    }

    // Minimal structs for Gson
    private static class TiledMap {
        int width;
        int height;
        int tilewidth;
        int tileheight;
        List<Layer> layers;
    }

    private static class Layer {
        String name;
        int width;
        int height;
        @SerializedName("data")
        int[] data;
    }
}
