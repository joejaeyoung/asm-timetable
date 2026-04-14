package com.cm.team.repository;

import com.cm.team.entity.TeamMembership;
import com.cm.team.entity.TeamMembershipId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamMembershipRepository extends JpaRepository<TeamMembership, TeamMembershipId> {

    List<TeamMembership> findByIdTeamId(String teamId);

    boolean existsByIdTeamIdAndIdUserId(String teamId, String userId);

    void deleteByIdTeamId(String teamId);
}
