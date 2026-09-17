import {
  Bot,
  ClipboardList,
  Database,
  MonitorSmartphone,
  Save,
  Sparkles,
} from "lucide-react"

import { TextElement } from "@/components/builder/text-element"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const userStories = [
  {
    icon: ClipboardList,
    title: "Capture the brand direction",
    description:
      "A guided flow surfaces business context (industry, audience, competitors) and brand expression — visual style, color and typography direction, tone of voice, and personality.",
  },
  {
    icon: Sparkles,
    title: "Turn answers into a Blueprint",
    description:
      "A clear, presentable one-pager the team can hand off or reference — not a raw dump of form answers.",
  },
  {
    icon: MonitorSmartphone,
    title: "Watch it take shape",
    description:
      "The Blueprint forms live as the flow progresses, not just as a result at the end. Works on mobile and desktop.",
  },
  {
    icon: Save,
    title: "Save and come back to it",
    description:
      "Inputs and the resulting Blueprint persist, so a session can be picked up again before onboarding and referenced during it.",
  },
  {
    icon: Bot,
    title: "Edit with AI (Phase 2)",
    description:
      "The client describes a change in plain language — \"make the tone more playful\" — and the Blueprint updates accordingly.",
  },
] as const

const decisions = [
  {
    title: "Capture flow",
    description:
      "How the guided intake is structured — steps, question types, branching — and how it maps to a Brand Blueprint.",
  },
  {
    title: "Configuration",
    description:
      "How elements declare what's configurable, and how the editor exposes those controls.",
  },
  {
    title: "Component model",
    description:
      "The base components a page is composed of. A TextElement example lives in src/components/builder/.",
  },
  {
    title: "Editor UX",
    description: "How capturing, previewing, editing, and saving fit together.",
  },
] as const

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-6 py-16 sm:py-24">
        {/* Hero — rendered with the provided example builder component */}
        <section className="flex flex-col items-center gap-4 text-center">
          <Badge variant="secondary">Brand Blueprint Builder</Badge>
          <TextElement
            config={{
              type: "text",
              text: "Build a brand blueprint tool.",
              level: "h1",
              align: "center",
            }}
          />
          <TextElement
            config={{
              type: "text",
              text: "A guided intake that captures a client's business context and brand expression, turns it into a live Brand Blueprint, and lets them refine it with AI. This headline is rendered by the example TextElement — your first building block.",
              level: "p",
              align: "center",
            }}
          />
          <p className="max-w-xl text-sm text-muted-foreground">
            You&apos;ll have about an hour. Use any tools you&apos;re
            comfortable with, including AI — we&apos;re measuring how quickly
            you can ship something good. The full brief is in the{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              README.md
            </code>
            .
          </p>
        </section>

        <Separator />

        {/* What the user can do */}
        <section className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              What the user can do
            </h2>
            <p className="text-sm text-muted-foreground">
              The core loop your app must support.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {userStories.map(({ icon: Icon, title, description }) => (
              <Card key={title} size="sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <CardTitle>{title}</CardTitle>
                  </div>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
            <Card size="sm" className="bg-muted/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="size-4 text-muted-foreground" />
                  <CardTitle>Keep it local</CardTitle>
                </div>
                <CardDescription>
                  SQLite, no external services. Wire it up with the lightweight
                  tooling of your choice — the schema is part of the
                  assessment.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Decisions */}
        <section className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Decisions we leave to you
            </h2>
            <p className="text-sm text-muted-foreground">
              Intentionally open-ended — we&apos;d rather see a few elements
              done well than many done poorly.
            </p>
          </div>
          <Card>
            <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {decisions.map(({ title, description }) => (
                <div key={title} className="flex flex-col gap-1">
                  <span className="font-medium">{title}</span>
                  <span className="text-sm text-muted-foreground">
                    {description}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Separator />

        <footer className="flex flex-col items-center gap-1 text-center text-sm text-muted-foreground">
          <p>
            Replace this page as your app takes shape — it exists only to get
            you oriented.
          </p>
          <p>
            Submit a PR when you&apos;re done, with a note on your decisions,
            trade-offs, and what you&apos;d do next in the description.
          </p>
        </footer>
      </main>
    </div>
  )
}
