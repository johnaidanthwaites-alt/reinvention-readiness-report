import fs from "fs";
import path from "path";

const PROFILE_URL =
  "https://profile.goreinvent.com/?utm_source=email&utm_medium=report&utm_campaign=reinvention-readiness&utm_content=report-section5-cta";

function normaliseSvg(svgRaw: string): string {
  return svgRaw
    .replace(/(<svg[^>]*)\s+width="[^"]*"/, "$1")
    .replace(/(<svg[^>]*)\s+height="[^"]*"/, "$1");
}

function reportToHtml(reportText: string): string {
  const cleanText = reportText
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/£\s*\n+\s*([\d,]+)/g, "£$1")
    .replace(/([a-zA-Z])\n([a-zA-Z])/g, "$1$2")
    .replace(/([a-zA-Z])\n([a-zA-Z])/g, "$1$2");

  let html = cleanText
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  html = `<p>${html}</p>`;

  const sectionHeadings = [
    "Your Situation, As I Read It",
    "Why You Are Stuck",
    "Where Your Strengths Could Take You",
    "What Is Likely Holding You Back",
    "Your Next Practical Step",
    "A Final Word",
  ];

  for (const heading of sectionHeadings) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(
      new RegExp(
        `(<p>|<br>)((?:SECTION \\d+: )?(?:<strong>)?)(${escaped})((?:<\\/strong>)?)(</p>|<br>)`,
        "gi"
      ),
      `$1<h2 class="section-heading">$3</h2>$5`
    );
  }

  // Convert bare Profile URL to a clickable link that won't break across lines
  html = html.replace(
    /https:\/\/profile\.goreinvent\.com\/\?[^\s<"']*/g,
    `<a href="${PROFILE_URL}" style="color:#1a0dab;font-weight:600;word-break:break-all;">Begin your Reinvention Profile →</a>`
  );

  return html;
}

function buildPdfHtml(reportHtml: string, logoSvg: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bitter:wght@400;600;700&family=Raleway:wght@400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Raleway', sans-serif;
    font-size: 11pt;
    line-height: 1.7;
    color: #000;
    background: #fff;
  }

  .page {
    width: 794px;
    min-height: 1123px;
    padding: 40px 56px 48px 56px;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 18px;
    border-bottom: 2px solid #000;
    margin-bottom: 32px;
    gap: 24px;
  }

  .header-logo-wrap {
    flex: 0 0 140px;
    width: 140px;
    display: block;
    overflow: hidden;
  }

  .header-logo-wrap svg {
    display: block;
    width: 140px;
    height: auto;
  }

  .header-text {
    flex: 1 1 auto;
    text-align: right;
  }

  .header-title {
    font-family: 'Bitter', serif;
    font-size: 15pt;
    font-weight: 700;
    color: #000;
    line-height: 1.2;
    display: block;
  }

  .header-subtitle {
    font-family: 'Raleway', sans-serif;
    font-size: 9pt;
    color: #555;
    margin-top: 4px;
    display: block;
    letter-spacing: 0.02em;
  }

  .report-body {
    font-family: 'Raleway', sans-serif;
    font-size: 11pt;
    line-height: 1.75;
    color: #000;
  }

  .report-body p {
    margin-bottom: 14px;
  }

  h2.section-heading {
    font-family: 'Bitter', serif;
    font-size: 13pt;
    font-weight: 700;
    color: #000;
    margin-top: 28px;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid #000;
  }

  strong { font-weight: 600; }

  a { color: #1a0dab; text-decoration: underline; word-break: break-all; }

  .footer {
    margin-top: 40px;
    padding-top: 14px;
    border-top: 1px solid #ddd;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .footer-text {
    font-family: 'Raleway', sans-serif;
    font-size: 8pt;
    color: #999;
  }

  .footer-logo-wrap {
    flex: 0 0 64px;
    width: 64px;
    opacity: 0.45;
    overflow: hidden;
  }

  .footer-logo-wrap svg {
    display: block;
    width: 64px;
    height: auto;
  }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-logo-wrap">${logoSvg}</div>
    <div class="header-text">
      <span class="header-title">Your Reinvention Readiness Report</span>
      <span class="header-subtitle">GoReinvent &middot; start.goreinvent.com</span>
    </div>
  </div>

  <div class="report-body">
    ${reportHtml}
  </div>

  <div class="footer">
    <span class="footer-text">&copy; ${new Date().getFullYear()} GoReinvent &middot; goreinvent.com &middot; For educational purposes only. Not regulated careers or financial advice.</span>
    <div class="footer-logo-wrap">${logoSvg}</div>
  </div>

</div>
</body>
</html>`;
}

export async function generatePdf(reportText: string): Promise<Buffer> {
  const logoPath = path.join(process.cwd(), "public", "goreinvent-logo.svg");
  const logoSvg = normaliseSvg(fs.readFileSync(logoPath, "utf-8"));

  const reportHtml = reportToHtml(reportText);
  const fullHtml = buildPdfHtml(reportHtml, logoSvg);

  const isProduction = process.env.NODE_ENV === "production";

  let executablePath: string;
  let launchArgs: string[] = [];

  if (isProduction) {
    const chromium = (await import("@sparticuz/chromium")).default;
    executablePath = await chromium.executablePath();
    launchArgs = chromium.args;
  } else {
    executablePath =
      process.env.CHROMIUM_PATH ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    launchArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ];
  }

  const puppeteer = (await import("puppeteer-core")).default;
  const browser = await puppeteer.launch({
    args: launchArgs,
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
