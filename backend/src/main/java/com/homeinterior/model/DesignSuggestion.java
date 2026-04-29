package com.homeinterior.model;

import java.util.List;

public class DesignSuggestion {
    private Long roomId;
    private String roomName;
    private String roomType;
    private String style;
    private List<String> items;
    private String note;

    public DesignSuggestion(Long roomId, String roomName, String roomType, String style, List<String> items, String note) {
        this.roomId = roomId;
        this.roomName = roomName;
        this.roomType = roomType;
        this.style = style;
        this.items = items;
        this.note = note;
    }

    public Long getRoomId() { return roomId; }
    public String getRoomName() { return roomName; }
    public String getRoomType() { return roomType; }
    public String getStyle() { return style; }
    public List<String> getItems() { return items; }
    public String getNote() { return note; }
}
