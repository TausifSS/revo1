package com.reservo.backend.dto;

public class AiChatRequest {
    private String sessionId;
    private String message;
    private String selectedMood;

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getSelectedMood() {
        return selectedMood;
    }

    public void setSelectedMood(String selectedMood) {
        this.selectedMood = selectedMood;
    }
}
