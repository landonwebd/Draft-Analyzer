const JWT_ISSUED_AT_FUTURE_MESSAGE = "JWT issued at future";
const JWT_RETRY_DELAY = 2_000;

export async function retryJwtIssuedAtFuture<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const shouldRetry = error instanceof Error && error.message.includes(JWT_ISSUED_AT_FUTURE_MESSAGE);

    if (!shouldRetry) {
      throw error;
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, JWT_RETRY_DELAY);
    });

    return await operation();
  }
}
