package com.cm.team.dto.response;

import com.cm.team.entity.ScheduleBlock;
import lombok.Getter;

@Getter
public class ScheduleBlockResponse {

    private final String id;
    private final String userId;
    private final String teamId;
    private final String date;
    private final String startTime;
    private final String endTime;
    private final String description;
    private final String recurrenceGroupId;
    private final Integer recurrenceIndex;

    public ScheduleBlockResponse(ScheduleBlock block) {
        this.id = block.getId();
        this.userId = block.getUser() != null ? block.getUser().getId() : null;
        this.teamId = block.getTeam().getId();
        this.date = block.getDate().toString();
        this.startTime = block.getStartTime().toString();
        this.endTime = block.getEndTime().toString();
        this.description = block.getDescription();
        this.recurrenceGroupId = block.getRecurrenceGroupId();
        this.recurrenceIndex = block.getRecurrenceIndex();
    }
}
