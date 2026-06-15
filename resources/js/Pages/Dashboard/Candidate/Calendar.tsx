import { Head, router } from "@inertiajs/react";
import { DateClickArg } from "@fullcalendar/interaction";
import { DatesSetArg, DayCellContentArg, EventClickArg, EventContentArg } from "@fullcalendar/core";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import AgendaFormModal from "@/Components/Dashboard/Candidate/Calendar/AgendaFormModal";
import CalendarHeader from "@/Components/Dashboard/Candidate/Calendar/CalendarHeader";
import CalendarPanel from "@/Components/Dashboard/Candidate/Calendar/CalendarPanel";
import CalendarSidebar from "@/Components/Dashboard/Candidate/Calendar/CalendarSidebar";
import CalendarSummaryGrid from "@/Components/Dashboard/Candidate/Calendar/CalendarSummaryGrid";
import CalendarWaveInfo from "@/Components/Dashboard/Candidate/Calendar/CalendarWaveInfo";
import EventDetailModal from "@/Components/Dashboard/Candidate/Calendar/EventDetailModal";
import { typeTheme } from "@/Components/Dashboard/Candidate/Calendar/constants";
import { CalendarEvent, CalendarEventType, CalendarPageProps, DateMeta } from "@/Components/Dashboard/Candidate/Calendar/types";
import { emptyForm, formatHijri, formatWeton, toIsoDate } from "@/Components/Dashboard/Candidate/Calendar/utils";
import DashboardSplitLayout from "@/Layouts/DashboardSplitLayout";

