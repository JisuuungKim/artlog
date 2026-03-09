package com.artlog.domain.folder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class FolderRequest {

    public record CreateFolderRequest(
            @NotBlank(message = "폴더 이름은 필수입니다.")
            @Size(max = 100, message = "폴더 이름은 100자 이하여야 합니다.")
            String name,

            @NotNull(message = "카테고리 ID는 필수입니다.")
            Long categoryId
    ) {}

    public record RenameFolderRequest(
            @NotBlank(message = "폴더 이름은 필수입니다.")
            @Size(max = 100, message = "폴더 이름은 100자 이하여야 합니다.")
            String name
    ) {}
}
