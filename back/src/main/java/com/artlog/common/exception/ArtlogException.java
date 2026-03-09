package com.artlog.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ArtlogException extends RuntimeException {

    private final HttpStatus status;

    public ArtlogException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public static ArtlogException notFound(String message) {
        return new ArtlogException(HttpStatus.NOT_FOUND, message);
    }

    public static ArtlogException badRequest(String message) {
        return new ArtlogException(HttpStatus.BAD_REQUEST, message);
    }

    public static ArtlogException unauthorized(String message) {
        return new ArtlogException(HttpStatus.UNAUTHORIZED, message);
    }

    public static ArtlogException forbidden(String message) {
        return new ArtlogException(HttpStatus.FORBIDDEN, message);
    }

    public static ArtlogException conflict(String message) {
        return new ArtlogException(HttpStatus.CONFLICT, message);
    }
}
