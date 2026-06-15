import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { EventFormState } from "@/Components/Dashboard/Candidate/Calendar/types";

const pasaran = ["Legi", "Pahing", "Pon", "Wage", "Kliwon"];
const wetonAnchor = new Date("1945-08-17T00:00:00+07:00");

export const toIsoDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const formatReadableDate = (value: string | Date): string => {
    const date = typeof value === "string" ? parseISO(value.slice(0, 10)) : value;
    return format(date, "EEEE, d MMMM yyyy", { locale: idLocale });
};

export const formatHijri = (date: Date): string => {
    try {
        return new Intl.DateTimeFormat("id-ID-u-ca-islamic", {
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(date);
    } catch {
        return "";
    }
};

export const formatWeton = (date: Date): string => {
    const diff = Math.floor((date.getTime() - wetonAnchor.getTime()) / 86400000);
    const pasaranIndex = ((diff % 5) + 5) % 5;
    const day = new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date);

    return `${day} ${pasaran[pasaranIndex]}`;
};

export const emptyForm = (date = toIsoDate(new Date())): EventFormState => ({
    title: "",
    description: "",
    event_date: date,
    type: "note",
    status: "scheduled",
    location: "",
});
