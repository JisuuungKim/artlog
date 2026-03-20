package com.artlog.domain.note.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LessonNoteWorker {

    private final LessonNoteJobQueueService lessonNoteJobQueueService;
    private final LessonNoteProcessingService lessonNoteProcessingService;

    @Value("${app.ai.queue.batch-size:3}")
    private int batchSize;

    @Scheduled(fixedDelayString = "${app.ai.queue.poll-delay-ms:1000}")
    public void processQueuedJobs() {
        for (int i = 0; i < batchSize; i++) {
            java.util.Optional<Long> noteId = lessonNoteJobQueueService.poll();
            if (noteId.isEmpty()) {
                return;
            }

            lessonNoteProcessingService.process(noteId.get());
        }
    }
}
