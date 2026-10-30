/**
 * Ezzy Fitness — demo data seed (idempotent, Neon free-tier friendly).
 *   npm run db:seed
 * Core records upsert; volume data (payments/attendance) is only written once.
 */
import pg from "pg";
import { createHash, randomBytes, scryptSync } from "node:crypto";
import { dbConfig } from "./lib/env.mjs";

const { Pool } = pg;
const pool = new Pool(dbConfig());

/* Mirror of src/lib/auth.ts password scheme (scrypt$salt$hash). */
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

const PW = {
  admin: "Admin@123",
  trainer: "Trainer@123",
  frontdesk: "Frontdesk@123",
  member: "Member@123",
};

const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return iso(d);
};
const daysAhead = (n) => daysAgo(-n);

/* ------------------------------- data ------------------------------- */

const PLANS = [
  {
    name: "Day Pass",
    tagline: "One great session, no strings",
    price: 3000,
    days: 1,
    features: ["Full floor access", "Locker + shower", "Valid for one day"],
    sort: 1,
  },
  {
    name: "Monthly Starter",
    tagline: "Build the habit",
    price: 25000,
    days: 30,
    features: [
      "Unlimited gym floor",
      "All group classes",
      "Free fitness assessment",
      "Locker access",
    ],
    sort: 2,
  },
  {
    name: "Quarterly Pro",
    tagline: "Real momentum",
    price: 65000,
    days: 90,
    popular: true,
    features: [
      "Everything in Monthly",
      "2 PT sessions / month",
      "InBody body composition scan",
      "Nutrition starter plan",
      "Guest pass ×2",
    ],
    sort: 3,
  },
  {
    name: "Annual Elite",
    tagline: "The transformation year",
    price: 220000,
    days: 365,
    features: [
      "Everything in Quarterly",
      "8 PT sessions / quarter",
      "Monthly InBody scans",
      "Priority class booking",
      "Guest pass ×10",
    ],
    sort: 4,
  },
  {
    name: "VIP Unlimited",
    tagline: "Coach-led, all in",
    price: 95000,
    days: 30,
    features: [
      "Unlimited 1-on-1 coaching",
      "Personal programming",
      "Recovery + sauna",
      "WhatsApp coach support",
      "Meal plan reviews",
    ],
    sort: 5,
  },
];

const STAFF = [
  {
    name: "Ezra Okpako",
    email: "admin@ezzyfitness.ng",
    phone: "+2348000000000",
    role: "admin",
    pw: PW.admin,
  },
  {
    name: "Tunde Bakare",
    email: "tunde@ezzyfitness.ng",
    phone: "+2348031112233",
    role: "trainer",
    pw: PW.trainer,
    bio: "Strength & conditioning specialist with a passion for progressive overload. Tunde turns beginners into lifters and lifters into athletes — with form that stays clean under load.",
    specialties: ["Strength", "HIIT", "Powerlifting"],
    certifications: ["NASM-CPT", "CrossFit L2"],
    years: 8,
    instagram: "@tunde.lifts",
    sort: 1,
  },
  {
    name: "Precious Okoro",
    email: "precious@ezzyfitness.ng",
    phone: "+2348034445566",
    role: "trainer",
    pw: PW.trainer,
    bio: "Precision-focused sculpting coach. Precious programs every rep around your body type and goal, and her sessions are the most requested in the studio.",
    specialties: ["Sculpt", "Glutes", "Mobility"],
    certifications: ["ACE-CPT", "Female Health Specialist"],
    years: 6,
    instagram: "@precious.sculpts",
    sort: 2,
  },
  {
    name: "Chiamaka Eze",
    email: "chiamaka@ezzyfitness.ng",
    phone: "+2348057778899",
    role: "trainer",
    pw: PW.trainer,
    bio: "Mind-body coach blending yoga, Pilates and mobility work so you move as well as you look. Ideal if you sit at a desk all day.",
    specialties: ["Yoga", "Pilates", "Mobility"],
    certifications: ["RYT-500", "Mat Pilates Level 2"],
    years: 7,
    instagram: "@chiamaka.flows",
    sort: 3,
  },
  {
    name: "Kelvin Iwere",
    email: "kelvin@ezzyfitness.ng",
    phone: "+2348062223344",
    role: "trainer",
    pw: PW.trainer,
    bio: "Ex-amateur boxer who coaches conditioning like a fight camp: sharp, fast and honest. Bring water — you'll need it.",
    specialties: ["Boxing", "Conditioning", "Bootcamp"],
    certifications: ["ISSA-CPT", "Boxing Level 1 Coach"],
    years: 5,
    instagram: "@kelvin.combats",
    sort: 4,
  },
  {
    name: "Adaeze Nwosu",
    email: "frontdesk@ezzyfitness.ng",
    phone: "+2348075556677",
    role: "frontdesk",
    pw: PW.frontdesk,
  },
];

