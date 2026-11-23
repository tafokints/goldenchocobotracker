/**
 * Builds verified 1-click grading certification lookup URLs for major grading services.
 * Strictly sanitizes cert numbers to alphanumeric + hyphen characters to prevent injection.
 */
export function getGradingCertUrl(
  service?: string | null,
  certNumber?: string | null
): string | null {
  if (!service || !certNumber) return null;

  const cleanCert = certNumber.trim().replace(/^#/, '');
  if (!/^[a-zA-Z0-9-]{3,32}$/.test(cleanCert)) {
    return null;
  }

  const normalizedService = service.trim().toUpperCase();
  const encoded = encodeURIComponent(cleanCert);

  if (normalizedService === 'PSA') {
    return `https://www.psacard.com/cert/${encoded}`;
  }
  if (normalizedService === 'CGC') {
    return `https://www.cgccards.com/certlookup/${encoded}/`;
  }
  if (normalizedService === 'BGS' || normalizedService === 'BECKETT') {
    return `https://www.beckett.com/grading/card-lookup?item_type=BGS&item_id=${encoded}`;
  }
  if (normalizedService === 'TAG') {
    return `https://my.taggrading.com/card/${encoded}`;
  }

  return null;
}
