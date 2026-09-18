/**
 * Seeds the database with one example blueprint (only if the table is empty,
 * so it's safe to run repeatedly). Run with `npm run db:seed`.
 */
import { db } from "../src/db"
import { blueprints } from "../src/db/schema"

const existing = db.select({ id: blueprints.id }).from(blueprints).all()

if (existing.length > 0) {
  console.log(`Database already has ${existing.length} blueprint(s) — skipping seed.`)
} else {
  db.insert(blueprints)
    .values({
      clientName: "Northbound Coffee Roasters",
      status: "complete",
      currentStep: 2,
      businessContext: {
        industry: "Speciality coffee roasting and wholesale",
        audience: "Independent cafés and office subscriptions across Ireland",
        competitors: ["Bailies Coffee", "3fe", "Cloud Picker"],
        differentiators:
          "Direct-trade single-origin beans roasted to order and delivered within 48 hours.",
      },
      brandExpression: {
        visualStyle: "Warm minimalism with generous whitespace and editorial photography",
        colorDirection: "Terracotta and deep espresso against oat and cream neutrals",
        typographyDirection: "Humanist sans for body copy with a high-contrast serif for headlines",
        toneOfVoice: "Direct, warm and unpretentious — knowledgeable without lecturing",
        personality: ["Grounded", "Curious", "Generous", "Precise"],
      },
    })
    .run()

  console.log("Seeded 1 example blueprint.")
}
