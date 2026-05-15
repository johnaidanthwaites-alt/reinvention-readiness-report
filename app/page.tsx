"use client";

import Image from "next/image";
import { useState, FormEvent } from "react";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-bold text-[#0D0106] mt-10 mb-1 pb-2 border-b border-[#0D0106]/15">
      {children}
    </h2>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-[#0D0106] mb-1">
      {children}
    </label>
  );
}

function HelperText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-[#0D0106]/60 mb-2">{children}</p>;
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-[#FF331F] mt-1">{children}</p>;
}

function RadioGroup({ name, options, value, onChange, error }: {
  name: string; options: string[]; value: string;
  onChange: (v: string) => void; error?: string;
}) {
  return (
    <div className="flex flex-col gap-2 mt-1">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <label key={opt} className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${selected ? "bg-[#3626A7] border-[#3626A7] text-[#FBFBFF]" : "bg-[#FBFBFF] border-[#0D0106]/15 text-[#0D0106] hover:border-[#3626A7]"}`}>
            <input type="radio" name={name} value={opt} checked={selected} onChange={() => onChange(opt)} className="sr-only" />
            <span className={`mt-0.5 flex-shrink-0 w-4 h-4 border-2 flex items-center justify-center ${selected ? "border-[#FBFBFF]" : "border-[#0D0106]/30"}`}>
              {selected && <span className="w-2 h-2 bg-[#FBFBFF] block" />}
            </span>
            <span className="text-sm leading-snug">{opt}</span>
          </label>
        );
      })}
      {error && <ErrorMsg>{error}</ErrorMsg>}
    </div>
  );
}

function TextInput({ id, type = "text", placeholder, value, onChange, error }: {
  id: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void; error?: string;
}) {
  return (
    <>
      <input id={id} type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border px-3 py-2 text-sm text-[#0D0106] bg-[#FBFBFF] focus:outline-none focus:border-[#3626A7] transition-colors ${error ? "border-[#FF331F]" : "border-[#0D0106]/20"}`}
      />
      {error && <ErrorMsg>{error}</ErrorMsg>}
    </>
  );
}

