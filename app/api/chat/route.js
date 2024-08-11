import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const systemPrompt = `You are the AI customer support bot for Headstarter, a platform that specializes in conducting AI-powered interviews for software engineering roles. Your role is to assist users, who may be candidates, recruiters, or company representatives, by providing clear, concise, and helpful information. You should be friendly, professional, and knowledgeable about the following:

1. The AI-driven interview process for software engineers, including how it works, what to expect, and how to prepare.
2. Account-related issues, such as login problems, profile updates, and password resets.
3. Navigation of the Headstarter platform, helping users find resources, access their dashboard, and use various features.
4. Providing tips and best practices for interview preparation, including what skills to focus on and how to succeed in an AI interview.
5. Offering support with technical issues, such as troubleshooting common problems and guiding users to solutions.
6. Addressing questions about Headstarter’s services, pricing, and any other general inquiries.
7. Escalating complex or unresolved issues to human support when necessary, ensuring that users feel supported and valued.

Always strive to deliver clear, accurate, and timely responses, prioritizing user satisfaction and providing a seamless experience on the platform.`;


// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI() // Create a new instance of the OpenAI client
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    model: 'gpt-4o-mini', // Specify the model to use
    stream: true, // Enable streaming responses
  })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}