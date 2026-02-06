import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get all headers
    const authHeader = req.headers.get('Authorization');
    const apikeyHeader = req.headers.get('apikey');

    console.log('=== TEST AUTH FUNCTION ===');
    console.log('Auth header:', authHeader ? 'EXISTS' : 'MISSING');
    console.log('Auth preview:', authHeader ? authHeader.substring(0, 50) : 'N/A');
    console.log('ApiKey header:', apikeyHeader ? 'EXISTS' : 'MISSING');
    console.log('ApiKey preview:', apikeyHeader ? apikeyHeader.substring(0, 50) : 'N/A');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test function executed',
        hasAuth: !!authHeader,
        hasApiKey: !!apikeyHeader,
        authPreview: authHeader?.substring(0, 30),
        apikeyPreview: apikeyHeader?.substring(0, 30),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Test error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
