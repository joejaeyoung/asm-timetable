package com.cm.team.controller;

import com.cm.team.dto.request.CreateRecurringScheduleBlockRequest;
import com.cm.team.dto.request.CreateScheduleBlockRequest;
import com.cm.team.dto.request.DeleteScheduleBlockRequest;
import com.cm.team.dto.request.UpdateScheduleBlockRequest;
import com.cm.team.dto.response.ScheduleBlockResponse;
import com.cm.team.service.ScheduleBlockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
public class ScheduleBlockController {

    private final ScheduleBlockService scheduleBlockService;

    /**
     * GET /api/schedule?teamId={}&month=YYYY-MM
     * GET /api/schedule?teamId={}&week=YYYY-W##
     */
    @GetMapping
    public List<ScheduleBlockResponse> getSchedule(
            @RequestParam String teamId,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String week) {

        if (month != null) return scheduleBlockService.getByMonth(teamId, month);
        if (week != null) return scheduleBlockService.getByWeek(teamId, week);

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "month 또는 week 파라미터가 필요합니다.");
    }

    /** POST /api/schedule */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ScheduleBlockResponse create(@Valid @RequestBody CreateScheduleBlockRequest req) {
        return scheduleBlockService.create(req);
    }

    /** PUT /api/schedule/{id} */
    @PutMapping("/{id}")
    public ScheduleBlockResponse update(
            @PathVariable String id,
            @Valid @RequestBody UpdateScheduleBlockRequest req) {
        return scheduleBlockService.update(id, req);
    }

    /** POST /api/schedule/recurring */
    @PostMapping("/recurring")
    @ResponseStatus(HttpStatus.CREATED)
    public List<ScheduleBlockResponse> createRecurring(
            @Valid @RequestBody CreateRecurringScheduleBlockRequest req) {
        return scheduleBlockService.createRecurring(req);
    }

    /** DELETE /api/schedule/{id} */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable String id,
            @RequestBody(required = false) DeleteScheduleBlockRequest req) {
        if (req != null && req.getScope() != null) {
            scheduleBlockService.deleteWithScope(id, req.getScope());
        } else {
            scheduleBlockService.delete(id);
        }
    }
}
