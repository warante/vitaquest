import { profileIdSchema } from "./validation"

export function configuredProfileId(): string {
  // biome-ignore lint/complexity/useLiteralKeys: ProcessEnv requires indexed access in strict TypeScript.
  const result = profileIdSchema.safeParse(process.env["VITAQUEST_PROFILE_ID"])
  if (!result.success) {
    throw new Error("VITAQUEST_PROFILE_ID no está configurado correctamente")
  }
  return result.data
}
