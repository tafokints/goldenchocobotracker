export interface TurnstileVerificationResult {
  ok: boolean;
  error?: string;
}

const TURNSTILE_VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

/**
 * Verifies a Cloudflare Turnstile token server-side.
 * Fails closed whenever TURNSTILE_SECRET_KEY is configured.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string
): Promise<TurnstileVerificationResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, error: 'Anti-bot verification is not configured on this server.' };
    }
    return { ok: true };
  }

  if (!token || !token.trim()) {
    return { ok: false, error: 'Please complete the verification check before submitting.' };
  }

  try {
    const formData = new URLSearchParams();
    formData.set('secret', secret);
    formData.set('response', token.trim());
    if (remoteIp && remoteIp !== 'unknown') {
      formData.set('remoteip', remoteIp);
    }

    const res = await fetch(TURNSTILE_VERIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
      cache: 'no-store',
    });

    if (!res.ok) {
      return { ok: false, error: 'Verification service temporarily unavailable.' };
    }

    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (!data.success) {
      return { ok: false, error: 'Verification check failed. Please retry.' };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach verification service.' };
  }
}
