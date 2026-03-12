import { Config } from 'ziggy-js';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role?: string;
    smart_entry_limit: number;
    insight_limit: number;
    roast_limit: number;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    ziggy: Config & { location: string };
};

export interface Feedback {
    id: number;
    user_id: number;
    user_name?: string;
    user_email?: string;
    category: 'SUGGESTION' | 'BUG' | 'QUESTION' | 'OTHER';
    subject: string;
    message: string;
    status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    admin_reply: string | null;
    replied_at: string | null;
    created_at: string;
    updated_at?: string;
}
