package com.deekshith.tgrtc.repository;

import com.deekshith.tgrtc.entity.Agency;
import com.deekshith.tgrtc.util.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class AgencyRepositoryTest extends BaseRepositoryTest {

    @Autowired
    private AgencyRepository agencyRepository;
    Agency agency = TestDataFactory.createAgency();

    @Test
    void shouldSaveAgency() {

        Agency agency = TestDataFactory.createAgency();

        Agency savedAgency = agencyRepository.save(agency);

        assertThat(savedAgency).isNotNull();
        assertThat(savedAgency.getAgencyId()).isEqualTo("TEST");
    }

    @Test
    void shouldFindAgencyById() {

        Agency agency = Agency.builder()
                .agencyId("TEST")
                .agencyName("Test Agency")
                .agencyUrl("https://example.com")
                .agencyTimezone("Asia/Kolkata")
                .agencyLang("en")
                .build();

        agencyRepository.save(agency);

        Optional<Agency> foundAgency = agencyRepository.findById("TEST");

        assertThat(foundAgency).isPresent();
        assertThat(foundAgency.get().getAgencyName())
                .isEqualTo("Test Agency");
    }

    @Test
    void shouldReturnEmptyWhenAgencyNotFound() {

        Optional<Agency> agency = agencyRepository.findById("UNKNOWN");

        assertThat(agency).isEmpty();
    }
}