package com.artlog.global.config;

import com.artlog.domain.note.entity.NoteStatus;
import com.artlog.domain.note.entity.NoteType;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DatabaseSchemaSyncConfig {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void syncNoteConstraints() {
        syncEnumCheckConstraint(
                "public.note",
                "note_status_check",
                "status",
                true,
                Arrays.stream(NoteStatus.values()).map(Enum::name).toList()
        );

        syncEnumCheckConstraint(
                "public.note",
                "note_note_type_check",
                "note_type",
                false,
                Arrays.stream(NoteType.values()).map(Enum::name).toList()
        );
    }

    private void syncEnumCheckConstraint(
            String tableName,
            String constraintName,
            String columnName,
            boolean nullable,
            java.util.List<String> enumValues
    ) {
        String allowedValues = enumValues.stream()
                .map(value -> "'" + value + "'")
                .collect(Collectors.joining(", "));

        String predicate = nullable
                ? String.format("(%s IS NULL OR %s IN (%s))", columnName, columnName, allowedValues)
                : String.format("(%s IN (%s))", columnName, allowedValues);

        jdbcTemplate.execute(String.format(
                "ALTER TABLE %s DROP CONSTRAINT IF EXISTS %s",
                tableName,
                constraintName
        ));
        jdbcTemplate.execute(String.format(
                "ALTER TABLE %s ADD CONSTRAINT %s CHECK %s",
                tableName,
                constraintName,
                predicate
        ));
    }
}
