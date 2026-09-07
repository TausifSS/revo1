package com.reservo.backend.util;

public class HtmlSanitizer {
    /**
     * Strips all HTML tags and scripts from the input string.
     */
    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }
        // Remove HTML/script tags using regular expressions
        return input.replaceAll("<[^>]*>", "").trim();
    }
}
