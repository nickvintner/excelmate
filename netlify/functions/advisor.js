exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { scenario } = JSON.parse(event.body);

    if (!scenario) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No scenario provided' }) };
    }

    const prompt = `You are Excel Mate, an expert Excel formula advisor. A user has described their Excel scenario. Provide the best formula recommendation.

User scenario: "${scenario}"

Respond ONLY with a valid JSON object (no markdown, no backticks, no preamble) with this exact structure:
{
  "formulaName": "Name of the recommended formula/function",
  "tagline": "One sentence explaining why this is the best choice",
  "formula": "The actual formula syntax example, ready to use",
  "explanation": "2-3 sentences explaining how it works in plain language",
  "steps": ["Step 1 instruction", "Step 2 instruction", "Step 3 instruction", "Step 4 instruction"],
  "proTip": "One advanced tip or common pitfall to avoid"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err?.error?.message || 'Anthropic API error');
    }

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    };

  } catch (err) {
    console.error('Advisor error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
