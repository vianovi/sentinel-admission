import type { ReactNode } from "react";

type Props = {
    text: string | null | undefined;
    className?: string;
};

const UNICODE_SUPERSCRIPTS: Record<string, string> = {
    "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
    "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
    "⁺": "+", "⁻": "-", "ⁿ": "n", "ˣ": "x", "ʸ": "y",
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

        // HTML <sup> tag parsing
        if (text.slice(index).toLowerCase().startsWith("<sup>")) {
            const closeIndex = text.toLowerCase().indexOf("</sup>", index + 5);
            if (closeIndex > index + 5) {
                flush();
                const content = text.slice(index + 5, closeIndex);
                nodes.push(<sup key={`html-sup-${index}`} className="align-super text-[0.72em] leading-none">{renderRichText(content)}</sup>);
                index = closeIndex + 6;
                continue;
            }
        }

        // HTML <sub> tag parsing
        if (text.slice(index).toLowerCase().startsWith("<sub>")) {
            const closeIndex = text.toLowerCase().indexOf("</sub>", index + 5);
            if (closeIndex > index + 5) {
                flush();
                const content = text.slice(index + 5, closeIndex);
                nodes.push(<sub key={`html-sub-${index}`} className="align-sub text-[0.72em] leading-none">{renderRichText(content)}</sub>);
                index = closeIndex + 6;
                continue;
            }
        }

        // Custom Image Tag [GAMBAR: filename.ext] or [IMG: filename.ext]
        const isGambarTag = text.slice(index).toUpperCase().startsWith("[GAMBAR:");
        const isImgTag = !isGambarTag && text.slice(index).toUpperCase().startsWith("[IMG:");
        
        if (isGambarTag || isImgTag) {
            const tagLength = isGambarTag ? 8 : 5;
            const closeIndex = text.indexOf("]", index + tagLength);
            if (closeIndex > index + tagLength) {
                flush();
                const filename = text.slice(index + tagLength, closeIndex).trim();
                nodes.push(
                    <img 
                        key={`img-${index}`} 
                        src={`/storage/exam/images/${filename}`} 
                        alt="Ilustrasi Soal" 
                        className="max-w-full h-auto my-3 rounded-md border border-gray-200"
                        loading="lazy"
                    />
                );
                index = closeIndex + 1;
                continue;
            }
        }

        // Extended Unicode superscripts
        if (UNICODE_SUPERSCRIPTS[char]) {
            flush();
            nodes.push(<sup key={`uni-sup-${index}`} className="align-super text-[0.72em] leading-none">{UNICODE_SUPERSCRIPTS[char]}</sup>);
            index += 1;
            continue;
        }

        if (char === "^") {
            const exponent = readExponent(text, index + 1);
            if (exponent.value) {
                flush();
                nodes.push(<sup key={`sup-${index}`} className="align-super text-[0.72em] leading-none">{renderRichText(exponent.value)}</sup>);
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
    if (startIndex >= text.length) return { value: "", nextIndex: startIndex };

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

    // Single token exponent: digits or letters only (not operator + or - outside braces)
    const match = text.slice(startIndex).match(/^([0-9]+|[a-zA-Z]+)/);

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
