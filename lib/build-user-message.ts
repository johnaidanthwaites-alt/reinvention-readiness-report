export type FormData = {
  "f-name": string;
  "f-email": string;
  "f-age": string;
  "f-situation": string;
  "f-concern": string;
  "f-background": string;
  "f-skills": string;
  "f-interests": string;
  "f-runway": string;
  "f-blocker": string;
  "f-vision": string;
  "f-workstyle": string;
};

export function buildUserMessage(form: FormData): string {
  return `Name: ${form["f-name"]}
Age: ${form["f-age"]}

Current situation: ${form["f-situation"]}
Biggest concern: ${form["f-concern"]}

Professional background: ${form["f-background"]}
Skills and strengths: ${form["f-skills"]}
Interests and what gives them energy: ${form["f-interests"]}

Financial runway: ${form["f-runway"]}
What has held them back: ${form["f-blocker"]}

What a good outcome looks like: ${form["f-vision"]}
Preferred way of working: ${form["f-workstyle"] || "not specified"}

Please generate the Reinvention Readiness Report for this person following the full report structure in your instructions.`;
}
