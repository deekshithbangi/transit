package com.deekshith.tgrtc.repository;

import com.deekshith.tgrtc.entity.Stop;
import com.deekshith.tgrtc.util.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class StopRepositoryTest extends BaseRepositoryTest {

    @Autowired
    private StopRepository stopRepository;

    @Test
    void shouldFindStopsByNameIgnoringCase() {

        Stop stop = TestDataFactory.createStop();
        stopRepository.save(stop);

        Page<Stop> result = stopRepository.findByStopNameContainingIgnoreCase(
                "test",
                PageRequest.of(0, 10)
        );

        assertThat(result)
                .isNotNull();
        assertThat(result.getContent())
                .hasSize(1);
        assertThat(result.getContent().
                getFirst()
                .getStopName())
                .isEqualTo("Test Stop");
    }

    @Test
    void shouldReturnEmptyWhenStopNameDoesNotExist() {

        Page<Stop> result = stopRepository.findByStopNameContainingIgnoreCase(
                "unknown",
                PageRequest.of(0, 10)
        );

        assertThat(result).isEmpty();
    }

    @Test
    void shouldFindNearbyStops() {

        Stop stop = TestDataFactory.createStop();
        stopRepository.save(stop);

        List<Object[]> nearbyStops =
                stopRepository.findNearbyStops(
                        17.3850,
                        78.4867,
                        1000.0
                );

        assertThat(nearbyStops).isNotEmpty();

        Object[] first = nearbyStops.getFirst();

        assertThat(first).hasSize(5);

        assertThat(first[0]).isEqualTo("STOP001");
        assertThat(first[1]).isEqualTo("Test Stop");
        assertThat(first[2]).isEqualTo(17.3850);
        assertThat(first[3]).isEqualTo(78.4867);
        assertThat(((Number) first[4]).doubleValue())
                .isLessThan(1000.0);
    }

    @Test
    void shouldReturnNoNearbyStopsOutsideRadius() {

        Stop stop = TestDataFactory.createStop();
        stopRepository.save(stop);

        List<Object[]> nearbyStops =
                stopRepository.findNearbyStops(
                        10.0000,
                        10.0000,
                        100.0
                );

        assertThat(nearbyStops).isEmpty();
    }
}