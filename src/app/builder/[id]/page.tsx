import { notFound } from "next/navigation"

import { Editor } from "@/components/editor/editor"
import { getPage } from "@/db"

export const dynamic = "force-dynamic"

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const page = await getPage(id)
  if (!page) notFound()

  return <Editor initialPage={page} />
}
