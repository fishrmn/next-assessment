import type { ElementConfig, PageConfig } from "@/components/builder/types"

export type EditorAction =
  | { type: "update"; id: string; patch: Partial<ElementConfig> }
  | { type: "move"; id: string; direction: "up" | "down" }
  | { type: "remove"; id: string }
  | { type: "add"; element: ElementConfig }
  | { type: "replace"; config: PageConfig }

/** Stored configs may lack ids — assign one so selection and reorder work. */
export function normalizeConfig(config: PageConfig): PageConfig {
  return config.map((element) =>
    element.id ? element : { ...element, id: crypto.randomUUID() }
  )
}

export function editorReducer(
  config: PageConfig,
  action: EditorAction
): PageConfig {
  switch (action.type) {
    case "update":
      return config.map((element) =>
        element.id === action.id
          ? ({ ...element, ...action.patch } as ElementConfig)
          : element
      )
    case "move": {
      const index = config.findIndex((element) => element.id === action.id)
      const target = action.direction === "up" ? index - 1 : index + 1
      if (index === -1 || target < 0 || target >= config.length) return config
      const next = [...config]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    }
    case "remove":
      return config.filter((element) => element.id !== action.id)
    case "add":
      return [...config, action.element]
    case "replace":
      return action.config
  }
}
