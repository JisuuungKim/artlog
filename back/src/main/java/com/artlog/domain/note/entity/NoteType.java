package com.artlog.domain.note.entity;

public enum NoteType {
    LESSON("레슨"),
    PRACTICE("연습");

    private final String description;

    NoteType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
