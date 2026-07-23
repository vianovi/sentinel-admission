<x-email.layout :title="$title" :preheader="$preheader">
    <h1 style="margin:0 0 20px; color:#132f68; font-size:26px; font-weight:700; line-height:1.25; letter-spacing:-0.3px;">
        {{ $title }}
    </h1>

    @if($greeting)
        <p style="margin:0 0 18px; color:#243454; font-size:15px; line-height:1.75;">
            {{ $greeting }}
        </p>
    @endif

    @foreach($description as $paragraph)
        <p style="margin:0 0 16px; color:#53627a; font-size:15px; line-height:1.75;">
            {{ $paragraph }}
        </p>
    @endforeach

    @if($actionUrl && $actionText)
        <x-email.button :href="$actionUrl" :label="$actionText" />
    @endif

    @if($panel)
        <x-email.panel :title="$panel['title'] ?? 'Informasi'">
            {{ $panel['body'] ?? '' }}
        </x-email.panel>
    @endif

    @if($warning)
        <x-email.panel tone="gold" :title="$warning['title'] ?? 'Perhatian'">
            {{ $warning['body'] ?? '' }}
        </x-email.panel>
    @endif

    @if($information)
        <x-email.panel :title="$information['title'] ?? 'Informasi'">
            {{ $information['body'] ?? '' }}
        </x-email.panel>
    @endif

    @foreach($outroLines as $line)
        <p style="margin:0 0 14px; color:#53627a; font-size:14px; line-height:1.75;">
            {{ $line }}
        </p>
    @endforeach

    @if($secondaryText)
        <p style="margin:24px 0 0; padding-top:20px; border-top:1px solid #edf0f5; color:#7a879b; font-size:12px; line-height:1.7;">
            {{ $secondaryText }}
        </p>
    @endif
</x-email.layout>
