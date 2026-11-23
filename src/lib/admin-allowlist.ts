function parseAllowlist(raw?: string): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAllowlistedAdmin(identity: {
  githubId?: string | null;
  githubLogin?: string | null;
}): boolean {
  const allowedIds = parseAllowlist(process.env.ADMIN_GITHUB_IDS);
  const allowedLogins = parseAllowlist(process.env.ADMIN_GITHUB_LOGINS);

  // Fail closed when neither allowlist is configured
  if (allowedIds.size === 0 && allowedLogins.size === 0) {
    return false;
  }

  if (identity.githubId && allowedIds.has(identity.githubId.trim().toLowerCase())) {
    return true;
  }

  if (identity.githubLogin && allowedLogins.has(identity.githubLogin.trim().toLowerCase())) {
    return true;
  }

  return false;
}
