import type { ReactNode } from "react";

type Props = {
    text: string | null | undefined;
    className?: string;
};

export default function RichExamText({ text, className }: Props) {
    return <span className={className}>{renderRichText(text ?? "")}</span>;
}

function renderRichText(text: string): ReactNode[] {
    const nodes: ReactNode[] = [];
    let buffer = "";
    let index = 0;

    const flush = () => {
        if (!buffer) return;
        nodes.push(buffer);
        buffer = "";
    };

    while (index < text.length) {
        const char = text[index];

        if (char === "\n") {
            flush();
            nodes.push(<br key={`br-${index}`} />);
            index += 1;
            continue;
        }

        if (char === "^") {
            const exponent = readExponent(text, index + 1);
            if (exponent.value) {
                flush();
                nodes.push(<sup key={`sup-${index}`} className="align-super text-[0.72em] leading-none">{exponent.value}</sup>);
                index = exponent.nextIndex;
                continue;
            }
        }

        if (char === "°") {
            flush();
            nodes.push(<sup key={`deg-${index}`} className="align-super text-[0.72em] leading-none">°</sup>);
            index += 1;
            continue;
        }

        if (isDegreeWord(text, index)) {
            flush();
            nodes.push(<sup key={`deg-word-${index}`} className="align-super text-[0.72em] leading-none">°</sup>);
            index += text.slice(index).match(/^\s*derajat/i)?.[0].length ?? 0;
            continue;
        }

        buffer += char;
        index += 1;
    }

    flush();

    return nodes;
}

function readExponent(text: string, startIndex: number): { value: string; nextIndex: number } {
    if (text[startIndex] === "{" || text[startIndex] === "(") {
        const closing = text[startIndex] === "{" ? "}" : ")";
        const closeIndex = text.indexOf(closing, startIndex + 1);

        if (closeIndex > startIndex + 1) {
            return {
                value: text.slice(startIndex + 1, closeIndex),
                nextIndex: closeIndex + 1,
            };
        }
    }

    const match = text.slice(startIndex).match(/^[A-Za-z0-9+\-=]+/);

    return {
        value: match?.[0] ?? "",
        nextIndex: startIndex + (match?.[0].length ?? 0),
    };
}

function isDegreeWord(text: string, index: number): boolean {
    const match = text.slice(index).match(/^\s*derajat/i);
    if (!match) return false;

    const previous = text.slice(0, index).trimEnd().at(-1);

    return previous ? /\d/.test(previous) : false;
}
