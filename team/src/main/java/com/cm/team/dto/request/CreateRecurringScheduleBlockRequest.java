package com.cm.team.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;

import java.util.List;

@Getter
public class CreateRecurringScheduleBlockRequest {

    @NotBlank
    private String userId;

    @NotBlank
    private String teamId;

    @NotNull
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "날짜 형식: YYYY-MM-DD")
    private String startDate;

    @NotNull
    @Pattern(regexp = "\\d{2}:\\d{2}", message = "시간 형식: HH:MM")
    private String startTime;

    @NotNull
    @Pattern(regexp = "\\d{2}:\\d{2}", message = "시간 형식: HH:MM")
    private String endTime;

    private String description;

    /** ISO DayOfWeek: 1=월, 2=화, ..., 7=일 */
    @NotNull
    @Size(min = 1, max = 7)
    private List<Integer> daysOfWeek;

    /** "date" 또는 "count" */
    @NotBlank
    private String endCondition;

    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "날짜 형식: YYYY-MM-DD")
    private String endDate;

    @Min(2) @Max(52)
    private Integer occurrences;
}