const MEMBER_NAMES = [
  ["Osemudiamen Idahosa", "male"],
  ["Blessing Agho", "female"],
  ["Osaze Omon", "male"],
  ["Ngozi Ehinmokhai", "female"],
  ["Ighodalo Eweka", "male"],
  ["Amaka Obasogie", "female"],
  ["Endurance Ogiemwonyi", "male"],
  ["Tomisin Adeyemi", "female"],
  ["Uche Obaze", "male"],
  ["Faith Obaseki", "female"],
  ["Ekene Ugwu", "male"],
  ["Rita Ogbeide", "female"],
];

const GOALS = [
  "Lose 8kg and keep it off",
  "Train for a first 10K",
  "Build lean muscle",
  "Lower blood pressure",
  "Post-injury comeback",
  "Prepare for wedding season",
  "Get stronger, sit less",
  "Improve stamina for football",
];

const CLASSES = [
  ["HIIT Blast", "HIIT", 1, "06:00", "06:45", "High", "Main Floor", 20, "45-minute intervals that torch calories and build engine."],
  ["Sculpt & Strength", "Strength", 1, "18:00", "19:00", "Medium", "Main Floor", 16, "Dumbbell-led hypertrophy circuits for shape and posture."],
  ["Yoga Flow", "Mind & Body", 2, "07:00", "08:00", "Low", "Studio A", 18, "Breath-led vinyasa to start the day unknotted."],
  ["Boxing Conditioning", "Combat", 2, "19:00", "20:00", "High", "Ring Zone", 14, "Pad work, footwork and cardio without getting hit."],
  ["Cardio Rush", "Cardio", 3, "06:00", "06:45", "High", "Cardio Deck", 24, "Rower, bike and treadmill intervals in one class."],
  ["Booty & Core", "Sculpt", 3, "18:30", "19:30", "Medium", "Studio B", 18, "Glute activation plus deep core stability work."],
  ["Functional Circuit", "Functional", 4, "07:00", "07:50", "High", "Main Floor", 20, "Kettlebells, sleds and carries for real-world strength."],
  ["Zumba Dance Party", "Dance", 4, "18:00", "19:00", "Medium", "Studio A", 26, "Afrobeats-fuelled dance cardio. Zero judgement."],
  ["Power Hour", "Strength", 5, "06:00", "07:00", "High", "Platform Zone", 12, "Barbell compounds with coached technique."],
  ["Stretch & Recover", "Mind & Body", 5, "17:30", "18:15", "Low", "Studio B", 20, "Guided stretching to undo the work week."],
  ["Weekend Warrior Bootcamp", "Bootcamp", 6, "08:00", "09:00", "High", "Outdoor Turf", 28, "Team-based outdoor conditioning, rain or shine."],
  ["Pilates Core", "Mind & Body", 6, "10:00", "10:45", "Low", "Studio A", 16, "Mat Pilates for a spine that behaves."],
  ["Mobility Reset", "Mind & Body", 0, "16:00", "16:45", "Low", "Studio B", 18, "Joints, hips and shoulders — reset for Monday."],
];

/* ------------------------------- run ------------------------------- */

