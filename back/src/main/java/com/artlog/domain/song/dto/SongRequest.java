package com.artlog.domain.song.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SongRequest {

    public record RenameSongRequest(
            @NotBlank(message = "곡 제목은 필수입니다.")
            @Size(max = 255, message = "곡 제목은 255자 이하여야 합니다.")
            String title
    ) {}
}
