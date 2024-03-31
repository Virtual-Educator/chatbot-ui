import { generateLocalEmbedding } from "@/lib/generate-local-embedding"
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { Database } from "@/supabase/types"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

export async function POST(request: Request) {
  console.log("POST function start"); // Log at the start of the function
  try {
    const json = await request.json()
    console.log("Request JSON parsed successfully"); // After parsing JSON

    const { userInput, fileIds, embeddingsProvider, sourceCount } = json;
    // Log the essential inputs for debugging without exposing sensitive info
    console.log(`Inputs received: EmbeddingsProvider=${embeddingsProvider}, SourceCount=${sourceCount}, FileIDs count=${fileIds.length}`);

    const uniqueFileIds = [...new Set(fileIds)];

    console.log("Environment variables check"); // Before using environment variables
    // IMPORTANT: Don't log the actual values of sensitive info like API keys
    console.log("Environment variables loaded:", Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY));

    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log("Supabase client created successfully");

    const profile = await getServerProfile();
    console.log("Server profile retrieved successfully");

    if (embeddingsProvider === "openai") {
      if (profile.use_azure_openai) {
        console.log("Using Azure OpenAI");
        checkApiKey(profile.azure_openai_api_key, "Azure OpenAI");
      } else {
        console.log("Using OpenAI");
        checkApiKey(profile.openai_api_key, "OpenAI");
      }
    }

    let openai;
    if (profile.use_azure_openai) {
      console.log("Initializing Azure OpenAI client");
      openai = new OpenAI({
        apiKey: profile.azure_openai_api_key || "",
        baseURL: `${profile.azure_openai_endpoint}/openai/deployments/${profile.azure_openai_embeddings_id}`,
        defaultQuery: { "api-version": "2023-12-01-preview" },
        defaultHeaders: { "api-key": profile.azure_openai_api_key }
      });
    } else {
      console.log("Initializing OpenAI client");
      openai = new OpenAI({
        apiKey: profile.openai_api_key || "",
        organization: profile.openai_organization_id
      });
    }

    let chunks = [];
    if (embeddingsProvider === "openai") {
      console.log("Generating OpenAI embedding");
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: userInput
      });

      console.log("OpenAI embedding generated successfully");
      const openaiEmbedding = response.data.map(item => item.embedding)[0];

      console.log("Matching file items with OpenAI embedding");
      const { data: openaiFileItems, error: openaiError } = await supabaseAdmin.rpc("match_file_items_openai", {
        query_embedding: openaiEmbedding,
        match_count: sourceCount,
        file_ids: uniqueFileIds
      });

      if (openaiError) {
        console.error("Error in matching file items with OpenAI:", openaiError.message); // Log if there's an error
        throw openaiError;
      }

      chunks = openaiFileItems;
    } else if (embeddingsProvider === "local") {
      console.log("Generating local embedding");
      const localEmbedding = await generateLocalEmbedding(userInput);

      console.log("Local embedding generated successfully");
      console.log("Matching file items with local embedding");
      const { data: localFileItems, error: localFileItemsError } = await supabaseAdmin.rpc("match_file_items_local", {
        query_embedding: localEmbedding,
        match_count: sourceCount,
        file_ids: uniqueFileIds
      });

      if (localFileItemsError) {
        console.error("Error in matching file items with local embedding:", localFileItemsError.message); // Log if there's an error
        throw localFileItemsError;
      }

      chunks = localFileItems;
    }

    console.log("Sorting matched file items by similarity");
    const mostSimilarChunks = chunks.sort(
      (a, b) => b.similarity - a.similarity
    );

    console.log("POST function successful, sending response");
    return new Response(JSON.stringify({ results: mostSimilarChunks }), {
      status: 200
    });
  } catch (error) {
    console.error("Error caught in POST function:", error); // General catch-all log for errors
    const errorMessage = error.error?.message || "An unexpected error occurred";
    const errorCode = error.status || 500;
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    });
  }
}
