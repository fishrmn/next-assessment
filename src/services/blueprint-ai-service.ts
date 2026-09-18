import type OpenAI from "openai"

import {
  BLUEPRINT_AI_MODEL,
  BLUEPRINT_RESPONSE_FORMAT,
  buildSystemPrompt,
  buildUserMessage,
  createOpenAiClient,
} from "@/lib/ai/openai-client"
import { AiGenerationError } from "@/lib/errors"
import { sanitizeList, sanitizeText } from "@/lib/security/sanitize"
import {
  validateBrandExpression,
  validateBusinessContext,
} from "@/lib/validation/blueprint-validation"

import { blueprintService, type BlueprintService } from "@/services/blueprint-service"
import type { AiEditMode, AiEditResult } from "@/services/blueprint-ai.types"
import type { Blueprint, BrandExpression, BusinessContext } from "@/services/blueprint.types"

type CurrentContent = {
  businessContext: BusinessContext | null
  brandExpression: BrandExpression | null
}

export interface BlueprintGenerator {
  generate(instruction: string, current?: CurrentContent): Promise<AiEditResult>
}

export function createOpenAiBlueprintGenerator(
  getClient: () => OpenAI,
  mode: AiEditMode,
): BlueprintGenerator {
  return {
    async generate(instruction, current) {
      try {
        const client = getClient()
        const completion = await client.chat.completions.create({
          model: BLUEPRINT_AI_MODEL,
          response_format: BLUEPRINT_RESPONSE_FORMAT,
          messages: [
            { role: "system", content: buildSystemPrompt(mode) },
            { role: "user", content: buildUserMessage(mode, instruction, current) },
          ],
        })

        const content = completion.choices[0]?.message?.content
        if (!content) throw new Error("OpenAI returned no content")
        return JSON.parse(content) as AiEditResult
      } catch {
        throw new AiGenerationError()
      }
    },
  }
}

export function createBlueprintAiService(
  generatorFactory: (mode: AiEditMode) => BlueprintGenerator,
  service: BlueprintService,
) {
  async function applyInstruction(
    id: number,
    mode: AiEditMode,
    instruction: string,
  ): Promise<Blueprint> {
    const current = await service.getById(id)

    const generated = await generatorFactory(mode).generate(
      instruction,
      mode === "revise"
        ? {
            businessContext: current.businessContext,
            brandExpression: current.brandExpression,
          }
        : undefined,
    )

    if (
      !validateBusinessContext(generated.businessContext).valid ||
      !validateBrandExpression(generated.brandExpression).valid
    ) {
      throw new AiGenerationError("AI returned invalid Blueprint content")
    }

    const businessContext: BusinessContext = {
      industry: sanitizeText(generated.businessContext.industry),
      audience: sanitizeText(generated.businessContext.audience),
      competitors: sanitizeList(generated.businessContext.competitors),
      differentiators: sanitizeText(generated.businessContext.differentiators),
    }

    const brandExpression: BrandExpression = {
      visualStyle: sanitizeText(generated.brandExpression.visualStyle),
      colorDirection: sanitizeText(generated.brandExpression.colorDirection),
      typographyDirection: sanitizeText(generated.brandExpression.typographyDirection),
      toneOfVoice: sanitizeText(generated.brandExpression.toneOfVoice),
      personality: sanitizeList(generated.brandExpression.personality),
    }

    if (JSON.stringify(businessContext) !== JSON.stringify(current.businessContext)) {
      await service.updateSection(id, { section: "businessContext", data: businessContext })
    }
    if (JSON.stringify(brandExpression) !== JSON.stringify(current.brandExpression)) {
      await service.updateSection(id, { section: "brandExpression", data: brandExpression })
    }

    return service.getById(id)
  }

  return { applyInstruction }
}

export const blueprintAiService = createBlueprintAiService(
  (mode) => createOpenAiBlueprintGenerator(createOpenAiClient, mode),
  blueprintService,
)
