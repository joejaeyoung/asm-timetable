package com.cm.team.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;

@Getter
public class CreateScheduleBlockRequest {

    @NotBlank
    private String userId;

    @NotBlank
    private String teamId;

    @NotNull
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "날짜 형식: YYYY-MM-DD")
    private String date;

    @NotNull
    @Pattern(regexp = "\\d{2}:\\d{2}", message = "시간 형식: HH:MM")
    private String startTime;

    @NotNull
    @Pattern(regexp = "\\d{2}:\\d{2}", message = "시간 형식: HH:MM")
    private String endTime;

    private String description;
}
