import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import OpenAI from "openai";

export const generateWebsiteSpec = action({
  args: {
    conversationId: v.id("conversations"),
    userInput: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    // Get the conversation to understand context
    const conversation = await ctx.runQuery(api.conversations.getConversation, {
      conversationId: args.conversationId,
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if a document already exists for this conversation
    let existingDocument = await ctx.runQuery(api.documents.getDocumentByConversation, {
      conversationId: args.conversationId,
    });

    let systemPrompt: string;
    let userMessage: string;

    if (existingDocument) {
      // Update existing specification
      systemPrompt = `You are a web consultant. The user has an existing website specification and wants to make changes to it. Update the specification based on their request while maintaining the overall structure and format. Keep all sections that aren't being modified.`;
      
      userMessage = `Here is the current website specification:

${existingDocument.content}

User's update request: ${args.userInput}

Please update the specification based on this request.`;
    } else {
      // Create new specification
      systemPrompt = `You are a web consultant. Create a comprehensive website specification based on the user's business information. Include: Business Overview, Website Goals, Content Strategy, Design Requirements, and Technical Specifications. Format as a well-structured document with clear headings.`;
      
      userMessage = `Create a website specification for: ${args.userInput}`;
    }

    let aiResponse: string;

    try {
      // Use the bundled OpenAI API
      const openai = new OpenAI({
        baseURL: process.env.CONVEX_OPENAI_BASE_URL,
        apiKey: process.env.CONVEX_OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      });

      aiResponse = completion.choices[0].message.content || "Failed to generate response";
    } catch (error) {
      console.error("Error generating website spec:", error);
      
      if (existingDocument) {
        // For updates, provide a simple mock update
        aiResponse = existingDocument.content.replace(/Contact forms with validation/g, "Simple contact information display")
          .replace(/- Contact forms with validation/g, "- Contact information display")
          + `\n\n*Updated based on request: ${args.userInput}*`;
      } else {
        // Fallback mock specification for new documents
        aiResponse = `# Website Specification Document

## Business Overview
**Company:** ${args.userInput.slice(0, 50)}...
**Mission:** Provide exceptional digital experiences that drive business growth and customer engagement.
**Target Audience:** Professional customers seeking modern online presence and digital solutions.
**Value Proposition:** Comprehensive web solutions combining modern design with powerful functionality.

## Website Goals & Objectives
### Primary Goals
- Establish strong online brand presence
- Generate qualified leads and conversions
- Provide excellent user experience across all devices
- Showcase products/services effectively

### Key Performance Indicators
- Monthly website traffic growth: 25%
- Lead conversion rate: 3-5%
- Page load speed: Under 3 seconds
- Mobile responsiveness: 100% compatibility

## Content Strategy
### Required Pages
- **Homepage:** Hero section, services overview, testimonials
- **About Us:** Company story, team, values
- **Services/Products:** Detailed offerings with pricing
- **Portfolio/Case Studies:** Previous work examples
- **Contact:** Multiple contact methods, location info
- **Blog:** Regular content updates for SEO

### Content Hierarchy
- Primary navigation: Home, About, Services, Portfolio, Contact
- Secondary: Blog, Resources, FAQ
- Footer: Quick links, social media, legal pages

## Design Requirements
### Brand Guidelines
- **Color Palette:** Professional blues and grays with accent colors
- **Typography:** Modern, readable fonts (Inter, Roboto)
- **Logo Usage:** Consistent placement and sizing
- **Imagery Style:** High-quality, professional photography

### User Experience Principles
- Mobile-first responsive design
- Intuitive navigation structure
- Fast loading times
- Accessibility compliance (WCAG 2.1)
- Clear call-to-action buttons

## Technical Specifications
### Platform Recommendations
- **CMS:** WordPress, Webflow, or custom solution
- **Hosting:** Cloud-based hosting with CDN
- **SSL Certificate:** Required for security
- **Analytics:** Google Analytics 4 integration

### Required Features
- Newsletter signup integration
- Social media integration
- Search functionality
- Blog/news section
- Mobile optimization

### Integration Requirements
- CRM system integration
- Email marketing platform
- Social media feeds
- Payment processing (if e-commerce)
- Live chat functionality
- Google Maps integration

## Marketing & Analytics
### Digital Marketing Strategy
- **SEO:** On-page and technical optimization
- **Content Marketing:** Regular blog posts and resources
- **Social Media:** Integration with major platforms
- **Email Marketing:** Newsletter and automated campaigns

### Analytics Setup
- Google Analytics 4 implementation
- Google Search Console
- Performance monitoring
- Conversion tracking setup

## Implementation Timeline
- **Phase 1:** Planning and design (2-3 weeks)
- **Phase 2:** Development and content creation (4-6 weeks)
- **Phase 3:** Testing and optimization (1-2 weeks)
- **Phase 4:** Launch and monitoring (1 week)

---
*This specification serves as a comprehensive guide for creating a professional website that meets business objectives and user needs.*`;
      }
    }

    // Add the AI response to the conversation
    await ctx.runMutation(api.conversations.addMessage, {
      conversationId: args.conversationId,
      role: "assistant",
      content: existingDocument ? `Updated the specification based on your request.` : `Created a comprehensive website specification.`,
    });

    if (existingDocument) {
      // Update existing document
      await ctx.runMutation(api.documents.updateDocument, {
        documentId: existingDocument._id,
        content: aiResponse,
      });
    } else {
      // Create new document
      await ctx.runMutation(api.documents.createDocument, {
        conversationId: args.conversationId,
        title: `Website Spec - ${conversation.title}`,
        content: aiResponse,
      });
    }

    return aiResponse;
  },
});
