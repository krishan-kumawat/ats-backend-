const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is missing');
  }

  console.log('[Seed Salesforce] Connecting to PostgreSQL database...');
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // 1. Get or create Department "Salesforce Practice" / "Engineering"
  let dept = await prisma.department.findFirst({
    where: { name: 'Engineering', deletedAt: null },
  });
  if (!dept) {
    dept = await prisma.department.create({
      data: { name: 'Engineering', description: 'Engineering & Technology' },
    });
  }

  // 2. Get Admin user for ownership
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@ats.com' },
  });
  const ownerId = adminUser ? adminUser.id : null;

  // 3. Define the 5 Job Requisitions
  const jobDefinitions = [
    {
      title: 'Salesforce Technical Lead',
      budgetLimit: 160000,
      candidates: [
        {
          firstName: 'Aarav',
          lastName: 'Sharma',
          email: 'aarav.sharma@example.com',
          phone: '+1-555-0101',
          skills: ['LWC', 'Apex', 'Sales Cloud', 'Integrations', 'CI/CD'],
          stage: 'Interviewing',
          expectedSalary: 155000,
          proposedSalary: 158000,
          proposedEquity: 0.5,
          sourceTag: 'LinkedIn',
          technicalScore: 9,
          systemScore: 8,
          cultureScore: 9,
          pros: 'Deep Apex architecture experience, strong communication.',
          cons: 'High salary expectation.',
          recommendation: 'STRONG_HIRE',
        },
        {
          firstName: 'Priya',
          lastName: 'Patel',
          email: 'priya.patel@example.com',
          phone: '+1-555-0102',
          skills: ['Apex', 'Visualforce', 'Aura Components', 'REST APIs'],
          stage: 'Screening',
          expectedSalary: 145000,
          proposedSalary: 0,
          proposedEquity: 0,
          sourceTag: 'Referral',
          technicalScore: 7,
          systemScore: 7,
          cultureScore: 8,
          pros: 'Great problem solver, fast learner.',
          cons: 'Lacks recent LWC hands-on.',
          recommendation: 'HIRE',
        },
        {
          firstName: 'Michael',
          lastName: 'Chen',
          email: 'michael.chen@example.com',
          phone: '+1-555-0103',
          skills: ['Salesforce CPQ', 'Apex', 'Flow Builder', 'DevOps'],
          stage: 'Offer',
          expectedSalary: 160000,
          proposedSalary: 160000,
          proposedEquity: 1.0,
          sourceTag: 'Direct Apply',
          technicalScore: 9,
          systemScore: 9,
          cultureScore: 9,
          pros: 'Expert CPQ + Tech Lead skills.',
          cons: 'None.',
          recommendation: 'STRONG_HIRE',
          approvalStatus: 'PENDING',
        },
        {
          firstName: 'Sofia',
          lastName: 'Rodriguez',
          email: 'sofia.rodriguez@example.com',
          phone: '+1-555-0104',
          skills: ['LWC', 'Service Cloud', 'GraphQL', 'Salesforce DX'],
          stage: 'Applied',
          expectedSalary: 150000,
          proposedSalary: 0,
          proposedEquity: 0,
          sourceTag: 'Career Site',
          technicalScore: 0,
          systemScore: 0,
          cultureScore: 0,
          pros: '',
          cons: '',
          recommendation: '',
        },
      ],
    },
    {
      title: 'Salesforce Solution Architect',
      budgetLimit: 185000,
      candidates: [
        {
          firstName: 'David',
          lastName: 'Miller',
          email: 'david.miller@example.com',
          phone: '+1-555-0201',
          skills: ['Enterprise Architecture', 'Sales Cloud', 'Service Cloud', 'MuleSoft'],
          stage: 'Interviewing',
          expectedSalary: 180000,
          proposedSalary: 182000,
          proposedEquity: 1.2,
          sourceTag: 'Headhunter',
          technicalScore: 9,
          systemScore: 9,
          cultureScore: 8,
          pros: 'Outstanding architectural vision, MuleSoft certified.',
          cons: 'Wants remote-only.',
          recommendation: 'STRONG_HIRE',
        },
        {
          firstName: 'Neha',
          lastName: 'Gupta',
          email: 'neha.gupta@example.com',
          phone: '+1-555-0202',
          skills: ['Data Cloud', 'Salesforce Flow', 'System Integration', 'TOGAF'],
          stage: 'Screening',
          expectedSalary: 175000,
          proposedSalary: 0,
          proposedEquity: 0,
          sourceTag: 'LinkedIn',
          technicalScore: 8,
          systemScore: 8,
          cultureScore: 9,
          pros: 'Strong Data Cloud expertise.',
          cons: 'Needs more enterprise scale experience.',
          recommendation: 'HIRE',
        },
        {
          firstName: 'James',
          lastName: 'Wilson',
          email: 'james.wilson@example.com',
          phone: '+1-555-0203',
          skills: ['Salesforce Architecture', 'Apex', 'Security & Governance', 'Shield'],
          stage: 'Applied',
          expectedSalary: 170000,
          proposedSalary: 0,
          proposedEquity: 0,
          sourceTag: 'Indeed',
          technicalScore: 0,
          systemScore: 0,
          cultureScore: 0,
          pros: '',
          cons: '',
          recommendation: '',
        },
        {
          firstName: 'Elena',
          lastName: 'Rostova',
          email: 'elena.rostova@example.com',
          phone: '+1-555-0204',
          skills: ['Marketing Cloud', 'Sales Cloud', 'OmniStudio', 'Solution Design'],
          stage: 'Offer',
          expectedSalary: 185000,
          proposedSalary: 185000,
          proposedEquity: 1.5,
          sourceTag: 'Referral',
          technicalScore: 10,
          systemScore: 10,
          cultureScore: 10,
          pros: 'Flawless solution design, highly recommended.',
          cons: 'None.',
          recommendation: 'STRONG_HIRE',
          approvalStatus: 'APPROVED',
        },
      ],
    },
    {
      title: 'Salesforce Technical Architect',
      budgetLimit: 210000,
      candidates: [
        {
          firstName: 'Vikram',
          lastName: 'Singh',
          email: 'vikram.singh@example.com',
          phone: '+1-555-0301',
          skills: ['CTA Certification', 'Identity & Access', 'High Volume Data', 'Apex'],
          stage: 'Interviewing',
          expectedSalary: 205000,
          proposedSalary: 210000,
          proposedEquity: 2.0,
          sourceTag: 'Executive Search',
          technicalScore: 10,
          systemScore: 10,
          cultureScore: 9,
          pros: 'Certified Technical Architect (CTA), top 1% candidate.',
          cons: 'Expensive.',
          recommendation: 'STRONG_HIRE',
        },
        {
          firstName: 'Sarah',
          lastName: 'Jenkins',
          email: 'sarah.jenkins@example.com',
          phone: '+1-555-0302',
          skills: ['Integration Architecture', 'OAuth', 'SAML', 'Heroku', 'PostgreSQL'],
          stage: 'Screening',
          expectedSalary: 195000,
          proposedSalary: 0,
          proposedEquity: 0,
          sourceTag: 'LinkedIn',
          technicalScore: 8,
          systemScore: 9,
          cultureScore: 8,
          pros: 'Strong identity & integration domain knowledge.',
          cons: 'Lacks full CTA credential.',
          recommendation: 'HIRE',
        },
        {
          firstName: 'Rohan',
          lastName: 'Verma',
          email: 'rohan.verma@example.com',
          phone: '+1-555-0303',
          skills: ['Apex Governance', 'Async Processing', 'Big Objects', 'Platform Events'],
          stage: 'Applied',
          expectedSalary: 200000,
          proposedSalary: 0,
          proposedEquity: 0,
          sourceTag: 'Direct Apply',
          technicalScore: 0,
          systemScore: 0,
          cultureScore: 0,
          pros: '',
          cons: '',
          recommendation: '',
        },
        {
          firstName: 'Jessica',
          lastName: 'Taylor',
          email: 'jessica.taylor@example.com',
          phone: '+1-555-0304',
          skills: ['DevSecOps', 'CI/CD Pipelines', 'Apex', 'Event-Driven Architecture'],
          stage: 'Offer',
          expectedSalary: 205000,
          proposedSalary: 208000,
          proposedEquity: 1.8,
          sourceTag: 'Referral',
          technicalScore: 9,
          systemScore: 9,
          cultureScore: 10,
          pros: 'Exceptional technical depth and leadership skills.',
          cons: 'None.',
          recommendation: 'STRONG_HIRE',
          approvalStatus: 'PENDING',
        },
      ],
    },
    {
      title: 'Salesforce Business Analyst',
      budgetLimit: 120000,
      candidates: [
        {
          firstName: 'Ananya',
          lastName: 'Deshmukh',
          email: 'ananya.deshmukh@example.com',
          phone: '+1-555-0401',
          skills: ['Agile / Scrum', 'User Stories', 'Process Mapping', 'UAT', 'Jira'],
          stage: 'Interviewing',
          expectedSalary: 115000,
          proposedSalary: 118000,
          proposedEquity: 0.2,
          sourceTag: 'LinkedIn',
          technicalScore: 8,
          systemScore: 8,
          cultureScore: 9,
          pros: 'Articulate, clear user story writing, strong client-facing skills.',
          cons: 'Basic Salesforce admin knowledge.',
          recommendation: 'HIRE',
        },
        {
          firstName: 'Christopher',
          lastName: 'Lee',
          email: 'christopher.lee@example.com',
          phone: '+1-555-0402',
          skills: ['Requirements Gathering', 'Sales Cloud', 'Reports & Dashboards'],
          stage: 'Screening',
          expectedSalary: 110000,
          proposedSalary: 0,
          proposedEquity: 0,
          sourceTag: 'Indeed',
          technicalScore: 7,
          systemScore: 7,
          cultureScore: 8,
          pros: 'Solid BA fundamentals.',
          cons: 'New to complex multi-cloud environments.',
          recommendation: 'HIRE',
        },
        {
          firstName: 'Kavita',
          lastName: 'Nair',
          email: 'kavita.nair@example.com',
          phone: '+1-555-0403',
          skills: ['Business Process Modeling', 'Flows', 'Validation Rules', 'Lucidchart'],
          stage: 'Offer',
          expectedSalary: 120000,
          proposedSalary: 120000,
          proposedEquity: 0.3,
          sourceTag: 'Referral',
          technicalScore: 9,
          systemScore: 8,
          cultureScore: 9,
          pros: 'Great balance of business acumen and hands-on Salesforce admin skills.',
          cons: 'None.',
          recommendation: 'STRONG_HIRE',
          approvalStatus: 'APPROVED',
        },
        {
          firstName: 'Daniel',
          lastName: 'Martinez',
          email: 'daniel.martinez@example.com',
          phone: '+1-555-0404',
          skills: ['User Acceptance Testing', 'Change Management', 'Training', 'Visio'],
          stage: 'Applied',
          expectedSalary: 112000,
          proposedSalary: 0,
          proposedEquity: 0,
          sourceTag: 'Career Site',
          technicalScore: 0,
          systemScore: 0,
          cultureScore: 0,
          pros: '',
          cons: '',
          recommendation: '',
        },
      ],
    },
    {
      title: 'Salesforce Functional Consultant',
      budgetLimit: 135000,
      candidates: [
        {
          firstName: 'Siddharth',
          lastName: 'Joshi',
          email: 'siddharth.joshi@example.com',
          phone: '+1-555-0501',
          skills: ['Sales Cloud Consultant', 'Service Cloud Consultant', 'Flows', 'CPQ'],
          stage: 'Interviewing',
          expectedSalary: 130000,
          proposedSalary: 133000,
          proposedEquity: 0.3,
          sourceTag: 'Referral',
          technicalScore: 9,
          systemScore: 8,
          cultureScore: 9,
          pros: 'Dual certified consultant, excellent client communication.',
          cons: 'None.',
          recommendation: 'STRONG_HIRE',
        },
        {
          firstName: 'Emily',
          lastName: 'Watson',
          email: 'emily.watson@example.com',
          phone: '+1-555-0502',
          skills: ['Experience Cloud', 'Salesforce Admin', 'Permission Sets', 'Data Loader'],
          stage: 'Screening',
          expectedSalary: 125000,
          proposedSalary: 0,
          proposedEquity: 0,
          sourceTag: 'LinkedIn',
          technicalScore: 7,
          systemScore: 7,
          cultureScore: 8,
          pros: 'Experience Cloud specialist.',
          cons: 'Limited Service Cloud experience.',
          recommendation: 'HIRE',
        },
        {
          firstName: 'Manish',
          lastName: 'Kulkarni',
          email: 'manish.kulkarni@example.com',
          phone: '+1-555-0503',
          skills: ['Financial Services Cloud', 'OmniStudio', 'Business Rules Engine'],
          stage: 'Offer',
          expectedSalary: 135000,
          proposedSalary: 135000,
          proposedEquity: 0.5,
          sourceTag: 'Headhunter',
          technicalScore: 9,
          systemScore: 9,
          cultureScore: 9,
          pros: 'Financial Services Cloud expert, highly requested skill.',
          cons: 'None.',
          recommendation: 'STRONG_HIRE',
          approvalStatus: 'PENDING',
        },
        {
          firstName: 'Rachel',
          lastName: 'Adams',
          email: 'rachel.adams@example.com',
          phone: '+1-555-0504',
          skills: ['Nonprofit Cloud', 'NPSP', 'Reports & Dashboards', 'Workflows'],
          stage: 'Applied',
          expectedSalary: 128000,
          proposedSalary: 0,
          proposedEquity: 0,
          sourceTag: 'Direct Apply',
          technicalScore: 0,
          systemScore: 0,
          cultureScore: 0,
          pros: '',
          cons: '',
          recommendation: '',
        },
      ],
    },
  ];

  const stageToStatusMap = {
    Applied: 'Applied',
    Screening: 'Screening',
    Interviewing: 'Interviewing',
    Offer: 'Offered',
  };

  for (const jobDef of jobDefinitions) {
    console.log(`[Seed Salesforce] Processing Job: ${jobDef.title}...`);

    // Create or update Job Requisition
    let job = await prisma.job.findFirst({
      where: { title: jobDef.title, deletedAt: null },
    });

    if (!job) {
      job = await prisma.job.create({
        data: {
          title: jobDef.title,
          departmentId: dept.id,
          ownerId: ownerId,
          status: 'Open',
        },
      });
      console.log(`  -> Created Job ID: ${job.id}`);
    } else {
      job = await prisma.job.update({
        where: { id: job.id },
        data: { status: 'Open' },
      });
      console.log(`  -> Existing Job ID: ${job.id}`);
    }

    // Process 4 candidates per job
    for (const candDef of jobDef.candidates) {
      // Create or update Candidate profile
      let candidate = await prisma.candidate.findFirst({
        where: { email: candDef.email, deletedAt: null },
      });

      if (!candidate) {
        candidate = await prisma.candidate.create({
          data: {
            firstName: candDef.firstName,
            lastName: candDef.lastName,
            email: candDef.email,
            phone: candDef.phone,
            skills: candDef.skills,
            ownerId: ownerId,
          },
        });
        console.log(`     + Created Candidate: ${candDef.firstName} ${candDef.lastName}`);
      } else {
        candidate = await prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            skills: candDef.skills,
            phone: candDef.phone,
          },
        });
        console.log(`     = Existing Candidate: ${candDef.firstName} ${candDef.lastName}`);
      }

      // Link Candidate to Job with status, salaries, scores, and approvals
      const statusStr = stageToStatusMap[candDef.stage] || 'Applied';
      await prisma.candidateJob.upsert({
        where: {
          candidateId_jobId: {
            candidateId: candidate.id,
            jobId: job.id,
          },
        },
        update: {
          status: statusStr,
          expectedSalary: candDef.expectedSalary,
          proposedSalary: candDef.proposedSalary,
          proposedEquity: candDef.proposedEquity,
          sourceTag: candDef.sourceTag,
          technicalScore: candDef.technicalScore,
          systemScore: candDef.systemScore,
          cultureScore: candDef.cultureScore,
          pros: candDef.pros,
          cons: candDef.cons,
          recommendation: candDef.recommendation,
          approvalStatus: candDef.approvalStatus || 'NONE',
          deletedAt: null,
        },
        create: {
          candidateId: candidate.id,
          jobId: job.id,
          status: statusStr,
          expectedSalary: candDef.expectedSalary,
          proposedSalary: candDef.proposedSalary,
          proposedEquity: candDef.proposedEquity,
          sourceTag: candDef.sourceTag,
          technicalScore: candDef.technicalScore,
          systemScore: candDef.systemScore,
          cultureScore: candDef.cultureScore,
          pros: candDef.pros,
          cons: candDef.cons,
          recommendation: candDef.recommendation,
          approvalStatus: candDef.approvalStatus || 'NONE',
        },
      });
    }
  }

  await prisma.$disconnect();
  await pool.end();
  console.log('[Seed Salesforce] Successfully created all 5 Salesforce JRs and 20 candidate applications!');
}

main().catch((err) => {
  console.error('[Seed Salesforce] Error:', err);
  process.exit(1);
});
