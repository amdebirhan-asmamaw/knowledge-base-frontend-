#!/usr/bin/env node
/**
 * seed-documents.mjs
 * ------------------
 * Seeds the backend with all categories, sections, and documents
 * defined in lib/data.ts.
 *
 * Usage:
 *   node scripts/seed-documents.mjs
 *
 * Env vars (read from .env in project root, or set in shell):
 *   BACKEND_API_URL   – default: http://localhost:5000/api/v1
 *   SEED_ADMIN_EMAIL  – admin email to authenticate with
 *   SEED_ADMIN_PASS   – admin password
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ─── Load .env manually (no dotenv dependency required) ──────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");

try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env not found — rely on shell env vars
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_API_URL ||
  "http://localhost:5000/api/v1";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASS = process.env.SEED_ADMIN_PASS;

// ─── Seed data (mirrors lib/data.ts) ─────────────────────────────────────────

const seedData = [
  {
    name: "Procedures",
    sections: [
      {
        name: "Technology Dept",
        documents: [
          {
            title: "Project/Product Initiation Procedure",
            docId: "BM-TD-P-25-001",
            contentHtml: "<h1>Project/Product Initiation Procedure</h1><p>This procedure establishes the formal initiation process for all projects and products within Blih Technology Solutions.</p>",
            contentText: "Project/Product Initiation Procedure. This procedure establishes the formal initiation process for all projects and products within Blih Technology Solutions.",
          },
          {
            title: "Project/Product Planning Procedure",
            docId: "BM-TD-P-25-002",
            contentHtml: `<h1>Project/Product Planning Procedure</h1>
<h2>1. Purpose</h2>
<p>This procedure establishes a formal and standardized process for planning all approved projects and products within Blih Technology Solutions' Technology Department. Its purpose is to ensure that all technical, business, financial, and design aspects are meticulously documented, aligned, and prepared for efficient execution within an Agile development environment.</p>
<h2>2. Scope of Application</h2>
<p>This procedure applies to all technology-driven project and product planning activities that follow executive approval from the Project/Product Initiation Procedure (BM-TD-P-25-001). It covers all planning-related tasks and responsibilities prior to the formal commencement of the development (sprint execution) phase.</p>
<h2>3. Definition</h2>
<p>Key terms and definitions used throughout this procedure are standardized across the organization to ensure clarity and consistency in project planning activities.</p>
<h2>4. Responsibility</h2>
<p>Clear roles and responsibilities are defined for all stakeholders involved in the project planning process.</p>
<h2>5. Work flow</h2>
<p>The workflow section outlines the step-by-step process for planning projects and products.</p>
<h2>6. Generating records</h2>
<p>Documentation and record generation requirements are specified.</p>
<h2>7. Reference documents</h2>
<p>Reference documents section lists related procedural documentation.</p>
<h2>8. Relevant documents</h2>
<p>Relevant documents section contains supporting materials.</p>
<h2>9. Flow chart</h2>
<p>Visual representation of the project planning workflow.</p>`,
            contentText: "Project/Product Planning Procedure. Purpose: This procedure establishes a formal and standardized process for planning all approved projects and products.",
          },
        ],
      },
      {
        name: "People Management Dept",
        documents: [
          {
            title: "Promotion, Transfer and Demotion Criteria and Process Procedure",
            docId: "BM-PM-P-25-001",
            contentHtml: "<h1>Promotion, Transfer and Demotion Criteria and Process Procedure</h1><p>This procedure defines the criteria and process for employee promotions, transfers, and demotions within Blih Technology Solutions.</p>",
            contentText: "Promotion, Transfer and Demotion Criteria and Process Procedure.",
          },
          {
            title: "Meeting Conducting procedure",
            docId: "BM-PM-P-25-002",
            contentHtml: "<h1>Meeting Conducting Procedure</h1><p>This procedure outlines the standard process for conducting effective meetings across all departments.</p>",
            contentText: "Meeting Conducting Procedure.",
          },
          {
            title: "Training and knowledge procedure",
            docId: "BM-PM-P-25-003",
            contentHtml: "<h1>Training and Knowledge Procedure</h1><p>This procedure defines the process for employee training and knowledge management.</p>",
            contentText: "Training and Knowledge Procedure.",
          },
          {
            title: "Recruitment and selection procedure",
            docId: "BM-PM-P-25-004",
            contentHtml: "<h1>Recruitment and Selection Procedure</h1><p>This procedure establishes the standard process for recruiting and selecting new employees.</p>",
            contentText: "Recruitment and Selection Procedure.",
          },
        ],
      },
      {
        name: "Digital Dept",
        documents: [
          {
            title: "Digital Process 1",
            docId: "BM-DD-P-25-001",
            contentHtml: "<h1>Digital Process 1</h1><p>Digital department process documentation.</p>",
            contentText: "Digital Process 1.",
          },
          {
            title: "Digital Process 2",
            docId: "BM-DD-P-25-002",
            contentHtml: "<h1>Digital Process 2</h1><p>Digital department process documentation.</p>",
            contentText: "Digital Process 2.",
          },
          {
            title: "Digital Process 3",
            docId: "BM-DD-P-25-003",
            contentHtml: "<h1>Digital Process 3</h1><p>Digital department process documentation.</p>",
            contentText: "Digital Process 3.",
          },
        ],
      },
      {
        name: "Business Dev Dept",
        documents: [
          {
            title: "Business Process 1",
            docId: "BM-BD-P-25-001",
            contentHtml: "<h1>Business Process 1</h1><p>Business development process documentation.</p>",
            contentText: "Business Process 1.",
          },
          {
            title: "Business Process 2",
            docId: "BM-BD-P-25-002",
            contentHtml: "<h1>Business Process 2</h1><p>Business development process documentation.</p>",
            contentText: "Business Process 2.",
          },
          {
            title: "Business Process 3",
            docId: "BM-BD-P-25-003",
            contentHtml: "<h1>Business Process 3</h1><p>Business development process documentation.</p>",
            contentText: "Business Process 3.",
          },
          {
            title: "Business Process 4",
            docId: "BM-BD-P-25-004",
            contentHtml: "<h1>Business Process 4</h1><p>Business development process documentation.</p>",
            contentText: "Business Process 4.",
          },
        ],
      },
    ],
  },
  {
    name: "Job Descriptions",
    sections: [
      {
        name: "Business Dev Dept JD",
        documents: [
          {
            title: "Job Description of Business Development Officer",
            docId: "BM-BD-JD-001",
            contentHtml: "<h1>Job Description of Business Development Officer</h1><p>This document outlines the roles, responsibilities, and requirements for the Business Development Officer position.</p>",
            contentText: "Job Description of Business Development Officer.",
          },
          {
            title: "Job Description Of Account Manager",
            docId: "BM-BD-JD-002",
            contentHtml: "<h1>Job Description Of Account Manager</h1><p>This document outlines the roles, responsibilities, and requirements for the Account Manager position.</p>",
            contentText: "Job Description Of Account Manager.",
          },
          {
            title: "Function and Job Description Of Business Development Dept",
            docId: "BM-BD-JD-003",
            contentHtml: "<h1>Function and Job Description Of Business Development Dept</h1><p>This document outlines the overall function and job descriptions within the Business Development Department.</p>",
            contentText: "Function and Job Description Of Business Development Dept.",
          },
        ],
      },
      {
        name: "Finance Dept JD",
        documents: [
          {
            title: "Finance Job Description 1",
            docId: "BM-FIN-JD-001",
            contentHtml: "<h1>Finance Job Description 1</h1><p>Finance department job description documentation.</p>",
            contentText: "Finance Job Description 1.",
          },
          {
            title: "Finance Job Description 2",
            docId: "BM-FIN-JD-002",
            contentHtml: "<h1>Finance Job Description 2</h1><p>Finance department job description documentation.</p>",
            contentText: "Finance Job Description 2.",
          },
          {
            title: "Finance Job Description 3",
            docId: "BM-FIN-JD-003",
            contentHtml: "<h1>Finance Job Description 3</h1><p>Finance department job description documentation.</p>",
            contentText: "Finance Job Description 3.",
          },
        ],
      },
      {
        name: "Creative Dept JD",
        documents: [
          {
            title: "Creative Job Description 1",
            docId: "BM-CR-JD-001",
            contentHtml: "<h1>Creative Job Description 1</h1><p>Creative department job description documentation.</p>",
            contentText: "Creative Job Description 1.",
          },
        ],
      },
      {
        name: "Technology Dept JD",
        documents: [
          {
            title: "Technology Job Description 1",
            docId: "BM-TD-JD-001",
            contentHtml: "<h1>Technology Job Description 1</h1><p>Technology department job description documentation.</p>",
            contentText: "Technology Job Description 1.",
          },
        ],
      },
    ],
  },
  {
    name: "Company Overview",
    sections: [
      {
        name: "Mission Statement",
        documents: [
          {
            title: "Blih Mission",
            docId: "BM-CO-MS-001",
            contentHtml: "<h1>Blih Mission</h1><p>Blih Technology Solutions is committed to delivering innovative, high-quality technology solutions that drive growth, efficiency, and transformation for businesses across Ethiopia and beyond.</p>",
            contentText: "Blih Technology Solutions mission statement.",
          },
        ],
      },
      {
        name: "Vision Statement",
        documents: [
          {
            title: "Blih Vision",
            docId: "BM-CO-VS-001",
            contentHtml: "<h1>Blih Vision</h1><p>To be the leading technology solutions provider in East Africa, empowering organizations to achieve their full potential through cutting-edge digital innovation.</p>",
            contentText: "Blih Technology Solutions vision statement.",
          },
        ],
      },
      {
        name: "Core Values",
        documents: [
          {
            title: "Core Values",
            docId: "BM-CO-CV-001",
            contentHtml: "<h1>Core Values</h1><ul><li><strong>Innovation</strong> – Continuously seeking creative solutions</li><li><strong>Integrity</strong> – Operating with honesty and transparency</li><li><strong>Excellence</strong> – Delivering the highest quality in everything we do</li><li><strong>Collaboration</strong> – Working together to achieve shared goals</li><li><strong>Customer Focus</strong> – Placing client success at the center of our work</li></ul>",
            contentText: "Blih Technology Solutions core values: Innovation, Integrity, Excellence, Collaboration, Customer Focus.",
          },
        ],
      },
      {
        name: "Company Goals",
        documents: [
          {
            title: "Company Goals",
            docId: "BM-CO-CG-001",
            contentHtml: "<h1>Company Goals</h1><p>Blih Technology Solutions strategic goals for growth, innovation, and service excellence.</p>",
            contentText: "Blih Technology Solutions company goals.",
          },
        ],
      },
      {
        name: "Organizational Chart",
        documents: [
          {
            title: "Organizational Chart",
            docId: "BM-CO-OC-001",
            contentHtml: "<h1>Organizational Chart</h1><p>The organizational structure of Blih Technology Solutions, outlining reporting lines and departmental hierarchy.</p>",
            contentText: "Blih Technology Solutions organizational chart.",
          },
        ],
      },
    ],
  },
  {
    name: "Policies",
    sections: [
      {
        name: "Privacy Policy",
        documents: [
          {
            title: "Privacy Policy (for Lead Generation Form)",
            docId: "BM-POL-PP-001",
            contentHtml: "<h1>Privacy Policy (for Lead Generation Form)</h1><p>This privacy policy explains how Blih Technology Solutions collects, uses, and protects personal information submitted through our lead generation forms.</p><h2>Data Collection</h2><p>We collect only the information necessary to respond to your inquiry.</p><h2>Data Usage</h2><p>Your information will be used solely for the purpose of responding to your inquiry and improving our services.</p><h2>Data Protection</h2><p>We implement industry-standard security measures to protect your personal information.</p>",
            contentText: "Privacy Policy for Lead Generation Form. Data collection, usage, and protection policy.",
          },
        ],
      },
    ],
  },
];

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function request(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.message ?? json.error ?? `HTTP ${res.status}`;
    throw new Error(`${method} ${path} → ${res.status}: ${msg}`);
  }
  return json.data ?? json;
}

// ─── Main seeder ─────────────────────────────────────────────────────────────

async function login() {
  if (!ADMIN_EMAIL || !ADMIN_PASS) {
    throw new Error(
      "Missing credentials.\n" +
      "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASS in your .env or shell:\n" +
      "  SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASS=yourpass node scripts/seed-documents.mjs"
    );
  }

  console.log(`🔐 Logging in as ${ADMIN_EMAIL} …`);
  const data = await request("POST", "/auth/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
  });

  const token = data?.tokens?.accessToken ?? data?.accessToken;
  if (!token) throw new Error("Login succeeded but no accessToken in response.");

  console.log("✅ Authenticated\n");
  return token;
}

async function seed(token) {
  let totalCategories = 0;
  let totalSections = 0;
  let totalDocuments = 0;

  for (const catData of seedData) {
    // Create category
    console.log(`📁 Creating category: "${catData.name}"`);
    let category;
    try {
      category = await request("POST", "/docs/categories", { name: catData.name }, token);
    } catch (err) {
      console.warn(`   ⚠️  Skipped (${err.message})`);
      continue;
    }
    const categoryId = category._id ?? category.id;
    totalCategories++;

    for (const secData of catData.sections) {
      // Create section
      console.log(`  📂 Creating section: "${secData.name}"`);
      let section;
      try {
        section = await request(
          "POST",
          "/docs/sections",
          { categoryId, name: secData.name },
          token
        );
      } catch (err) {
        console.warn(`     ⚠️  Skipped (${err.message})`);
        continue;
      }
      const sectionId = section._id ?? section.id;
      totalSections++;

      for (const docData of secData.documents) {
        // Create document
        console.log(`    📄 Creating document: "${docData.title}"`);
        try {
          await request(
            "POST",
            "/docs/documents",
            {
              categoryId,
              sectionId,
              title: docData.title,
              docId: docData.docId,
              contentHtml: docData.contentHtml,
              contentText: docData.contentText,
            },
            token
          );
          totalDocuments++;
        } catch (err) {
          console.warn(`       ⚠️  Skipped (${err.message})`);
        }
      }
    }

    console.log("");
  }

  console.log("─".repeat(50));
  console.log(`✅ Seeding complete!`);
  console.log(`   Categories : ${totalCategories}`);
  console.log(`   Sections   : ${totalSections}`);
  console.log(`   Documents  : ${totalDocuments}`);
}

// ─── Entry point ─────────────────────────────────────────────────────────────

(async () => {
  console.log(`\n🌱 Blih Knowledge Base — Document Seeder`);
  console.log(`   Backend: ${BASE_URL}\n`);

  try {
    const token = await login();
    await seed(token);
  } catch (err) {
    console.error(`\n❌ Seeding failed: ${err.message}`);
    process.exit(1);
  }
})();
