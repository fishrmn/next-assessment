import type OpenAI from "openai"
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions"

export type ToolLoopResult<T> =
  /** The model replied with text — the loop's natural end. */
  | { kind: "text"; text: string }
  /** A tool handler short-circuited the loop with a final value. */
  | { kind: "terminal"; value: T }
  /** The iteration cap was reached before the model finished. */
  | { kind: "cap" }

/**
 * The OpenAI tool-calling loop shared by the edit and brand agents: call the
 * model, dispatch each function call through `onToolCall`, feed results (or
 * error strings) back, and repeat until the model answers with text or the
 * cap is hit. Malformed JSON arguments become an error tool result so the
 * model can self-correct. `messages` is appended to in place.
 */
export async function runToolLoop<T = never>(options: {
  openai: OpenAI
  model: string
  messages: ChatCompletionMessageParam[]
  tools: ChatCompletionTool[]
  maxIterations: number
  /** Returns the tool-result string, or `{ terminal }` to end the loop. */
  onToolCall: (name: string, args: unknown) => Promise<string | { terminal: T }>
}): Promise<ToolLoopResult<T>> {
  const { openai, model, messages, tools, maxIterations, onToolCall } = options

  for (let round = 0; round < maxIterations; round++) {
    const response = await openai.chat.completions.create({
      model,
      messages,
      tools,
    })
    const message = response.choices[0]?.message
    if (!message) break

    const toolCalls = (message.tool_calls ?? []).filter(
      (call) => call.type === "function"
    )
    if (toolCalls.length === 0) {
      return { kind: "text", text: message.content?.trim() ?? "" }
    }

    messages.push(message)
    for (const call of toolCalls) {
      let args: unknown
      try {
        args = JSON.parse(call.function.arguments)
      } catch {
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: "Error: arguments are not valid JSON",
        })
        continue
      }
      const outcome = await onToolCall(call.function.name, args)
      if (typeof outcome !== "string") {
        return { kind: "terminal", value: outcome.terminal }
      }
      messages.push({ role: "tool", tool_call_id: call.id, content: outcome })
    }
  }

  return { kind: "cap" }
}
