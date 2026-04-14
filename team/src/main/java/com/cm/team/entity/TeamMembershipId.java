package com.cm.team.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class TeamMembershipId implements Serializable {

    @Column(name = "team_id", length = 36)
    private String teamId;

    @Column(name = "user_id", length = 36)
    private String userId;
}
