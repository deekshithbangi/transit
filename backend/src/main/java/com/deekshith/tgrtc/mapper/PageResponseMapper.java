package com.deekshith.tgrtc.util;

import com.deekshith.tgrtc.dto.response.PageResponse;
import org.springframework.data.domain.Page;

import java.util.function.Function;

public final class PageResponseMapper {

    private PageResponseMapper() {
    }

    public static <T, R> PageResponse<R> toPageResponse(
            Page<T> page,
            Function<T, R> mapper) {

        return PageResponse.<R>builder()
                .content(
                        page.getContent()
                                .stream()
                                .map(mapper)
                                .toList()
                )
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}