async function seed() {
  const c = await pool.connect();
  try {
    console.log("\n  Ezzy Fitness → seeding Neon\n  ------------------------------");

    /* plans (upsert by name) */
    const planIds = {};
    for (const p of PLANS) {
      const r = await c.query(
        `INSERT INTO plans (name, tagline, price_ngn, duration_days, features, is_popular, sort_order)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [p.name, p.tagline, p.price, p.days, JSON.stringify(p.features), !!p.popular, p.sort]
      );
      if (r.rowCount) planIds[p.name] = r.rows[0].id;
      else {
        const found = await c.query(`SELECT id FROM plans WHERE name = $1`, [p.name]);
        planIds[p.name] = found.rows[0]?.id;
      }
    }
    console.log(`  ✓ ${PLANS.length} membership plans`);

    /* users (upsert by email) */
    const ids = {};
    const upsertUser = async ({ name, email, phone, role, pw, status = "active" }) => {
      const r = await c.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role, status)
         VALUES ($1, lower($2), $3, $4, $5, $6)
         ON CONFLICT (lower(email)) DO UPDATE
           SET full_name = EXCLUDED.full_name, role = EXCLUDED.role
         RETURNING id`,
        [name, email, phone, hashPassword(pw), role, status]
      );
      ids[email] = r.rows[0].id;
      return r.rows[0].id;
    };

    for (const s of STAFF) {
      const id = await upsertUser({
        name: s.name,
        email: s.email,
        phone: s.phone,
        role: s.role,
        pw: s.pw,
      });
      if (s.role === "trainer") {
        await c.query(
          `INSERT INTO trainers (user_id, bio, specialties, certifications, experience_years, instagram, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (user_id) DO UPDATE SET bio = EXCLUDED.bio, specialties = EXCLUDED.specialties,
             certifications = EXCLUDED.certifications, experience_years = EXCLUDED.experience_years,
             sort_order = EXCLUDED.sort_order`,
          [id, s.bio, s.specialties, s.certifications, s.years, s.instagram, s.sort]
        );
      }
    }
    console.log(`  ✓ ${STAFF.length} staff accounts (1 admin, 4 trainers, 1 front desk)`);

    /* members */
    const memberPlan = [
      "Quarterly Pro", "Monthly Starter", "Annual Elite", "Monthly Starter",
      "Quarterly Pro", "Monthly Starter", "VIP Unlimited", "Quarterly Pro",
      "Monthly Starter", "Annual Elite", "Monthly Starter", "Quarterly Pro",
    ];
    const memberIds = [];
    for (let i = 0; i < MEMBER_NAMES.length; i++) {
      const [name, gender] = MEMBER_NAMES[i];
      const email = `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@mail.com`;
      const id = await upsertUser({
        name,
        email,
        phone: `+23480${(30000000 + i * 111111).toString().slice(0, 8)}`,
        role: "member",
        pw: i === 0 ? PW.member : randomBytes(9).toString("base64url"),
      });
      memberIds.push(id);

      const planName = memberPlan[i];
      const plan = PLANS.find((p) => p.name === planName);
      // Two members deliberately expired so the dashboard shows renewal urgency.
      const expired = i === 4 || i === 9;
      const joinedAgo = 40 + i * 17;
      const expiresAt = expired ? daysAgo(3 + i) : daysAhead(plan.days - ((i * 5) % plan.days));
      const status = expired ? "expired" : "active";

      await c.query(
        `INSERT INTO members (user_id, membership_no, plan_id, gender, date_of_birth, goals,
                              emergency_name, emergency_phone, weight_kg, height_cm, status,
                              joined_at, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (user_id) DO UPDATE SET plan_id = EXCLUDED.plan_id, status = EXCLUDED.status,
           expires_at = EXCLUDED.expires_at`,
        [
          id,
          `EZ${(1001 + i).toString()}`,
          planIds[planName],
          gender,
          `${1985 + ((i * 3) % 15)}-0${1 + (i % 9)}-1${i % 9}`,
          GOALS[i % GOALS.length],
          ["Mrs. Idahosa", "Mr. Agho", "Mrs. Omon", "Mr. Ehinmokhai"][i % 4],
          `+23480${(60000000 + i * 222222).toString().slice(0, 8)}`,
          (58 + ((i * 7) % 38)).toFixed(1),
          (152 + ((i * 5) % 36)).toFixed(1),
          status,
          daysAgo(joinedAgo),
          expiresAt,
        ]
      );
    }
    console.log(`  ✓ ${MEMBER_NAMES.length} members with plans & profiles`);

    /* classes (skip when already present) */
    let classCount = (await c.query(`SELECT count(*)::int AS n FROM classes`)).rows[0].n;
    if (classCount === 0) {
      for (const [name, cat, dow, start, end, intensity, location, cap, desc] of CLASSES) {
        const trainerPool = STAFF.filter((s) => s.role === "trainer");
        const trainer = trainerPool[classCount % trainerPool.length];
        await c.query(
          `INSERT INTO classes (name, category, description, trainer_id, day_of_week, start_time,
                                end_time, capacity, location, intensity)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [name, cat, desc, ids[trainer.email], dow, start, end, cap, location, intensity]
        );
        classCount++;
      }
      console.log(`  ✓ ${CLASSES.length} weekly classes`);
    } else {
      console.log(`  ✓ classes already present (${classCount}) — skipped`);
    }

    /* payments — only when empty (keeps re-runs free of duplicates) */
    const payCount = (await c.query(`SELECT count(*)::int AS n FROM payments`)).rows[0].n;
    if (payCount === 0) {
      const methods = ["cash", "transfer", "pos", "transfer", "cash"];
      let inserted = 0;
      for (let i = 0; i < memberIds.length; i++) {
        const mid = memberIds[i];
        const mem = await c.query(
          `SELECT m.plan_id, m.joined_at, m.expires_at, p.price_ngn, p.duration_days, p.name
             FROM members m LEFT JOIN plans p ON p.id = m.plan_id WHERE m.user_id = $1`,
          [mid]
        );
        const row = mem.rows[0];
        if (!row?.plan_id) continue;
        const cycles = 1 + (i % 3);
        for (let k = 0; k < cycles; k++) {
          const paidAt = daysAgo(Math.max(1, i * 4 + k * 30));
          const from = new Date(paidAt);
          const to = new Date(paidAt);
          to.setDate(to.getDate() + row.duration_days);
          await c.query(
            `INSERT INTO payments (member_id, plan_id, amount_ngn, method, status, reference,
                                   period_from, period_to, recorded_by, paid_at)
             VALUES ($1,$2,$3,$4,'paid',$5,$6,$7,$8,$9)`,
            [
              mid,
              row.plan_id,
              row.price_ngn,
              methods[(i + k) % methods.length],
              `EZ-${new Date(paidAt).getFullYear()}-${(1000 + inserted + 1).toString()}`,
              paidAt,
              iso(to),
              ids["frontdesk@ezzyfitness.ng"],
              `${paidAt}T10:${(i % 6) * 5}:00`,
            ]
          );
          inserted++;
        }
      }
      console.log(`  ✓ ${inserted} payment records`);
    } else {
      console.log(`  ✓ payments already present (${payCount}) — skipped`);
    }

    /* attendance over the last 2 weeks (only when empty) */
    const attCount = (await c.query(`SELECT count(*)::int AS n FROM class_attendance`)).rows[0].n;
    if (attCount === 0) {
      const classes = (await c.query(`SELECT id, day_of_week FROM classes ORDER BY id`)).rows;
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      let att = 0;
      const statusPool = ["present", "present", "present", "late", "absent"];
      for (let back = 13; back >= 0; back--) {
        const date = new Date(today);
        date.setDate(date.getDate() - back);
        const dow = date.getDay();
        const dayClasses = classes.filter((cl) => cl.day_of_week === dow);
        for (const cl of dayClasses) {
          const attendees = 5 + ((back + cl.id) % 8);
          for (let a = 0; a < attendees; a++) {
            // step of 5 is coprime with 12 members → no duplicate (class, member, date)
            const member = memberIds[(a * 5 + cl.id + back) % memberIds.length];
            const status = statusPool[(a + back) % statusPool.length];
            await c.query(
              `INSERT INTO class_attendance (class_id, member_id, session_date, status, checked_in_at, recorded_by)
               VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
              [
                cl.id,
                member,
                iso(date),
                status,
                status === "absent" ? null : `${iso(date)}T06:05:00`,
                ids["frontdesk@ezzyfitness.ng"],
              ]
            );
            att++;
          }
        }
      }
      const saved = (await c.query(`SELECT count(*)::int AS n FROM class_attendance`)).rows[0].n;
      console.log(`  ✓ ${saved} attendance rows (14 days, ${att} attempted)`);

      /* front-desk check-ins, last 10 days */
      let ci = 0;
      for (let back = 9; back >= 0; back--) {
        const date = new Date(today);
        date.setDate(date.getDate() - back);
        if (date.getDay() === 0) continue;
        const perDay = 4 + (back % 5);
        for (let k = 0; k < perDay; k++) {
          const member = memberIds[(back * 3 + k) % memberIds.length];
          await c.query(
            `INSERT INTO check_ins (member_id, method, note, created_by, created_at)
             VALUES ($1,'frontdesk',$2,$3,$4)`,
            [
              member,
              k === 0 ? "First session with coach today" : null,
              ids["frontdesk@ezzyfitness.ng"],
              `${iso(date)}T${String(6 + (k % 14)).padStart(2, "0")}:${(k * 13) % 60}:00`,
            ]
          );
          ci++;
        }
      }
      console.log(`  ✓ ${ci} check-ins (10 days)`);
    } else {
      console.log(`  ✓ attendance already present (${attCount}) — skipped`);
    }

    /* contact inbox */
    const msgCount = (await c.query(`SELECT count(*)::int AS n FROM contact_messages`)).rows[0].n;
    if (msgCount === 0) {
      const msgs = [
        ["Tosin Ogieva", "tosin.ogieva@mail.com", "+2348039998877", "Membership enquiry",
          "Good day. Do you have early morning access from 5:30am on weekdays? I work nearby at Sapele Road.", "new"],
        ["Mercy Uwakwe", "mercy.uwakwe@mail.com", "+2348051234567", "Female-only classes",
          "Please, are there ladies-only sessions? And how much is the quarterly plan?", "read"],
        ["Daniel Omoregie", "daniel.omoregie@mail.com", "+2348067778899", "Personal training",
          "I want to lose 10kg before December. Can I book Tunde twice a week?", "replied"],
        ["Precious Ailenokhai", "precious.a@mail.com", "+2348070001112", "Corporate plan",
          "Our firm at Ugbor wants a corporate membership for 12 staff. Kindly send a quote.", "new"],
      ];
      for (const [name, email, phone, subject, message, status] of msgs) {
        await c.query(
          `INSERT INTO contact_messages (name, email, phone, subject, message, status)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [name, email, phone, subject, message, status]
        );
      }
      console.log(`  ✓ ${msgs.length} contact messages`);
    }

    /* settings */
    await c.query(
      `INSERT INTO settings (key, value) VALUES ('general', $1::jsonb)
       ON CONFLICT (key) DO NOTHING`,
      [
        JSON.stringify({
          announcement: "New: 6am Power Hour starts Monday — limited to 12 lifters",
          currency: "NGN",
          openHours: "Mon–Fri 5:30am–10pm · Sat 7am–9pm · Sun 2pm–8pm",
          checkInEnabled: true,
        }),
      ]
    );

    /* activity trail */
    const actCount = (await c.query(`SELECT count(*)::int AS n FROM activity_log`)).rows[0].n;
    if (actCount === 0) {
      const acts = [
        ["Seeded demo dataset", null, "system"],
        ["Renewed membership", "member"],
        ["Recorded payment", "payment"],
        ["Marked attendance for HIIT Blast", "attendance"],
        ["Registered new member", "member"],
        ["Published weekly schedule", "class"],
      ];
      for (const [idx, [action, entity]] of acts.entries()) {
        await c.query(
          `INSERT INTO activity_log (user_id, action, entity, created_at)
           VALUES ($1,$2,$3, now() - ($4 || ' hours')::interval)`,
          [ids["admin@ezzyfitness.ng"], action, entity, String((idx + 1) * 5)]
        );
      }
      console.log(`  ✓ activity trail`);
    }

    const counts = await c.query(
      `SELECT (SELECT count(*) FROM users) AS users,
              (SELECT count(*) FROM members) AS members,
              (SELECT count(*) FROM trainers) AS trainers,
              (SELECT count(*) FROM classes) AS classes,
              (SELECT count(*) FROM payments) AS payments,
              (SELECT count(*) FROM class_attendance) AS attendance,
              (SELECT count(*) FROM check_ins) AS checkins`
    );
    console.log("\n  Totals:", counts.rows[0]);
    console.log("\n  Demo logins");
    console.log("  ---------------------------------------------");
    console.log("  admin     admin@ezzyfitness.ng      / Admin@123");
    console.log("  trainer   tunde@ezzyfitness.ng     / Trainer@123");
    console.log("  frontdesk frontdesk@ezzyfitness.ng / Frontdesk@123");
    console.log("  member    osemudiamen.idahosa@mail.com / Member@123\n");
    console.log(`  SHA marker: ${createHash("sha256").update(JSON.stringify(counts.rows[0])).digest("hex").slice(0, 12)}\n`);
  } catch (err) {
    console.error(`\n  [✗] Seed failed: ${err.message}\n`);
    process.exitCode = 1;
  } finally {
    c.release();
    await pool.end();
  }
}

seed();
