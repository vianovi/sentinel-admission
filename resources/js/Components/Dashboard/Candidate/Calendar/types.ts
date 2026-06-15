export type CalendarEventType =
    | "registration"
    | "payment"
    | "test"
    | "announcement"
    | "document"
    | "meeting"
    | "note"
    | "holiday";

export type CalendarStatus = "scheduled" | "active" | "completed" | "cancelled" | "urgent";

export type CalendarEvent = {
    id: string;
    source_id?: number;
    source: "custom" | "admission_wave" | "holiday_api";
    title: string;
    description: string | null;
    start: string;
    end: string | null;
    allDay: boolean;
    type: CalendarEventType;
    status: CalendarStatus;
    location: string | null;
    editable: boolean;
    holidayType?: "holiday" | "leave";
};

export type DateMeta = {
    date: string;
    isWeekend: boolean;
    isHoliday: boolean;
    isRedDate: boolean;
    holidayNames: string[];
    holidayTypes: string[];
    workdayLabel: string;
};

export type CalendarCandidate = {
    id: number;
    full_name: string;
    status: string;
    admission_wave: {
        id: number;
        title: string;
        academic_year: string;
        exam_info: string | null;
        announcement_info: string | null;
    } | null;
} | null;

export type CalendarPageProps = {
    candidate: CalendarCandidate;
    settings: {
        hide_javanese_calendar: boolean;
    };
    endpoints: {
        events: string;
        store: string;
        settings: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};

export type EventFormState = {
    title: string;
    description: string;
    event_date: string;
    type: Exclude<CalendarEventType, "holiday">;
    status: CalendarStatus;
    location: string;
};
