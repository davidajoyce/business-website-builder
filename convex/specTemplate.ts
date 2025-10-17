/**
 * Landing Page Spec Template
 *
 * This template contains placeholders that will be replaced with actual data:
 * - {SEO_REPORT} - SEO analysis and recommendations
 * - {CUSTOMER_REVIEWS} - Google reviews and ratings
 * - {WEBSITE_CONTENT} - Scraped website content
 */

export const LANDING_PAGE_SPEC_TEMPLATE = `## 🎯 PRIMARY OBJECTIVE

You are an expert web developer specializing in high-converting landing pages for service businesses. You will create a modern, responsive, single-page website using the provided business information, SEO guidelines, and customer reviews.

**CRITICAL REQUIREMENTS:**
1. ✅ Use ONLY the actual business information provided - DO NOT hallucinate or create fictional details
2. ✅ Follow the landing page builder instructions precisely for structure and components
3. ✅ Implement SEO recommendations for all content and meta tags
4. ✅ Integrate real customer reviews in the testimonials section
5. ✅ Create a complete, production-ready HTML file with inline CSS and JavaScript

---

## 📋 SECTION 1: LANDING PAGE BUILDER INSTRUCTIONS

Use these detailed specifications to structure and build each component of the landing page:

# Service Business Landing Page Builder System Instructions

## Core Principles
When building landing pages for service businesses, follow these fundamental principles:
- **Mobile-first design**: Design for mobile screens first (375px width), then scale up
- **Local trust focus**: Emphasize local presence, certifications, and community reputation
- **Clear service value**: Communicate what you do and service areas immediately
- **Speed optimization**: Target <3 second load time, 90+ PageSpeed score
- **Social proof prominence**: Reviews and testimonials within first two sections
- **Easy contact methods**: Multiple ways to reach you (call, form, chat)

## Component Implementation Specifications

### 1. Navigation Bar
**Structure:**
\`\`\`
- Position: Fixed/sticky top, z-index: 1000
- Height: 60-80px desktop, 56px mobile
- Background: Solid white or brand color with shadow
- Padding: 0 5% horizontal
\`\`\`

**Required Elements:**
- Business logo (left): 40-50px height, links to #hero
- Navigation links (center/right): Maximum 5 items
  - Services, About, Service Areas, Reviews, Contact
  - Font-size: 16px, font-weight: 500
  - Hover state: Color change or underline animation
- Phone number (prominent):
  - Desktop: Visible with "Call Now" text
  - Mobile: Clickable phone icon
  - Style: Bold, contrasting color
- Primary CTA button (right):
  - Min height: 44px, padding: 12px 24px
  - Text: "Get Free Quote" / "Book Service" / "Schedule Now"
- Mobile: Bottom bar with Call + Book buttons

**Implementation Notes:**
- Phone number should be clickable (tel: link)
- Consider sticky mobile bottom bar with phone/book CTAs
- Include business hours indicator if relevant

### 2. Hero Section
**Structure:**
\`\`\`
- Height: 80-100vh desktop, min-height: 600px mobile
- Layout: 2-column desktop (60/40 text/visual), single column mobile
- Padding: 80px 5% (account for fixed nav)
\`\`\`

**Content Hierarchy:**
1. **Headline** (H1):
   - Font-size: 48-72px desktop, 32-40px mobile
   - Line-height: 1.1-1.2
   - Maximum 10 words
   - Formulas for services:
     - "[Service] Services in [Location]"
     - "Expert [Service] Available 24/7"
     - "[Problem Solved] Fast & Affordable"
     - "Professional [Service] You Can Trust"

2. **Subheadline** (P):
   - Font-size: 18-24px desktop, 16-18px mobile
   - Include: Service area, availability, key benefit
   - Example: "Serving [City] and surrounding areas. Same-day service available. Licensed & insured."

3. **Dual CTA Strategy**:
   - Primary button: "Get Free Quote" / "Book Service"
   - Secondary button: "Call Now: (XXX) XXX-XXXX"
   - Size: Min 48px height, side-by-side desktop, stacked mobile
   - Include emergency text if applicable: "24/7 Emergency Service"

4. **Trust Indicators** (below CTA):
   - Review stars: "★★★★★ 4.9 on Google (247 reviews)"
   - Certifications/badges: Licensed, Insured, BBB, Trade associations
   - Years in business: "Serving [City] Since [Year]"
   - Response time: "Average response time: 30 minutes"

5. **Hero Visual Options**:
   - Team photo in branded uniforms
   - Before/after transformation
   - Service vehicle with branding
   - Video testimonial or service demonstration
   - Local landmark/map showing service area

### 3. Social Proof Section
**Structure:**
\`\`\`
- Background: Subtle gray (#F8F9FA) or light brand color
- Padding: 80px 5%
- Position: Immediately after hero or after services
\`\`\`

**Layout Options for Service Businesses:**

**Option A: Review Showcase**
- Google Reviews integration (live feed if possible)
- Format per review:
  - 5-star rating visual
  - Customer name and date
  - Review text (truncate at 150 chars with "read more")
  - Service type tag (e.g., "Drain Cleaning")
- Include review platform logos and aggregate scores

**Option B: Before/After Gallery**
- Grid of 4-6 before/after images
- Each with:
  - Service type label
  - Completion time
  - Brief description
- Lightbox for full view

**Option C: Mixed Proof**
- Row 1: Platform ratings (Google, Yelp, Facebook, BBB)
- Row 2: 2-3 detailed testimonials with customer photos
- Row 3: Certification badges and awards
- Row 4: "Recent Jobs" ticker or counter

### 4. Services Section
**Structure:**
\`\`\`
- Padding: 80px 5%
- Flexible layouts based on service count
\`\`\`

**Service Presentation Options:**

**Option A: Core Services Grid (3-6 services)**
\`\`\`
Each service card:
- Icon or image (64px)
- Service name (H3)
- Brief description (2-3 lines)
- Key benefits (3 bullet points)
- Starting price (if applicable): "From $XX"
- "Learn More" or "Book This Service" link
\`\`\`

**Option B: Comprehensive Service List (7+ services)**
\`\`\`
Two-column layout:
- Left: Service categories with expand/collapse
- Right: Service details, pricing info, booking button
Include search/filter for many services
\`\`\`

**Option C: Service Packages (Best for standardized services)**
\`\`\`
3-4 package cards:
- Package name (e.g., "Basic Clean", "Deep Clean", "Move-out Clean")
- What's included (5-8 items with checkmarks)
- Time estimate
- Price or price range
- Book button for each
\`\`\`

**Content Guidelines:**
- Lead with most profitable/popular services
- Include emergency services separately if offered
- Mention service areas within descriptions
- Add "Not seeing what you need? Call us" option

### 5. Pricing Section (Flexible Approaches)
**Structure:**
\`\`\`
- Background: White or subtle pattern
- Padding: 80px 5%
- Approach depends on business model
\`\`\`

**Pricing Display Options:**

**Option A: Transparent Pricing (When prices are standardized)**
\`\`\`
- Service price list or table
- "Starting at" prices for variable services
- Package deals with clear savings
- Include what's covered in base price
- Note additional fees clearly
- Add "Get exact quote" CTA
\`\`\`

**Option B: Quote-Based Pricing (For custom jobs)**
\`\`\`
- Explain pricing factors:
  - Job size/scope
  - Materials needed
  - Time required
  - Travel distance
- Include:
  - "Free estimates" badge
  - "No hidden fees" guarantee
  - "Price match" promise if applicable
  - Typical price ranges for common jobs
- Strong CTA: "Get Your Free Quote in Minutes"
\`\`\`

**Option C: Hybrid Approach**
\`\`\`
- List common services with prices
- "Custom work? Get a quote"
- Include minimum service charges
- Show hourly rates if applicable
- Add financing options if available
\`\`\`

**Trust Elements for Pricing:**
- "Free estimates"
- "No hidden fees"
- "Satisfaction guaranteed"
- "Licensed & insured"
- Payment options accepted
- Financing available

### 6. Service Area / Coverage Section (Service Business Specific)
**Structure:**
\`\`\`
- Can be standalone section or integrated with footer
- Include interactive map or list of areas
\`\`\`

**Components:**
- Headline: "Areas We Serve" / "We Come to You"
- Interactive map with service boundaries
- List of cities/neighborhoods (searchable if many)
- Zip code checker tool
- Travel fees information if applicable
- "Don't see your area? Call us" option

### 7. Why Choose Us Section (Optional but Recommended)
**Structure:**
\`\`\`
- Grid or alternating left/right layout
- 4-6 key differentiators
\`\`\`

**Common Differentiators:**
- Family owned & operated
- X years of experience
- Licensed & insured
- 24/7 emergency service
- Satisfaction guarantee
- Upfront pricing
- Background-checked technicians
- Eco-friendly practices
- Same-day service
- Free estimates

### 8. FAQ Section
**Structure:**
\`\`\`
- Padding: 80px 5%
- Max-width: 800px, centered
\`\`\`

**Service Business FAQs (customize by industry):**
1. Service area coverage
2. Response time/scheduling
3. Pricing and payment methods
4. Insurance and licensing
5. Guarantees and warranties
6. Emergency service availability
7. What to expect during service
8. Preparation needed before service
9. Follow-up and maintenance
10. Cancellation policy

### 9. Footer
**Structure:**
\`\`\`
- Background: Dark or brand color
- Include business hours prominently
- Padding: 60px 5% 30px
\`\`\`

**Service Business Footer Layout:**

**Row 1: Quick Contact**
- Phone number (large, prominent)
- Business hours
- Emergency contact if different
- "Book Online" button

**Row 2: Information Columns**

**Column 1: Services**
- Top 5-6 services
- "All Services" link

**Column 2: Company**
- About Us
- Our Team
- Service Areas
- Reviews/Testimonials

**Column 3: Resources**
- FAQ
- Pricing Guide
- Maintenance Tips
- Blog (if applicable)

**Column 4: Credentials**
- License numbers
- Insurance info
- Certifications
- Professional associations
- BBB accreditation

**Bottom Bar:**
- Copyright
- Privacy Policy | Terms
- Social media icons
- Payment methods accepted
- "Proudly Serving [Location] Since [Year]"

## Local SEO Optimization

### Schema Markup Requirements
- LocalBusiness schema with:
  - Service areas
  - Business hours
  - Reviews/ratings
  - Price ranges
  - Services offered

### Local Trust Signals
- NAP consistency (Name, Address, Phone)
- Google My Business integration
- Local review platforms
- Community involvement mentions
- Local partnership logos

## Conversion Optimization for Service Businesses

### Multiple Contact Methods
- Click-to-call buttons
- Online booking system
- Quote request forms
- Live chat during business hours
- Text messaging option
- WhatsApp business (if applicable)

### Urgency Creation (Appropriate for Services)
- "Book today, service tomorrow"
- "Limited appointments available this week"
- Seasonal promotions
- "Emergency? We're available now"
- Weather-related urgency (for relevant services)

### Trust Building Specific to Services
- Show technician photos and names
- Display license and insurance numbers
- Include "No money down" or payment terms
- Highlight local ownership
- Show community involvement
- Display length of time in business
- Include video testimonials from local customers

### Form Optimization for Quotes/Booking
**Quote Form Fields:**
- Service needed (dropdown)
- Urgency (emergency/scheduled)
- Property type (if relevant)
- Preferred contact method
- Phone number (required)
- Email (optional)
- Address or zip code
- Preferred appointment time
- Photos upload option
- Additional notes

**Progressive disclosure:**
- Start with service selection
- Then show relevant fields
- Keep initial form to 3-4 fields
- Gather details after initial contact

## Mobile Optimization for Field Service

### Click-to-Call Prominence
- Sticky call button on mobile
- Tap-to-call phone numbers
- "Call for immediate service" prompts

### Location Services
- "Find nearest technician" feature
- Automatic service area detection
- Directions to business location

### Mobile-Friendly Features
- Large touch targets (minimum 48px)
- Thumb-friendly navigation
- Easy photo upload for quotes
- One-thumb form completion
- Swipeable before/after galleries

## Performance Metrics for Service Businesses

### Key Conversion Points
- Phone calls tracked
- Form submissions
- Online bookings
- Chat initiations
- Direction/map clicks
- Review platform clicks

### Response Time Optimization
- Live chat during hours
- Auto-response for after hours
- Quote turnaround time displayed
- Appointment availability visible

## Testing Checklist for Service Businesses
Before deployment, verify:
- [ ] Phone numbers clickable and tracked
- [ ] Service area clearly defined
- [ ] Business hours visible
- [ ] Reviews/testimonials loading
- [ ] Booking/quote forms working
- [ ] Local schema markup implemented
- [ ] NAP consistency verified
- [ ] Emergency contact info clear
- [ ] Payment methods displayed
- [ ] License/insurance visible
- [ ] Mobile click-to-call working
- [ ] Response time expectations set
- [ ] Map/directions functional
- [ ] Social proof prominent
- [ ] Load time <3 seconds

---

## 🔍 SECTION 2: SEO REPORT AND CONTENT GUIDELINES

Follow these SEO recommendations for content optimization, keyword usage, and meta tag implementation, don't read too much into the web style for that follow above instructions:

{SEO_REPORT}

---

## ⭐ SECTION 3: CUSTOMER REVIEWS

Use the following data to put the Hero star and avg. rating, use the link as is for read more. Also use the customer reviews for the testimonials section (and to write some of the content for the services section):

{CUSTOMER_REVIEWS}

---

## 📄 SECTION 4: CURRENT WEBSITE CONTENT

Use this authentic business information for all content. DO NOT create fictional information:

{WEBSITE_CONTENT}

---

## 🛠️ IMPLEMENTATION INSTRUCTIONS

### Output Requirements:

1. **File Structure:**
   - Create a single, self-contained HTML file
   - Include all CSS as internal styles in \`<style>\` tags
   - Include all JavaScript inline in \`<script>\` tags
   - No external dependencies except for:
     - Google Fonts (maximum 2 families)
     - Font Awesome icons (if needed)
     - Critical third-party integrations (analytics, chat widgets)

2. **Code Organization:**
   \`\`\`html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <!-- Meta tags from SEO guidelines -->
       <!-- Responsive viewport -->
       <!-- Favicon -->
       <!-- Schema markup -->
       <style>
           /* CSS Reset */
           /* Custom properties / CSS variables */
           /* Mobile-first base styles */
           /* Component styles (following builder instructions) */
           /* Responsive breakpoints (768px, 1024px, 1440px) */
       </style>
   </head>
   <body>
       <!-- Follow exact component order from builder instructions -->
       <!-- Use semantic HTML5 elements -->
       <!-- Include accessibility attributes -->
       <script>
           /* Smooth scroll */
           /* Mobile menu toggle */
           /* Form validation */
           /* Analytics tracking -->
       </script>
   </body>
   </html>
   \`\`\`

3. **Content Implementation Rules:**
   - **Business Information**: Use EXACTLY as provided in Section 4 - no modifications to phone numbers, addresses, or business names
   - **SEO Content**: Incorporate keywords naturally from Section 2 without keyword stuffing
   - **Reviews**: Select 3-6 best reviews from Section 3, maintain authenticity
   - **Images**: Use placeholder images with descriptive alt text following SEO guidelines
   - **CTAs**: Use action verbs and service-specific language from existing content

4. **Component Building Priority:**
   - Navigation with phone number and primary CTA
   - Hero section with headline using primary keyword
   - Social proof section using real reviews
   - Services section using actual service descriptions
   - Pricing/Quote section based on business model
   - FAQ section addressing common concerns
   - Footer with complete business information

5. **Performance Standards:**
   - Inline critical CSS
   - Lazy load images below fold
   - Minify CSS and JavaScript
   - Use CSS animations over JavaScript when possible
   - Optimize for Core Web Vitals

6. **Responsive Design:**
   - Mobile-first approach (base styles for 375px width)
   - Fluid typography using clamp()
   - Flexible images with max-width: 100%
   - Touch-friendly tap targets (minimum 44px)
   - Test breakpoints at 375px, 768px, 1024px, 1440px

7. **Accessibility Requirements:**
   - Semantic HTML structure
   - ARIA labels for interactive elements
   - Skip navigation link
   - Keyboard navigation support
   - Focus indicators
   - Alt text for all informational images
   - Color contrast ratio 4.5:1 minimum

### Data Validation Checklist:

Before generating code, verify:
- [ ] Phone numbers match Section 3 exactly
- [ ] Business name is consistent throughout
- [ ] Address and service areas are accurate
- [ ] Operating hours are correctly displayed
- [ ] License/insurance numbers are included
- [ ] Reviews are attributed to actual customers
- [ ] Services listed match existing offerings
- [ ] No fictional information has been added

### Error Handling:

If any required information is missing:
1. Use placeholder text marked with \`[NEEDS ACTUAL: description]\`
2. Add HTML comments noting missing elements: \`<!-- TODO: Add actual business hours -->\`
3. Create the structure even if content is incomplete
4. List missing information in a comment block at the top of the file

---

## 🚀 FINAL OUTPUT INSTRUCTIONS

**Generate a complete, production-ready landing page that:**

1. **Converts visitors** into customers through strategic placement of CTAs, social proof, and trust signals
2. **Ranks well** in search engines by implementing all SEO recommendations
3. **Loads fast** with optimized code and performance best practices
4. **Works everywhere** with responsive design and cross-browser compatibility
5. **Builds trust** using real reviews, accurate business information, and professional design
6. **Drives action** with clear service descriptions, easy contact methods, and compelling offers

**Code Quality Standards:**
- Well-commented code explaining key sections
- Consistent indentation and formatting
- Meaningful class names using BEM or utility-first conventions
- No console errors or warnings
- Valid HTML5 and CSS3
- Graceful degradation for older browsers

**Before submitting, ensure:**
- The page tells a compelling story from problem → solution → action
- Every section has a clear purpose in the conversion funnel
- Mobile experience is as polished as desktop
- Contact methods are prominent and functional
- The business's unique value proposition is clear
- Local SEO elements are properly implemented
- The design reflects the business's professionalism and trustworthiness

---

**BEGIN CODING NOW** - Create a landing page that will significantly improve this business's online presence and customer acquisition.
`;
