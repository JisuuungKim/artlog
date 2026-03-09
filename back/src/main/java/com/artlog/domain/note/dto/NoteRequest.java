package com.artlog.domain.note.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public class NoteRequest {

    public record RenameNoteRequest(
            @NotBlank(message = "노트 제목은 필수입니다.")
            @Size(max = 255, message = "노트 제목은 255자 이하여야 합니다.")
            String title
    ) {}

    public record MoveNoteRequest(
            @NotNull(message = "폴더 ID는 필수입니다.")
            Long folderId
    ) {}

    public record BulkMoveRequest(
            @NotEmpty(message = "노트 ID 목록은 비어있을 수 없습니다.")
            List<Long> noteIds,

            @NotNull(message = "폴더 ID는 필수입니다.")
            Long folderId
    ) {}

    public record BulkDeleteRequest(
            @NotEmpty(message = "노트 ID 목록은 비어있을 수 없습니다.")
            List<Long> noteIds
    ) {}
}
