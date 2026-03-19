package com.artlog.domain.note.dto;

import com.artlog.domain.note.entity.Note;
import com.artlog.domain.note.entity.NoteStatus;
import com.artlog.domain.note.entity.NoteType;
import com.artlog.domain.note.entity.FeedbackCard;
import com.artlog.domain.note.entity.FeedbackKeyword;
import com.artlog.domain.note.entity.LyricsFeedback;
import com.artlog.global.type.TitleContentItem;

import java.time.OffsetDateTime;
import java.util.List;

public class NoteResponse {

    public record CreatedLessonNote(
            Long id,
            NoteStatus status
    ) {
        public static CreatedLessonNote from(Note note) {
            return new CreatedLessonNote(note.getId(), note.getStatus());
        }
    }

    public record UploadedLessonAudio(
            String uploadedAudioPath
    ) {
    }

    public record NoteSummary(
            Long id,
            String title,
            NoteType noteType,
            NoteStatus status,
            Long folderId,
            OffsetDateTime createdAt
    ) {
        public static NoteSummary from(Note note) {
            return new NoteSummary(
                    note.getId(),
                    note.getTitle(),
                    note.getNoteType(),
                    note.getStatus(),
                    note.getFolder() != null ? note.getFolder().getId() : null,
                    note.getCreatedAt()
            );
        }
    }

    public record NoteDetail(
            Long id,
            String title,
            NoteStatus status,
            String folderName,
            String conditionText,
            String recordingUrl,
            OffsetDateTime createdAt,
            List<String> songTitles,
            List<TitleContentItem> keyFeedback,
            List<TitleContentItem> practiceGuide,
            List<TitleContentItem> nextAssignment,
            List<FeedbackGroup> feedbackGroups,
            List<LyricsFeedbackItem> lyricsFeedbacks
    ) {
        public static NoteDetail from(Note note) {
            return new NoteDetail(
                    note.getId(),
                    note.getTitle(),
                    note.getStatus(),
                    note.getFolder() != null ? note.getFolder().getName() : null,
                    note.getConditionText(),
                    note.getRecordingUrl(),
                    note.getCreatedAt(),
                    note.getNoteSongTags().stream()
                            .map(tag -> tag.getUserSong().getTitle())
                            .toList(),
                    note.getKeyFeedback() != null ? note.getKeyFeedback() : List.of(),
                    note.getPracticeGuide() != null ? note.getPracticeGuide() : List.of(),
                    note.getNextAssignment() != null ? note.getNextAssignment() : List.of(),
                    note.getFeedbackKeywords().stream().map(FeedbackGroup::from).toList(),
                    note.getLyricsFeedbacks().stream().map(LyricsFeedbackItem::from).toList()
            );
        }
    }

    public record FeedbackGroup(
            Long id,
            String keyword,
            List<FeedbackCardItem> cards
    ) {
        public static FeedbackGroup from(FeedbackKeyword keyword) {
            return new FeedbackGroup(
                    keyword.getId(),
                    keyword.getKeyword(),
                    keyword.getFeedbackCards().stream().map(FeedbackCardItem::from).toList()
            );
        }
    }

    public record FeedbackCardItem(
            Long id,
            String title,
            String content
    ) {
        public static FeedbackCardItem from(FeedbackCard card) {
            return new FeedbackCardItem(card.getId(), card.getTitle(), card.getContent());
        }
    }

    public record LyricsFeedbackItem(
            Long id,
            String lineText,
            String feedbackTitle,
            String problemText,
            String solutionText
    ) {
        public static LyricsFeedbackItem from(LyricsFeedback item) {
            return new LyricsFeedbackItem(
                    item.getId(),
                    item.getLineText(),
                    item.getFeedbackTitle(),
                    item.getProblemText(),
                    item.getSolutionText()
            );
        }
    }
}
