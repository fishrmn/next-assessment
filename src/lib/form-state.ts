/** What a server action reports back to the form that called it. */
export type FormState = { ok: boolean; message: string }

export const initialFormState: FormState = { ok: false, message: "" }

export function failed(message: string): FormState {
  return { ok: false, message }
}
