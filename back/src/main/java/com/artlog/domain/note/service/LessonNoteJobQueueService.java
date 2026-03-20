package com.artlog.domain.note.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class LessonNoteJobQueueService {

    private static final String QUEUE_KEY = "queue:lesson-note:pending";

    private final StringRedisTemplate stringRedisTemplate;

    public void enqueue(Long noteId) {
        stringRedisTemplate.opsForList().leftPush(QUEUE_KEY, String.valueOf(noteId));
    }

    public Optional<Long> poll() {
        String value = stringRedisTemplate.opsForList().rightPop(QUEUE_KEY);
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }

        try {
            return Optional.of(Long.parseLong(value));
        } catch (NumberFormatException exception) {
            log.warn("Skipping invalid lesson note job payload. value={}", value);
            return Optional.empty();
        }
    }
}