function TextArea({ id, placeholder, value, onChange, error }: {
  id: string; placeholder?: string;
  value: string; onChange: (v: string) => void; error?: string;
}) {
  return (
    <>
      <textarea id={id} placeholder={placeholder} value={value} rows={3}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border px-3 py-2 text-sm text-[#0D0106] bg-[#FBFBFF] focus:outline-none focus:border-[#3626A7] transition-colors resize-y ${error ? "border-[#FF331F]" : "border-[#0D0106]/20"}`}
      />
      {error && <ErrorMsg>{error}</ErrorMsg>}
    </>
  );
}


const AGE_OPTIONS = [
  "Under 40",
  "40–44",
  "45–49",
  "50–54",
  "55–59",
  "60–64",
  "65 or over",
];

const SITUATION_OPTIONS = [
  "Employed but worried about job security or redundancy",
  "Actively job hunting but struggling to get hired",
  "Recently made redundant",
  "Self-employed or contractor: income is declining",
  "Business owner: growth has stalled or the model isn't working",
  "Approaching retirement but concerned about income",
];

const CONCERN_OPTIONS = [
  "Losing my income",
  "Finding work despite my age",
  "Building income I control",
  "Funding retirement",
  "Getting out of burnout",
  "I'm not sure. I just know something needs to change",
];

const RUNWAY_OPTIONS = [
  "Less than 3 months",
  "3–6 months",
  "6–12 months",
  "12 months or more",
];

const WORKSTYLE_OPTIONS = [
  "Working directly with individual clients one-to-one",
  "Teaching or training groups",
  "Writing or creating content, sharing expertise",
  "Delivering projects with defined outcomes",
  "I'm open: whatever fits my skills and situation",
];

const INITIAL_FORM = {
  "f-situation": "",
  "f-concern": "",
  "f-background": "",
  "f-skills": "",
  "f-interests": "",
  "f-runway": "",
  "f-blocker": "",
  "f-vision": "",
  "f-workstyle": "",
  "f-age": "",
  "f-name": "",
  "f-email": "",
};

type FieldKey = keyof typeof INITIAL_FORM;

export default function Home() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function setField(key: FieldKey, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<FieldKey, string>> = {};

    const radioRequired: FieldKey[] = ["f-situation", "f-concern", "f-runway", "f-age"];
    for (const f of radioRequired) {
      if (!form[f]) newErrors[f] = "Please select an option.";
    }

    const textRequired: FieldKey[] = ["f-background", "f-skills", "f-interests", "f-blocker", "f-vision"];
    for (const f of textRequired) {
      if (!form[f].trim()) newErrors[f] = "Please complete this field.";
    }

    if (!form["f-name"].trim()) newErrors["f-name"] = "Please enter your first name.";
    if (!form["f-email"].trim()) {
      newErrors["f-email"] = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form["f-email"])) {
      newErrors["f-email"] = "Please enter a valid email address.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch { /* redirect regardless */ }
    window.location.href = `/thank-you?name=${encodeURIComponent(form["f-name"])}`;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFF]">
      <header className="border-b border-[#0D0106]/10 px-4 py-4 flex justify-center">
        <Image src="/goreinvent-logo.svg" alt="GoReinvent" width={160} height={67} priority />
      </header>

      <div className="bg-[#0D0106] text-[#FBFBFF] px-4 py-10 text-center">
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl sm:text-3xl font-bold mb-3">
          Your Reinvention Readiness Report
        </h1>
        <p className="text-base text-[#FBFBFF]/75 max-w-xl mx-auto">
          Answer 9 questions and receive a personalised report on your options, based on your situation, your skills, and where you want to go.
        </p>
      </div>

      <main className="flex-1 px-4 py-10 max-w-2xl mx-auto w-full">
        <form onSubmit={handleSubmit} noValidate className="space-y-8">

          {/* SECTION A */}
          <SectionHeading>Section A: Your Situation</SectionHeading>

          <div>
            <FieldLabel htmlFor="f-situation">1. Where are you right now?</FieldLabel>
            <RadioGroup
              name="f-situation"
              options={SITUATION_OPTIONS}
              value={form["f-situation"]}
              onChange={(v) => setField("f-situation", v)}
              error={errors["f-situation"]}
            />
          </div>

          <div>
            <FieldLabel htmlFor="f-concern">2. What is your biggest concern right now?</FieldLabel>
            <RadioGroup
              name="f-concern"
              options={CONCERN_OPTIONS}
              value={form["f-concern"]}
              onChange={(v) => setField("f-concern", v)}
              error={errors["f-concern"]}
            />
          </div>

          {/* SECTION B */}
          <SectionHeading>Section B: Your Background</SectionHeading>

          <div>
            <FieldLabel htmlFor="f-background">3. Your career background</FieldLabel>
            <HelperText>Briefly describe your career background: what have you done, what industry or sector? A sentence or two is enough.</HelperText>
            <TextArea
              id="f-background"
              placeholder="e.g. 20 years in financial services, latterly as a regional operations director..."
              value={form["f-background"]}
              onChange={(v) => setField("f-background", v)}
              error={errors["f-background"]}
            />
          </div>

          <div>
            <FieldLabel htmlFor="f-skills">4. Your skills and strengths</FieldLabel>
            <HelperText>What are you particularly good at? What do others come to you for? Include specific skills and qualities like leadership, problem-solving, or communication.</HelperText>
            <TextArea
              id="f-skills"
              placeholder="e.g. Building and leading teams, translating complex data into clear decisions, client relationships..."
              value={form["f-skills"]}
              onChange={(v) => setField("f-skills", v)}
              error={errors["f-skills"]}
            />
          </div>

          <div>
            <FieldLabel htmlFor="f-interests">5. What genuinely interests or energises you?</FieldLabel>
            <HelperText>What subjects, activities, or types of people do you find yourself drawn to, at work or outside it? What gives you energy rather than drains it?</HelperText>
            <TextArea
              id="f-interests"
              placeholder="e.g. Mentoring younger professionals, anything to do with sustainable business, endurance sport, writing..."
              value={form["f-interests"]}
              onChange={(v) => setField("f-interests", v)}
              error={errors["f-interests"]}
            />
          </div>

          {/* SECTION C */}
          <SectionHeading>Section C: Your Position</SectionHeading>

          <div>
            <FieldLabel htmlFor="f-runway">6. If your income stopped tomorrow, roughly how long could you manage financially without major changes?</FieldLabel>
            <RadioGroup
              name="f-runway"
              options={RUNWAY_OPTIONS}
              value={form["f-runway"]}
              onChange={(v) => setField("f-runway", v)}
              error={errors["f-runway"]}
            />
          </div>

          <div>
            <FieldLabel htmlFor="f-blocker">7. What has stopped you making a move so far?</FieldLabel>
            <HelperText>Be honest. This is for your report only.</HelperText>
            <TextArea
              id="f-blocker"
              placeholder="e.g. I don't know what I'd offer or who'd pay for it. I worry I'm too old to start something new..."
              value={form["f-blocker"]}
              onChange={(v) => setField("f-blocker", v)}
              error={errors["f-blocker"]}
            />
          </div>

          {/* SECTION D */}
          <SectionHeading>Section D: Your Vision</SectionHeading>

          <div>
            <FieldLabel htmlFor="f-vision">8. If things went well over the next 2 years, what would your work and income look like?</FieldLabel>
            <HelperText>There are no wrong answers here.</HelperText>
            <TextArea
              id="f-vision"
              placeholder="e.g. Working with a small number of clients on my own terms, income equivalent to what I was earning, no commute..."
              value={form["f-vision"]}
              onChange={(v) => setField("f-vision", v)}
              error={errors["f-vision"]}
            />
          </div>

          <div>
            <FieldLabel htmlFor="f-workstyle">9. Which of these feels closest to how you would prefer to work? <span className="font-normal text-[#0D0106]/50">(optional)</span></FieldLabel>
            <RadioGroup
              name="f-workstyle"
              options={WORKSTYLE_OPTIONS}
              value={form["f-workstyle"]}
              onChange={(v) => setField("f-workstyle", v)}
              error={errors["f-workstyle"]}
            />
          </div>

          {/* SECTION E */}
          <SectionHeading>Section E: Your Report</SectionHeading>

          <p className="text-sm text-[#0D0106]/60">
            Almost there. Where should we send your Reinvention Readiness Report? We will email you a personalised copy within 10 minutes.
          </p>

          <div>
            <FieldLabel htmlFor="f-name">First name</FieldLabel>
            <TextInput
              id="f-name"
              placeholder="Your first name"
              value={form["f-name"]}
              onChange={(v) => setField("f-name", v)}
              error={errors["f-name"]}
            />
          </div>

          <div>
            <FieldLabel htmlFor="f-age">Your age</FieldLabel>
            <RadioGroup
              name="f-age"
              options={AGE_OPTIONS}
              value={form["f-age"]}
              onChange={(v) => setField("f-age", v)}
              error={errors["f-age"]}
            />
          </div>

          <div>
            <FieldLabel htmlFor="f-email">Email address</FieldLabel>
            <TextInput
              id="f-email"
              type="email"
              placeholder="your@email.com"
              value={form["f-email"]}
              onChange={(v) => setField("f-email", v)}
              error={errors["f-email"]}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#3626A7] text-[#FBFBFF] font-semibold py-3 px-6 hover:bg-[#3626A7]/85 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
            >
              {submitting ? "Sending your answers..." : "Send My Reinvention Readiness Report"}
            </button>
            <p className="text-xs text-[#0D0106]/50 text-center mt-3">
              Your report will arrive by email within 10 minutes. We will also add you to the GoReinvent mailing list. You can unsubscribe at any time.
            </p>
          </div>

        </form>
      </main>

      <footer className="border-t border-[#0D0106]/10 px-4 py-6 text-center">
        <p className="text-xs text-[#0D0106]/50">
          &copy; {new Date().getFullYear()} GoReinvent &middot; goreinvent.com &middot; This assessment is for educational purposes only and does not constitute regulated careers or financial advice.
        </p>
      </footer>
    </div>
  );
}
