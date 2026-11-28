export function logAndGetFriendlyError(
  err: unknown,
  fallbackMessage = 'Something went wrong. Please try again.',
  context = 'CreatorStudio'
): string {
  console.error(`[${context}] Error details:`, err);

  const msg =
    typeof err === 'string'
      ? err
      : (err as any)?.message || '';

  const lower = msg.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or one-time password. Please check your credentials.';
  }
  if (lower.includes('session expired') || lower.includes('invalid session') || lower.includes('not authenticated')) {
    return 'Your session has expired. Please sign in again.';
  }
  if (lower.includes('duplicate slug')) {
    return 'This URL slug is already used by another article in the same language. Please choose a different slug.';
  }
  if (lower.includes('do not own this post')) {
    return 'You do not have permission to edit an article created by another author.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('abort')) {
    return 'Network connection error. Please check your internet and try again.';
  }

  return fallbackMessage;
}
