export interface User {
    id:                 number;
    name:               string;
    email:              string;
    email_verified_at?: string;
    role:               'candidate' | 'staff' | 'admin';
    is_active:          boolean;
    whatsapp_number?:   string;
    avatar_url:         string | null;
    initials:           string;
}

export interface AppConfig {
    name:    string;
    tagline: string;
    logo:    string | null;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    app: AppConfig;
};