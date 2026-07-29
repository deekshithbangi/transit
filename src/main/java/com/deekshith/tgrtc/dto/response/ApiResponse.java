package com.deekshith.tgrtc.dto.response;

import lombok.Builder;

@Builder
public record ApiResponse<T>(
        boolean success,
        String message,
        T data
) {
}