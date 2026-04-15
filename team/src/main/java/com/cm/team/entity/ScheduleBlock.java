package com.cm.team.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(
    name = "schedule_blocks",
    indexes = {
        @Index(name = "idx_schedule_team_date", columnList = "team_id, date"),
        @Index(name = "idx_schedule_user_date", columnList = "user_id, date")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleBlock {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "recurrence_group_id", length = 36)
    private String recurrenceGroupId;

    @Column(name = "recurrence_index")
    private Integer recurrenceIndex;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
