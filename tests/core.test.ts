import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate, validateAnswers, matchAds, canonicalAnswers } from '../src/lib/scoring';
import { eventSchema, leadSchema, validUrl, completeSchema } from '../src/lib/validation';
import type { Catalog, Code, Ad } from '../src/lib/types';
const codes: Code[] = ['R', 'I', 'A', 'S', 'E', 'C'];
const mapping: Code[] = ['R', 'I', 'A', 'S', 'E', 'C', 'I', 'A', 'S', 'E', 'R', 'I'];
const extras = ['many_interests', 'hands_on_activity', 'affordability', 'building_repairing', 'online_short_courses', 'exploring', 'action_plan', 'try_beginner_activity'];
const categories = codes.map(code => ({ id: code, code, name: code, description: code }));
const questions = Array.from({ length: 20 }, (_, i) => ({ id: `q${i + 1}`, position: i + 1, text: `Question ${i + 1}`, max_selections: [14, 16].includes(i) ? 2 : 1, options: Array.from({ length: 4 }, (_, j) => ({ id: `q${i + 1}o${j}`, question_id: `q${i + 1}`, position: j + 1, text: `Option ${j}`, value: i < 12 ? String(j) : j === 0 ? extras[i - 12] : `extra_${j}` })) }));
const catalog: Catalog = { categories, questions, weights: questions.slice(0, 12).flatMap((q, i) => q.options.map((o, j) => ({ option_id: o.id, category_id: mapping[i], score: j }))), roles: codes.map(c => ({ id: 'role' + c, category_id: c, title: c, description: c, is_demo: true })), courses: [], advisors: [] };
const answers = (score = 3) => questions.map((q, i) => ({ questionId: q.id, optionIds: [q.options[i < 12 ? score : 0].id] }));
test('all-zero and maximum scores, maxima, and deterministic raw-score ties', () => {
    const zero = calculate(catalog, answers(0));
    assert.deepEqual(zero.riasec, { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
    assert.deepEqual(zero.topCategories, ['A', 'C', 'E']);
    assert.match(zero.explanation, /neutral/);
    const max = calculate(catalog, answers());
    assert.deepEqual(max.riasec, { R: 6, I: 9, A: 6, S: 6, E: 6, C: 3 });
    assert.deepEqual(max.topCategories, ['I', 'A', 'E']);
    assert.equal(max.percentages.C, 100);
});
test('each core question contributes only to its configured category; mixed inputs', () => {
    for (let i = 0; i < 12; i++) {
        const a = answers(0);
        a[i].optionIds = [questions[i].options[3].id];
        const result = calculate(catalog, a);
        for (const c of codes)
            assert.equal(result.riasec[c], c === mapping[i] ? 3 : 0);
    }
    const a = answers(0);
    for (let i = 0; i < 12; i++)
        a[i].optionIds = [questions[i].options[i % 4].id];
    assert.deepEqual(calculate(catalog, a).riasec, { R: 2, I: 6, A: 5, S: 3, E: 1, C: 1 });
});
test('answers are deterministic; context does not alter core scores; ads cannot alter recommendations', () => {
    const a = answers();
    const before = calculate(catalog, a);
    assert.deepEqual(before, calculate(catalog, [...a].reverse()));
    a[12].optionIds = [questions[12].options[1].id];
    assert.deepEqual(calculate(catalog, a).riasec, before.riasec);
    assert.deepEqual(before.recommendations.map(r => r.category), ['I', 'A', 'E']);
    assert.equal('ads' in before, false);
});
test('reject missing, duplicate, unknown, and mismatched answers and multi-select violations', () => {
    assert.throws(() => validateAnswers(questions, answers().slice(1)));
    const duplicate = answers();
    duplicate[1] = duplicate[0];
    assert.throws(() => validateAnswers(questions, duplicate));
    for (const id of ['unknown', questions[1].options[0].id]) {
        const a = answers();
        a[0].optionIds = [id];
        assert.throws(() => validateAnswers(questions, a));
    }
    for (const n of [14, 16]) {
        const a = answers();
        a[n].optionIds = questions[n].options.slice(0, 3).map(o => o.id);
        assert.throws(() => validateAnswers(questions, a));
        a[n].optionIds = questions[n].options.slice(0, 2).map(o => o.id);
        assert.doesNotThrow(() => validateAnswers(questions, a));
        a[n].optionIds = [a[n].optionIds[0], a[n].optionIds[0]];
        assert.throws(() => validateAnswers(questions, a));
    }
    assert.equal(completeSchema.safeParse({ attemptId: 'invalid', answers: [] }).success, false);
});
test('missing configuration fails rather than inventing results', () => {
    assert.throws(() => calculate({ ...catalog, weights: [] }, answers()));
    assert.throws(() => calculate({ ...catalog, roles: [] }, answers()));
});
test('consent and contact validation', () => {
    const lead = { studentName: 'Demo', contactMethod: 'email', contactValue: 'demo@example.com', consent: true };
    assert.equal(leadSchema.safeParse(lead).success, true);
    for (const patch of [{ consent: false }, { contactValue: 'bad' }, { studentName: '' }, { contactMethod: 'fax' }])
        assert.equal(leadSchema.safeParse({ ...lead, ...patch }).success, false);
    assert.equal(leadSchema.safeParse({ ...lead, contactMethod: 'phone', contactValue: '+95 12345678' }).success, true);
});
test('events allow only frontend events and small explicit metadata; server success events cannot be forged', () => {
    assert.equal(eventSchema.safeParse({ eventName: 'explore_clicked', metadata: { screen: 'landing' } }).success, true);
    for (const eventName of ['unknown', 'quiz_started', 'quiz_completed', 'buy_interest', 'advisor_lead_submitted'])
        assert.equal(eventSchema.safeParse({ eventName }).success, false);
    assert.equal(eventSchema.safeParse({ eventName: 'results_viewed' }).success, false);
    assert.equal(eventSchema.safeParse({ eventName: 'explore_clicked', metadata: { email: 'private' } }).success, false);
});
test('ad category/date matching and external URL validation', () => {
    const base: Ad = { id: 'a', category_ids: ['I'], title: 'Demo', url: 'https://example.com', placement_key: 'options_footer', is_sponsored: true, is_demo: true, starts_at: null, ends_at: null };
    assert.equal(matchAds([base], ['I']).length, 1);
    assert.equal(matchAds([base], ['R']).length, 0);
    assert.equal(matchAds([{ ...base, ends_at: '2020-01-01' }], ['I']).length, 0);
    assert.equal(matchAds([{ ...base, starts_at: '2100-01-01' }], ['I']).length, 0);
    assert.equal(matchAds([base], ['I'])[0].label, 'Sponsored');
    for (const url of ['javascript:alert(1)', 'ftp://example.com', 'https://user:pass@example.com', 'bad'])
        assert.throws(() => validUrl(url));
    assert.equal(validUrl('https://example.com/demo'), 'https://example.com/demo');
});
test('canonical answers ignore JSONB key order and array order', () => {
    assert.deepEqual(canonicalAnswers([{ questionId: 'q2', optionIds: ['b', 'a'] }, { questionId: 'q1', optionIds: ['c'] }]), canonicalAnswers([{ optionIds: ['c'], questionId: 'q1' }, { optionIds: ['a', 'b'], questionId: 'q2' }]));
    assert.equal(JSON.stringify(canonicalAnswers([{ questionId: 'q1', optionIds: ['a'] }])), JSON.stringify(canonicalAnswers([{ optionIds: ['a'], questionId: 'q1' }])));
});
