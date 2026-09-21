/**
 * Seeds the database with one example Blueprint (only if the table is empty, so it is safe
 * to run repeatedly). Run with `npm run db:seed`.
 */
import { db } from "../src/db"
import { blueprints } from "../src/db/schema"
import { normalizeBlueprint } from "../src/lib/blueprint/model"

const existing = db.select({ id: blueprints.id }).from(blueprints).all()

if (existing.length > 0) {
  console.log(`Database already has ${existing.length} blueprint(s) — skipping seed.`)
} else {
  // Half-filled on purpose: the agent has something to build on and something left to ask.
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
