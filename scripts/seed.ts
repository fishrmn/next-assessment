/**
 * Seeds the database with one example page (only if the table is empty,
 * so it's safe to run repeatedly). Run with `npm run db:seed`.
 */
import { db } from "../src/db"
import { blueprints, pages } from "../src/db/schema"
import { normalizeBlueprint } from "../src/lib/blueprint/model"

const existing = db.select({ id: pages.id }).from(pages).all()

if (existing.length > 0) {
  console.log(`Database already has ${existing.length} page(s) — skipping seed.`)
} else {
  db.insert(pages)
    .values({
      name: "Example page",
      template: "starter",
      config: [
        {
          type: "text",
          text: "Hello from the database",
          level: "h1",
          align: "center",
        },
        {
          type: "text",
          text: "This element config was read from local.db and rendered by TextElement.",
          level: "p",
          align: "center",
        },
      ],
    })
    .run()

  console.log("Seeded 1 example page.")
}

const existingBlueprints = db.select({ id: blueprints.id }).from(blueprints).all()

if (existingBlueprints.length > 0) {
  console.log(
    `Database already has ${existingBlueprints.length} blueprint(s) — skipping seed.`
  )
} else {
  // A half-finished session, so the app shows a Blueprint "taking shape".
  const data = normalizeBlueprint({
    business: {
      name: "Acme Payroll",
      industry: "Finance",
      offer: "run payroll in minutes",
      audience: "small business owners",
      goal: "become the default payroll tool for new companies",
      comparables: ["Gusto", "ADP"],
      differentiator: "set you up in one afternoon, with no sales call",
    },
    expression: {
      personality: ["Trustworthy", "Playful", "Down-to-earth"],
      tone: { formality: 4, humor: 4, attitude: null, energy: null },
    },
  })

  db.insert(blueprints).values({ name: data.business.name, data }).run()
  console.log("Seeded 1 example blueprint.")
}
