import { Head, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { BackLink, FlashMessage, PageHeader } from "@/Components/Dashboard/Candidate/Exam/ExamCandidateUi";
import CandidateSessionCard, { CandidateAssignment, CandidateMeta } from "@/Components/Exam/Candidate/CandidateSessionCard";
import CandidateAttemptHistory, { AttemptSummary } from "@/Components/Exam/Candidate/CandidateAttemptHistory";
import type { PageProps } from "@/types";

type Props = {
    candidate: CandidateMeta;
    assignment: CandidateAssignment;
    attempts: AttemptSummary[];
    server_time: string;
};

export default function CandidateExamSessionShow({ candidate, assignment, attempts }: Props) {
    const { flash, errors } = usePage<PageProps & { errors: Record<string, string> }>().props;

    return (
        <>
            <Head title={`${assignment.session.title} - Ujian Seleksi`} />

            <div className="space-y-5 pb-8">
                <PageHeader
                    title={assignment.session.title}
                    description={`${assignment.package.subject_name ?? "-"} · ${assignment.package.title ?? "-"}`}
                    icon="fa-solid fa-file-pen"
                    actions={<BackLink href="/dashboard/seleksi" />}
                />

                <FlashMessage value={flash.success} type="success" />
                <FlashMessage value={flash.error ?? errors.exam} />

                <CandidateSessionCard candidate={candidate} assignment={assignment} />
                <CandidateAttemptHistory attempts={attempts} />
            </div>
        </>
    );
}

CandidateExamSessionShow.layout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
