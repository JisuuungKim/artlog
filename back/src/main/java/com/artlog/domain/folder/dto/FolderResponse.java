package com.artlog.domain.folder.dto;

import com.artlog.domain.folder.entity.Folder;

public class FolderResponse {

    public record FolderSummary(
            Long id,
            String name,
            Boolean isSystem,
            Long categoryId,
            Integer noteCount
    ) {
        public static FolderSummary from(Folder folder) {
            return new FolderSummary(
                    folder.getId(),
                    folder.getName(),
                    folder.getIsSystem(),
                    folder.getCategory() != null ? folder.getCategory().getId() : null,
                    folder.getNotes().size()
            );
        }
    }
}
