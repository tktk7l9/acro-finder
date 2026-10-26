// CI gate for `npm audit`, with a reviewed allowlist (audit-allowlist.json).
// Fails on any advisory that is not allowlisted, on an allowlist entry past its expiry date,
// and on an allowlisted advisory that now has a fix available (time to update instead).
// An entry may set "devOnly": true; it then stops matching as soon as the package is reachable
// from production dependencies.
// Also fails closed when npm could not produce an audit report at all (registry outage, bad JSON):
// such a report has no `vulnerabilities` field, and treating it as "0 vulnerabilities" would let
// the gate pass exactly when it has checked nothing.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

function audit(args) {
  let stdout;
  try {
    stdout = execFileSync("npm", ["audit", "--json", ...args], { encoding: "utf8" });
  } catch (error) {
    // npm audit exits non-zero when it finds anything; the JSON is still on stdout.
    stdout = error.stdout;
  }
  const label = ["npm audit", ...args].join(" ");
  let report;
  try {
    report = JSON.parse(stdout);
  } catch {
    throw new Error(`${label} did not return JSON: ${String(stdout).slice(0, 300)}`);
  }
  if (report.error || typeof report.vulnerabilities !== "object" || report.vulnerabilities === null) {
    throw new Error(`${label} produced no report: ${report.message ?? JSON.stringify(report.error ?? report)}`);
  }
  return report;
}

const allowlist = JSON.parse(readFileSync(new URL("../audit-allowlist.json", import.meta.url), "utf8"));
const today = new Date().toISOString().slice(0, 10);
let all;
let prod;
try {
  all = audit([]);
  prod = audit(["--omit=dev"]);
} catch (error) {
  console.error(`FAIL     ${error.message}`);
  process.exit(1);
}

// GHSA ids per package, read from each vulnerability's advisory URLs.
const ghsaOf = (vuln) =>
  vuln.via.filter((v) => typeof v === "object").map((v) => v.url.split("/").pop());

const problems = [];
const allowed = [];
for (const [name, vuln] of Object.entries(all.vulnerabilities)) {
  const ids = ghsaOf(vuln);
  if (ids.length === 0) continue; // only transitively affected; reported under the source package
  for (const id of ids) {
    const entry = allowlist.find((e) => e.id === id && e.package === name);
    if (!entry) {
      problems.push(`${name}: ${id} (${vuln.severity}) is not allowlisted`);
    } else if (entry.expires < today) {
      problems.push(`${name}: allowlist entry for ${id} expired on ${entry.expires}; review it`);
    } else if (entry.devOnly && prod.vulnerabilities[name]) {
      problems.push(`${name}: ${id} is now reachable from production dependencies`);
    } else if (vuln.fixAvailable === true) {
      problems.push(`${name}: ${id} now has a fix available; run npm audit fix`);
    } else {
      allowed.push(`${name}: ${id} allowlisted until ${entry.expires} (${entry.reason})`);
    }
  }
}

for (const line of allowed) console.log(`allowed  ${line}`);
for (const line of problems) console.error(`FAIL     ${line}`);
if (problems.length > 0) process.exit(1);
console.log(`npm audit gate passed (${allowed.length} allowlisted)`);
