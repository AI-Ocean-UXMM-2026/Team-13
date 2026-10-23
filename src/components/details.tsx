"use client";
import { useRef, useState } from "react";
import { ArrowRight, BookOpen, Check, Mail, UserRound } from "lucide-react";
import { z } from "zod";
import { api, track } from "@/lib/frontend/api";
import {
  advisorSchema,
  courseSchema,
  interestResponse,
  leadResponse,
  safeExternalUrl,
} from "@/lib/frontend/contracts";
import { leadSchema } from "@/lib/validation";
import { resourceView } from "@/lib/frontend/resource-view";
import { Back, ErrorState, Loading, PageIntro, useResource } from "./shared";
const courseEnvelope = z.object({ course: courseSchema });
const advisorEnvelope = z.object({ advisor: advisorSchema });
export function CourseDetail({
  courseId,
  attemptId,
}: {
  courseId: string;
  attemptId?: string;
}) {
  const { data, error, retry } = useResource(
    `/api/courses/${courseId}`,
    courseEnvelope,
  );
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Error>();
  const [url, setUrl] = useState<string>();
  const [recorded, setRecorded] = useState(false);
  const [demoRecorded, setDemoRecorded] = useState(false);
  const key = useRef<string>(undefined);
  const lock = useRef(false);
  async function record() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setFailure(undefined);
    key.current ??= crypto.randomUUID();
    void track({
      eventName: "course_clicked",
      attemptId,
      entityId: courseId,
      metadata: { screen: "next_action" },
    });
    try {
      const response = await api(
        `/api/courses/${courseId}/interest`,
        interestResponse,
        { body: attemptId ? { attemptId } : {}, key: key.current },
      );
      const safe = safeExternalUrl(response.url);
      if (!response.isDemo && safe) setUrl(safe);
      setDemoRecorded(response.isDemo);
      setRecorded(true);
    } catch (e) {
      setFailure(e as Error);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (error) return <ErrorState error={error} retry={retry} />;
  if (!data) return <Loading />;
  const course = resourceView(data.course);
  return (
    <section className="detail-layout">
      <div className="detail-content">
        <Back attemptId={attemptId} />
        <PageIntro eyebrow="A PLACE TO BEGIN" title={course.title} />

        <p className="detail-summary">{course.summary}</p>
        <dl className="facts">
          <div>
            <dt>Provider</dt>
            <dd>{course.provider}</dd>
          </div>
          <div>
            <dt>Price</dt>
            <dd>{course.price_label}</dd>
          </div>
          <div>
            <dt>Commitment</dt>
            <dd>Explore first. No registration here.</dd>
          </div>
        </dl>
        {course.is_demo && (
          <p className="notice">
            Example course · Fictional. You can record demo interest, but no
            enrollment, purchase, or real provider connection takes place.
          </p>
        )}
      </div>
      <aside className="action-card">
        <span className="big-symbol" aria-hidden>
          <BookOpen size={26} />
        </span>
        {recorded ? (
          <div role="status">
            <h2>Your interest has been recorded.</h2>
            {demoRecorded ? (
              <p>
                Your demo interest was saved. This fictional course has no
                provider registration, purchase, or enrollment.
              </p>
            ) : (
              <p>
                You can now continue to the provider. You’ll leave Wayfinder.
              </p>
            )}
            {!demoRecorded && url && (
              <a className="button primary full" href={url}>
                Continue to provider ↗
              </a>
            )}
            <Back attemptId={attemptId} />
          </div>
        ) : (
          <>
            <h2>Curious to learn more?</h2>
            <p>
              {course.is_demo
                ? "Try recording interest in this fictional example course."
                : course.url
                  ? "We’ll record your interest first, then offer a link to the provider."
                  : "This course has no provider link yet."}
            </p>
            <button
              className="button primary full"
              disabled={busy || (!course.is_demo && !course.url)}
              onClick={record}
            >
              {busy
                ? "Recording your interest…"
                : course.is_demo
                  ? "Record demo interest"
                  : "View course"}{" "}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <p className="fine-print">
              No payment, enrollment, or booking takes place here.
            </p>
          </>
        )}
        {failure && <ErrorState error={failure} retry={record} />}
      </aside>
    </section>
  );
}
export function AdvisorDetail({
  advisorId,
  attemptId,
}: {
  advisorId: string;
  attemptId?: string;
}) {
  const resource = useResource(`/api/advisors/${advisorId}`, advisorEnvelope);
  const [fields, setFields] = useState({
    studentName: "Example student",
    contactMethod: "email",
    contactValue: "student@example.com",
    consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Error>();
  const [success, setSuccess] = useState(false);
  const pending = useRef<{ hash: string; key: string }>(undefined);
  const lock = useRef(false);
  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (lock.current) return;
    const input = leadSchema.safeParse({
      ...fields,
      ...(attemptId ? { attemptId } : {}),
    });
    if (!input.success) {
      setErrors(
        Object.fromEntries(
          input.error.issues.map((i) => [
            String(i.path[0]),
            i.path[0] === "consent"
              ? "Please agree to store your contact details before submitting."
              : i.path[0] === "studentName"
                ? "Enter a name between 1 and 100 characters."
                : "Enter a valid email or phone number.",
          ]),
        ),
      );
      return;
    }
    const hash = JSON.stringify(input.data);
    if (pending.current?.hash !== hash)
      pending.current = { hash, key: crypto.randomUUID() };
    lock.current = true;
    setBusy(true);
    setFailure(undefined);
    setErrors({});
    try {
      await api(`/api/advisors/${advisorId}/leads`, leadResponse, {
        body: input.data,
        key: pending.current.key,
      });
      setFields({
        studentName: "",
        contactMethod: "email",
        contactValue: "",
        consent: false,
      });
      pending.current = undefined;
      setSuccess(true);
    } catch (e) {
      setFailure(e as Error);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.retry} />;
  if (!resource.data) return <Loading />;
  const advisor = resourceView(resource.data.advisor);
  return (
    <section className="detail-layout">
      <div className="detail-content">
        <Back attemptId={attemptId} />
        <span className="profile-avatar" aria-hidden="true">
          <UserRound size={34} />
        </span>
        <PageIntro eyebrow="A LITTLE PERSPECTIVE" title={advisor.name} />

        <p className="detail-summary">{advisor.specialty}</p>
        <p>{advisor.summary}</p>
        <div className="notice">
          <h2>About this profile</h2>
          <p>
            This is a fictional advisor profile. Submitted requests are stored
            in this app's database. No message is sent, no appointment is
            booked, and no response is promised. Use fictional contact details
            when trying it.
          </p>
        </div>
      </div>
      <section className="action-card">
        {success ? (
          <div role="status" className="confirmation">
            <span className="success-icon" aria-hidden>
              <Check size={27} />
            </span>
            <h2>Your request has been recorded.</h2>
            <p>
              No message was sent to an advisor and no appointment was booked.
            </p>
            <Back attemptId={attemptId} />
            <button className="text-link" onClick={() => setSuccess(false)}>
              Make a new request
            </button>
          </div>
        ) : (
          <>
            <span className="big-symbol" aria-hidden="true">
              <Mail size={26} />
            </span>
            <h2>Request contact</h2>
            <p className="muted">
              The form starts with fictional sample details. Keep contact
              details fictional. Requests are recorded without sending a
              message.
            </p>
            <form onSubmit={submit} noValidate>
              <fieldset disabled={busy}>
                <label htmlFor="studentName">Your name</label>
                <input
                  id="studentName"
                  name="studentName"
                  autoComplete="off"
                  maxLength={100}
                  value={fields.studentName}
                  onChange={(e) =>
                    setFields({ ...fields, studentName: e.target.value })
                  }
                  aria-invalid={!!errors.studentName}
                  aria-describedby={
                    errors.studentName ? "name-error" : undefined
                  }
                />
                {errors.studentName && (
                  <p className="field-error" id="name-error">
                    {errors.studentName}
                  </p>
                )}
                <label htmlFor="contactMethod">Contact method</label>
                <select
                  id="contactMethod"
                  value={fields.contactMethod}
                  onChange={(e) =>
                    setFields({
                      ...fields,
                      contactMethod: e.target.value,
                      contactValue: "",
                    })
                  }
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
                <label htmlFor="contactValue">
                  {fields.contactMethod === "email"
                    ? "Email address"
                    : "Phone number"}
                </label>
                <input
                  id="contactValue"
                  type={fields.contactMethod === "email" ? "email" : "tel"}
                  autoComplete="off"
                  maxLength={254}
                  value={fields.contactValue}
                  onChange={(e) =>
                    setFields({ ...fields, contactValue: e.target.value })
                  }
                  aria-invalid={!!errors.contactValue}
                  aria-describedby={
                    errors.contactValue ? "contact-error" : undefined
                  }
                />
                {errors.contactValue && (
                  <p className="field-error" id="contact-error">
                    {errors.contactValue}
                  </p>
                )}
                <label className="consent" htmlFor="consent">
                  <input
                    id="consent"
                    type="checkbox"
                    checked={fields.consent}
                    onChange={(e) =>
                      setFields({ ...fields, consent: e.target.checked })
                    }
                    aria-invalid={!!errors.consent}
                    aria-describedby={
                      errors.consent ? "consent-error" : undefined
                    }
                  />
                  <span>
                    I agree to store my contact details in this app's database.
                    No message will be sent to an advisor.
                  </span>
                </label>
                {errors.consent && (
                  <p className="field-error" id="consent-error">
                    {errors.consent}
                  </p>
                )}
                <button className="button primary full" type="submit">
                  {busy ? "Recording your request…" : "Submit request"}{" "}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </fieldset>
            </form>
            {failure && (
              <ErrorState error={failure} retry={() => void submit()} />
            )}
          </>
        )}
      </section>
    </section>
  );
}
