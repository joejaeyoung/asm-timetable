package com.cm.team.repository;

import com.cm.team.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, String> {

    @Query("SELECT t FROM Team t JOIN TeamMembership tm ON tm.team = t WHERE tm.user.id = :userId")
    List<Team> findAllByMemberUserId(@Param("userId") String userId);
}
