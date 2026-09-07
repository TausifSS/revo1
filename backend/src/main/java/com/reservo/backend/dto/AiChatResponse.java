package com.reservo.backend.dto;

import com.reservo.backend.entity.Resort;

public class AiChatResponse {
    private String messageId;
    private String sender;
    private String text;
    private Resort recommendation;

    public AiChatResponse() {}

    public AiChatResponse(String messageId, String sender, String text, Resort recommendation) {
        this.messageId = messageId;
        this.sender = sender;
        this.text = text;
        this.recommendation = recommendation;
    }

    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public Resort getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(Resort recommendation) {
        this.recommendation = recommendation;
    }
}
