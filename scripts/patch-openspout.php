<?php

/**
 * Automates patching openspout to support rich text superscript/subscript.
 * This runs automatically post-autoload-dump.
 */
$baseDir = dirname(__DIR__);

// Patch 1: SharedStringsManager.php
$sharedStringsFile = $baseDir.'/vendor/openspout/openspout/src/Reader/XLSX/Manager/SharedStringsManager.php';
if (file_exists($sharedStringsFile)) {
    $content = file_get_contents($sharedStringsFile);

    // Check if already patched
    if (strpos($content, 'vertAlignElements') === false) {
        $target = <<<'CODE'
        foreach ($textNodes as $textNode) {
            if ($this->shouldExtractTextNodeValue($textNode)) {
                $textNodeValue = $textNode->nodeValue;
                \assert(null !== $textNodeValue);
                $shouldPreserveWhitespace = $this->shouldPreserveWhitespace($textNode);

                $sharedStringValue .= $shouldPreserveWhitespace
                    ? $textNodeValue
                    : trim($textNodeValue);
            }
        }
CODE;

        $replacement = <<<'CODE'
        foreach ($textNodes as $textNode) {
            if ($this->shouldExtractTextNodeValue($textNode)) {
                $textNodeValue = $textNode->nodeValue;
                \assert(null !== $textNodeValue);
                $shouldPreserveWhitespace = $this->shouldPreserveWhitespace($textNode);

                $formattedValue = $shouldPreserveWhitespace
                    ? $textNodeValue
                    : trim($textNodeValue);

                $parentNode = $textNode->parentNode;
                if ($parentNode !== null && $parentNode->localName === self::XML_NODE_R) {
                    $rPrElements = $parentNode->getElementsByTagName('rPr');
                    if ($rPrElements->length > 0) {
                        $rPr = $rPrElements->item(0);
                        $vertAlignElements = $rPr->getElementsByTagName('vertAlign');
                        if ($vertAlignElements->length > 0) {
                            $vertAlign = $vertAlignElements->item(0);
                            $val = $vertAlign->getAttribute('val');
                            if ($val === 'superscript') {
                                $formattedValue = '<sup>' . $formattedValue . '</sup>';
                            } elseif ($val === 'subscript') {
                                $formattedValue = '<sub>' . $formattedValue . '</sub>';
                            }
                        }
                    }
                }

                $sharedStringValue .= $formattedValue;
            }
        }
CODE;

        if (strpos($content, trim($target)) !== false) {
            $newContent = str_replace($target, $replacement, $content);
            file_put_contents($sharedStringsFile, $newContent);
            echo "Patched SharedStringsManager.php successfully.\n";
        } else {
            echo "Warning: Target code in SharedStringsManager.php not found for patching.\n";
        }
    } else {
        echo "SharedStringsManager.php is already patched.\n";
    }
} else {
    echo "Warning: SharedStringsManager.php not found. Skip patching.\n";
}

// Patch 2: CellValueFormatter.php
$cellFormatterFile = $baseDir.'/vendor/openspout/openspout/src/Reader/XLSX/Helper/CellValueFormatter.php';
if (file_exists($cellFormatterFile)) {
    $content = file_get_contents($cellFormatterFile);

    // Check if already patched
    if (strpos($content, 'vertAlignElements') === false) {
        $target = <<<'CODE'
    private function formatInlineStringCellValue(DOMElement $node): string
    {
        // inline strings are formatted this way (they can contain any number of <t> nodes):
        // <c r="A1" t="inlineStr"><is><t>[INLINE_STRING]</t><t>[INLINE_STRING_2]</t></is></c>
        $tNodes = $node->getElementsByTagName(self::XML_NODE_INLINE_STRING_VALUE);

        $cellValue = '';
        for ($i = 0; $i < $tNodes->count(); ++$i) {
            $nodeValue = $tNodes->item($i)->nodeValue;
            \assert(null !== $nodeValue);
            $cellValue .= $this->escaper->unescape($nodeValue);
        }

        return $cellValue;
    }
CODE;

        $replacement = <<<'CODE'
    private function formatInlineStringCellValue(DOMElement $node): string
    {
        // inline strings are formatted this way (they can contain any number of <t> nodes):
        // <c r="A1" t="inlineStr"><is><t>[INLINE_STRING]</t><t>[INLINE_STRING_2]</t></is></c>
        $tNodes = $node->getElementsByTagName(self::XML_NODE_INLINE_STRING_VALUE);

        $cellValue = '';
        for ($i = 0; $i < $tNodes->count(); ++$i) {
            $tNode = $tNodes->item($i);
            $nodeValue = $tNode->nodeValue;
            \assert(null !== $nodeValue);
            
            $formattedValue = $this->escaper->unescape($nodeValue);

            $parentNode = $tNode->parentNode;
            if ($parentNode !== null && $parentNode->localName === 'r') {
                $rPrElements = $parentNode->getElementsByTagName('rPr');
                if ($rPrElements->length > 0) {
                    $rPr = $rPrElements->item(0);
                    $vertAlignElements = $rPr->getElementsByTagName('vertAlign');
                    if ($vertAlignElements->length > 0) {
                        $vertAlign = $vertAlignElements->item(0);
                        $val = $vertAlign->getAttribute('val');
                        if ($val === 'superscript') {
                            $formattedValue = '<sup>' . $formattedValue . '</sup>';
                        } elseif ($val === 'subscript') {
                            $formattedValue = '<sub>' . $formattedValue . '</sub>';
                        }
                    }
                }
            }

            $cellValue .= $formattedValue;
        }

        return $cellValue;
    }
CODE;

        if (strpos($content, trim($target)) !== false) {
            $newContent = str_replace($target, $replacement, $content);
            file_put_contents($cellFormatterFile, $newContent);
            echo "Patched CellValueFormatter.php successfully.\n";
        } else {
            // Also try with potential different whitespace formatting
            $targetNormalized = preg_replace('/\s+/', ' ', trim($target));
            // Let's do exact match first
            echo "Warning: Target code in CellValueFormatter.php not found for patching.\n";
        }
    } else {
        echo "CellValueFormatter.php is already patched.\n";
    }
} else {
    echo "Warning: CellValueFormatter.php not found. Skip patching.\n";
}
