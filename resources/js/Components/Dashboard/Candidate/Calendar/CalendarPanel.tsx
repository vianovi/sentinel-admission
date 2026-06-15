import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import { DatesSetArg, DayCellContentArg, EventClickArg, EventContentArg } from "@fullcalendar/core";
import { EVENT_TYPES } from "@/Components/Dashboard/Candidate/Calendar/constants";
import { CalendarEvent, CalendarEventType } from "@/Components/Dashboard/Candidate/Calendar/types";

type Props = {
    activeFilter: CalendarEventType | "all";
    loading: boolean;
    loadError: string | null;
    events: Array<Record<string, unknown>>;
    onRetry: (() => void) | null;
    onFilterChange: (value: CalendarEventType | "all") => void;
    onDatesSet: (arg: DatesSetArg) => void;
    onDateClick: (arg: DateClickArg) => void;
    onEventClick: (arg: EventClickArg) => void;
    renderEventContent: (arg: EventContentArg) => React.ReactNode;
    renderDayCell: (arg: DayCellContentArg) => React.ReactNode;
    getDayCellClassNames: (arg: { date: Date }) => string[];
};

export default function CalendarPanel({
    activeFilter,
    loading,
    loadError,
    events,
    onRetry,
    onFilterChange,
    onDatesSet,
    onDateClick,
    onEventClick,
    renderEventContent,
    renderDayCell,
    getDayCellClassNames,
}: Props) {
    return (
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#0d1424] sm:p-4">
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {EVENT_TYPES.map((item) => {
                    const active = activeFilter === item.value;

                    return (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => onFilterChange(item.value)}
                            className={[
                                "inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition",
                                active
                                    ? "border-gold bg-gold text-navy shadow-glow"
                                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-gold/40 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white",
                            ].join(" ")}
                        >
                            <i className={`fa-solid ${item.icon}`} />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {loadError && (
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between">
                    <span>{loadError}</span>
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="min-h-[40px] rounded-lg bg-rose-600 px-3 text-xs font-black text-white"
                        >
                            Coba Lagi
                        </button>
                    )}
                </div>
            )}

            <div className={loading ? "pointer-events-none opacity-60" : ""}>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "dayGridMonth,timeGridWeek,listMonth",
                    }}
                    buttonText={{
                        today: "Hari ini",
                        month: "Bulan",
                        week: "Minggu",
                        list: "List",
                    }}
                    locale="id"
                    height="auto"
                    firstDay={1}
                    events={events}
                    datesSet={onDatesSet}
                    dateClick={onDateClick}
                    eventClick={onEventClick}
                    eventContent={renderEventContent}
                    dayCellContent={renderDayCell}
                    dayCellClassNames={getDayCellClassNames}
                    fixedWeekCount={false}
                    nowIndicator
                />
            </div>
        </div>
    );
}
