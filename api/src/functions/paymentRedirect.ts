import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

/**
 * Azure Function: payment-redirect
 *
 * Handles POST redirect from Flow payment gateway and converts it to GET redirect
 * to Angular app callback page.
 *
 * Flow sends POST with token in body, but Angular SPA needs GET with query params.
 */
export async function paymentRedirect(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log('📨 Payment redirect handler invoked');

  try {
    // Get token from POST body (Flow sends as form data)
    const formData = await request.formData();
    const token = formData.get('token') as string;

    context.log('Token received:', token ? 'present' : 'missing');

    if (!token) {
      // No token - redirect to callback without it (will use localStorage fallback)
      return {
        status: 303, // 303 See Other - forces GET on redirect
        headers: {
          Location: '/payment/callback',
        },
      };
    }

    // Redirect to Angular callback with token as query param
    return {
      status: 303, // 303 See Other - forces GET on redirect
      headers: {
        Location: `/payment/callback?token=${encodeURIComponent(token)}`,
      },
    };
  } catch (error) {
    context.error('Error processing payment redirect:', error);

    // On error, redirect to callback without token (will use localStorage)
    return {
      status: 303, // 303 See Other - forces GET on redirect
      headers: {
        Location: '/payment/callback',
      },
    };
  }
}

app.http('payment-redirect', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: paymentRedirect,
  route: 'payment-redirect',
});
