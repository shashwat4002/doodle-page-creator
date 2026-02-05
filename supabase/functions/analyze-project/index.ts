import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProjectData {
  title: string;
  field: string;
  objective: string;
}

interface PipelineStage {
  name: string;
  description: string;
  order_index: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, field, objective } = await req.json() as ProjectData;

    if (!title || !field || !objective) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, field, objective' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing project: ${title} in ${field}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a research methodology expert. Given a research project, generate a customized pipeline of 7 stages with specific milestones. 
    
    Return a JSON object with this exact structure:
    {
      "vision": "A 2-3 sentence analysis of the research potential and approach",
      "stages": [
        { "name": "Stage Name", "description": "Brief description of this stage", "order_index": 0 }
      ],
      "tags": ["tag1", "tag2", "tag3"]
    }
    
    The stages should be tailored to the specific research field and objective. Include exactly 7 stages.
    Only respond with valid JSON, no markdown or explanation.`;

    const userPrompt = `Research Project:
Title: ${title}
Field: ${field}
Objective: ${objective}

Generate a customized research pipeline for this project.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI analysis failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'No AI response generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response (handle potential markdown wrapping)
    let analysis;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback to default stages if parsing fails
      analysis = {
        vision: `This ${field} research project aims to ${objective.substring(0, 100)}...`,
        stages: [
          { name: "Exploration", description: "Initial research landscape mapping", order_index: 0 },
          { name: "Topic Discovery", description: "Refine research questions and hypotheses", order_index: 1 },
          { name: "Literature Review", description: "Comprehensive review of existing work", order_index: 2 },
          { name: "Methodology", description: "Design research methodology and approach", order_index: 3 },
          { name: "Data Collection", description: "Gather and organize research data", order_index: 4 },
          { name: "Analysis", description: "Analyze findings and draw conclusions", order_index: 5 },
          { name: "Publication", description: "Document and publish research results", order_index: 6 },
        ],
        tags: [field.toLowerCase().split(' ')[0], "research", "academic"]
      };
    }

    console.log('Analysis complete:', analysis.vision?.substring(0, 100));

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
