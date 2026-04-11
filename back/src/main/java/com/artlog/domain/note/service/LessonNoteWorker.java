package com.artlog.domain.note.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Component
@RequiredArgsConstructor
public class LessonNoteWorker implements SmartLifecycle {

    private final LessonNoteJobQueueService lessonNoteJobQueueService;
    private final LessonNoteProcessingService lessonNoteProcessingService;
    private final ExecutorService executorService = Executors.newSingleThreadExecutor(task -> {
        Thread thread = new Thread(task, "lesson-note-worker");
        thread.setDaemon(true);
        return thread;
    });
    private volatile boolean running = false;

    @Override
    public void start() {
        if (running) {
            return;
        }

        running = true;
        executorService.submit(this::processQueuedJobs);
    }

    @Override
    public void stop() {
        running = false;
        executorService.shutdownNow();
    }

    @Override
    public boolean isRunning() {
        return running;
    }

    private void processQueuedJobs() {
        while (running && !Thread.currentThread().isInterrupted()) {
            try {
                lessonNoteJobQueueService
                        .blockingPoll(Duration.ofSeconds(30))
                        .ifPresent(lessonNoteProcessingService::process);
            } catch (Exception exception) {
                if (running) {
                    log.error("Lesson note worker failed.", exception);
                }
            }
        }
    }
}
