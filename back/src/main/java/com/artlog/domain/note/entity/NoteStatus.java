package com.artlog.domain.note.entity;

public enum NoteStatus {
    PROCESSING("처리중"),
    DRAFT("임시저장"),
    COMPLETED("완료"),
    FAILED("실패"),
    ARCHIVED("보관");

    private final String description;

    NoteStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
