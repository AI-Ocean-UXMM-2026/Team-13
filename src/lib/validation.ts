import { z } from 'zod';
export class ApiError extends Error {
    constructor(public status: number, public code: string, message: string) { super(message); }
}
export const uuid = z.uuid();
export const answerSchema = z.strictObject({ questionId: uuid, optionIds: z.array(uuid).min(1).max(2) });
export const completeSchema = z.strictObject({ attemptId: uuid, answers: z.array(answerSchema).length(20) });
export const leadSchema = z.strictObject({ studentName: z.string().trim().min(1).max(100), contactMethod: z.enum(['email', 'phone']), contactValue: z.string().trim().min(3).max(254), consent: z.literal(true) }).superRefine((v, c) => {
    if (v.contactMethod === 'email' ? !z.email().safeParse(v.contactValue).success : (!/^\+?[0-9 ()-]{7,25}$/.test(v.contactValue) || (v.contactValue.match(/[0-9]/g) || []).length < 7))
        c.addIssue({ code: 'custom', path: ['contactValue'], message: 'Invalid contact format' });
});
export const clientEvents = ['results_viewed', 'course_clicked', 'advisor_clicked', 'explore_clicked'] as const;
export const eventSchema = z.strictObject({ eventName: z.enum(clientEvents), attemptId: uuid.optional(), entityId: uuid.optional(), metadata: z.strictObject({ screen: z.enum(['landing', 'quiz', 'results', 'options', 'next_action']).optional(), placementKey: z.string().max(64).optional(), action: z.enum(['explore', 'compare', 'learn', 'contact']).optional() }).default({}) }).superRefine((v, c) => {
    if (v.eventName === 'results_viewed' && !v.attemptId)
        c.addIssue({ code: 'custom', message: 'attemptId required' });
    if (['course_clicked', 'advisor_clicked'].includes(v.eventName) && !v.entityId)
        c.addIssue({ code: 'custom', message: 'entityId required' });
    if (v.eventName === 'explore_clicked' && v.entityId)
        c.addIssue({ code: 'custom', message: 'entityId is not supported for explore_clicked' });
});
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
    const result = schema.safeParse(value);
    if (!result.success)
        throw new ApiError(400, 'INVALID_INPUT', result.error.issues.map(i => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '));
    return result.data;
}
export function validUrl(value: string | null): string | null {
    if (value === null)
        return null;
    try {
        const u = new URL(value);
        if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password)
            throw Error();
        return value;
    }
    catch {
        throw new ApiError(500, 'INVALID_CONTENT', 'Content has an invalid external URL');
    }
}
