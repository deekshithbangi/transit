package com.deekshith.tgrtc.repository;

import com.deekshith.tgrtc.entity.Agency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AgencyRepository extends JpaRepository<Agency, String> {
    Optional<Agency> findByAgencyId(String agencyId);

}



