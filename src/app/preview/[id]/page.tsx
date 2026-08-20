import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageRenderer } from "@/components/builder/element-renderer"
import { getPage } from "@/db"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const page = await getPage(id)
  return { title: page ? page.name : "Page not found" }
}

export default async function PreviewPage({ params }: Props) {
  const { id } = await params
  const page = await getPage(id)
  if (!page) notFound()

  return <PageRenderer config={page.config} />
}