export default function CalendarPage({ candidate, settings, endpoints }: CalendarPageProps) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [dateMeta, setDateMeta] = useState<Record<string, DateMeta>>({});
    const [activeFilter, setActiveFilter] = useState<CalendarEventType | "all">("all");
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState(emptyForm());
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [hideJavaneseCalendar, setHideJavaneseCalendar] = useState(settings.hide_javanese_calendar);
    const lastRange = useRef<{ start: string; end: string } | null>(null);

    const fetchEvents = useCallback(async (start: string, end: string) => {
        setLoading(true);
        setLoadError(null);

        try {
            const response = await axios.get(endpoints.events, { params: { start, end } });
            setEvents(response.data.events ?? []);
            setDateMeta(response.data.dateMeta ?? {});
        } catch {
            setLoadError("Kalender belum berhasil dimuat. Periksa koneksi atau coba muat ulang.");
        } finally {
            setLoading(false);
        }
    }, [endpoints.events]);

    useEffect(() => {
        animate(".calendar-entrance", {
            opacity: [0, 1],
            translateY: [16, 0],
            duration: 550,
            delay: stagger(70),
            ease: "outExpo",
        });
    }, []);

    const filteredEvents = useMemo(() => {
        if (activeFilter === "all") return events;
        return events.filter((event) => event.type === activeFilter);
    }, [activeFilter, events]);

    const fullCalendarEvents = useMemo(() => filteredEvents.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end ?? undefined,
        allDay: event.allDay,
        extendedProps: event,
        classNames: [
            "spmb-calendar-event",
            `spmb-event-${event.type}`,
            `spmb-status-${event.status}`,
        ],
    })), [filteredEvents]);

    const upcomingEvents = useMemo(() => {
        const today = toIsoDate(new Date());

        return events
            .filter((event) => event.start.slice(0, 10) >= today && event.status !== "cancelled")
            .sort((a, b) => a.start.localeCompare(b.start))
            .slice(0, 7);
    }, [events]);

    const summary = useMemo(() => {
        const today = toIsoDate(new Date());
        const todayEvents = events.filter((event) => event.start.slice(0, 10) === today);
        const urgentEvents = events.filter((event) => event.status === "urgent");
        const holidays = events.filter((event) => event.type === "holiday");
        const customNotes = events.filter((event) => event.source === "custom");

        return { todayEvents, urgentEvents, holidays, customNotes };
    }, [events]);

    const handleDatesSet = (arg: DatesSetArg) => {
        const range = {
            start: toIsoDate(arg.start),
            end: toIsoDate(arg.end),
        };

        if (lastRange.current?.start === range.start && lastRange.current?.end === range.end) {
            return;
        }

        lastRange.current = range;
        void fetchEvents(range.start, range.end);
    };

    const handleDateClick = (arg: DateClickArg) => {
        setForm(emptyForm(arg.dateStr));
        setFormOpen(true);
    };

    const handleEventClick = (arg: EventClickArg) => {
        setSelectedEvent(arg.event.extendedProps as CalendarEvent);
    };

    const handleSubmitAgenda = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.post(endpoints.store, {
            title: form.title,
            description: form.description || null,
            event_date: form.event_date,
            starts_at: null,
            ends_at: null,
            all_day: true,
            type: form.type,
            status: form.status,
            location: form.location || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setFormOpen(false);
                if (lastRange.current) {
                    void fetchEvents(lastRange.current.start, lastRange.current.end);
                }
            },
        });
    };

    const handleToggleJavanese = (checked: boolean) => {
        setHideJavaneseCalendar(checked);

        router.patch(endpoints.settings, {
            hide_javanese_calendar: checked,
        }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const renderEventContent = (arg: EventContentArg) => {
        const event = arg.event.extendedProps as CalendarEvent;
        const theme = typeTheme[event.type];

        return (
            <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${theme.dot}`} />
                <span className="truncate text-[11px] font-semibold">{arg.event.title}</span>
                {event.status === "urgent" && (
                    <i className="fa-solid fa-triangle-exclamation shrink-0 text-[9px] text-amber-400" />
                )}
            </div>
        );
    };

    const renderDayCell = (arg: DayCellContentArg) => {
        const key = toIsoDate(arg.date);
        const meta = dateMeta[key];
        const hijri = formatHijri(arg.date);
        const weton = formatWeton(arg.date);

        return (
            <div className="min-h-[52px] w-full">
                <div className="flex items-center justify-between gap-2">
                    <span className={meta?.isRedDate ? "font-black text-rose-600 dark:text-rose-300" : "font-black text-slate-800 dark:text-slate-100"}>
                        {arg.dayNumberText}
                    </span>
                    {meta?.isRedDate && (
                        <span className="rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-rose-600 dark:text-rose-300">
                            Merah
                        </span>
                    )}
                </div>
                {!hideJavaneseCalendar && (
                    <div className="mt-1 space-y-0.5 text-[9px] leading-tight text-slate-500 dark:text-slate-400">
                        {hijri && <p className="truncate">{hijri}</p>}
                        <p className="truncate">{weton}</p>
                    </div>
                )}
            </div>
        );
    };

    const handleRetry = () => {
        if (lastRange.current) {
            void fetchEvents(lastRange.current.start, lastRange.current.end);
        }
    };

    return (
        <DashboardSplitLayout>
            <Head title="Kalender SPMB" />

            <CalendarHeader
                hideJavaneseCalendar={hideJavaneseCalendar}
                onToggleJavaneseCalendar={handleToggleJavanese}
                onOpenAgendaForm={() => {
                    setForm(emptyForm());
                    setFormOpen(true);
                }}
            />

            <CalendarSummaryGrid
                todayCount={summary.todayEvents.length}
                urgentCount={summary.urgentEvents.length}
                holidayCount={summary.holidays.length}
                noteCount={summary.customNotes.length}
            />

            <CalendarWaveInfo candidate={candidate} />

            <section className="calendar-entrance opacity-0 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <CalendarPanel
                    activeFilter={activeFilter}
                    loading={loading}
                    loadError={loadError}
                    events={fullCalendarEvents}
                    onRetry={lastRange.current ? handleRetry : null}
                    onFilterChange={setActiveFilter}
                    onDatesSet={handleDatesSet}
                    onDateClick={handleDateClick}
                    onEventClick={handleEventClick}
                    renderEventContent={renderEventContent}
                    renderDayCell={renderDayCell}
                    getDayCellClassNames={(arg) => {
                        const meta = dateMeta[toIsoDate(arg.date)];
                        return meta?.isRedDate ? ["spmb-red-date"] : ["spmb-workday"];
                    }}
                />

                <CalendarSidebar
                    upcomingEvents={upcomingEvents}
                    onSelectEvent={setSelectedEvent}
                />
            </section>

            {formOpen && (
                <AgendaFormModal
                    form={form}
                    setForm={setForm}
                    onClose={() => setFormOpen(false)}
                    onSubmit={handleSubmitAgenda}
                />
            )}

            {selectedEvent && (
                <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
            )}
        </DashboardSplitLayout>
    );
}
