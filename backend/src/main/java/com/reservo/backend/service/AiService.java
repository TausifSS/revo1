package com.reservo.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.reservo.backend.dto.AiChatRequest;
import com.reservo.backend.dto.AiChatResponse;
import com.reservo.backend.dto.AiItineraryRequest;
import com.reservo.backend.entity.AiChatMessage;
import com.reservo.backend.entity.AiChatSession;
import com.reservo.backend.entity.AiItinerary;
import com.reservo.backend.entity.Resort;
import com.reservo.backend.repository.AiChatMessageRepository;
import com.reservo.backend.repository.AiChatSessionRepository;
import com.reservo.backend.repository.AiItineraryRepository;
import com.reservo.backend.repository.ResortRepository;
import com.reservo.backend.repository.BookingRepository;
import com.reservo.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final AiChatSessionRepository sessionRepository;
    private final AiChatMessageRepository messageRepository;
    private final AiItineraryRepository itineraryRepository;
    private final ResortRepository resortRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    /**
     * Handles companion assistant queries. Logs interaction histories and attempts real-time LLM inference.
     */
    public AiChatResponse handleChat(AiChatRequest request) {
        String sessionId = request.getSessionId();
        if (sessionId == null || sessionId.trim().isEmpty()) {
            sessionId = "session-" + UUID.randomUUID().toString().substring(0, 8);
        }

        // Fetch or create session
        AiChatSession session = sessionRepository.findById(sessionId)
                .orElseGet(() -> {
                    AiChatSession s = AiChatSession.builder()
                            .id(request.getSessionId() != null ? request.getSessionId() : "session-" + UUID.randomUUID().toString().substring(0, 8))
                            .mood(request.getSelectedMood())
                            .build();
                    return sessionRepository.save(s);
                });

        // Save User Message
        AiChatMessage userMsg = AiChatMessage.builder()
                .sessionId(session.getId())
                .sender("user")
                .messageText(request.getMessage())
                .build();
        messageRepository.save(userMsg);

        // Formulate Response
        String responseText = "";
        Resort recommendation = null;

        // Try Gemini API first if configured
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            try {
                responseText = queryGeminiModel(request.getMessage(), request.getSelectedMood());
            } catch (Exception e) {
                log.warn("Gemini API call failed, falling back to mock concierge engine: {}", e.getMessage());
                responseText = generateLocalMockReply(request.getMessage(), request.getSelectedMood());
            }
        } else {
            responseText = generateLocalMockReply(request.getMessage(), request.getSelectedMood());
        }

        // Map resort recommendations dynamically
        recommendation = scanAndMatchResort(request.getMessage() + " " + responseText);

        // Save Rivo Response Message
        AiChatMessage rivoMsg = AiChatMessage.builder()
                .sessionId(session.getId())
                .sender("rivo")
                .messageText(responseText)
                .recommendedResortId(recommendation != null ? recommendation.getId() : null)
                .build();
        messageRepository.save(rivoMsg);

        return new AiChatResponse(
                "msg-" + UUID.randomUUID().toString().substring(0, 8),
                "rivo",
                responseText,
                recommendation
        );
    }

    /**
     * Generates a travel itinerary. Checks cache database prior to external LLM requests.
     */
    /**
     * Generates a travel itinerary. Checks cache database prior to external LLM requests.
     */
    public String generateItinerary(AiItineraryRequest request, String userEmail) {
        String dest = request.getDestination();
        int days = request.getDays();
        String budget = request.getBudget() != null ? request.getBudget() : "luxury";

        List<com.reservo.backend.entity.Booking> userBookings = new ArrayList<>();
        if (userEmail != null && !userEmail.equalsIgnoreCase("anonymousUser")) {
            userRepository.findByEmail(userEmail).ifPresent(u -> {
                userBookings.addAll(bookingRepository.findByUserId(u.getId()));
            });
        }

        List<Resort> activeResorts = resortRepository.findByLocationContainingIgnoreCase(dest);

        // 1. Check Cache
        Optional<AiItinerary> cached = itineraryRepository
                .findFirstByDestinationIgnoreCaseAndDurationDaysAndBudgetLevelIgnoreCase(dest, days, budget);
        if (cached.isPresent()) {
            log.info("Serving itinerary for {} ({} days, {}) from database cache.", dest, days, budget);
            return cached.get().getItineraryJson();
        }

        // 2. Resolve Itinerary JSON
        String itineraryJson = "";
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            try {
                itineraryJson = queryGeminiItinerary(dest, days, request.getInterests(), budget, userBookings, activeResorts);
            } catch (Exception e) {
                log.warn("Gemini Itinerary Generation failed. Using mock planner fallback: {}", e.getMessage());
                itineraryJson = generateLocalMockItinerary(dest, days, budget);
            }
        } else {
            itineraryJson = generateLocalMockItinerary(dest, days, budget);
        }

        // 3. Store Cache
        AiItinerary item = AiItinerary.builder()
                .destination(dest)
                .durationDays(days)
                .budgetLevel(budget)
                .itineraryJson(itineraryJson)
                .build();
        itineraryRepository.save(item);

        return itineraryJson;
    }

    /**
     * Retrieves previous sessions for a user
     */
    public List<AiChatSession> getUserSessions(String userId) {
        return sessionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // ── OUTBOUND REST QUERIES TO GEMINI API ───────────────────────────────────────────

    private String queryGeminiModel(String prompt, String mood) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

        List<Resort> resortsList = resortRepository.findAll();
        StringBuilder resortsCtx = new StringBuilder();
        resortsCtx.append("We have the following verified resorts in our database:\n");
        for (Resort r : resortsList) {
            resortsCtx.append("- ").append(r.getName()).append(" located at ").append(r.getLocation()).append(" (Price: ").append(r.getPricePerNight()).append(")\n");
        }

        String systemContext = "You are Rivo, the expert AI travel companion and concierge for Reservo.\n" +
                "Reservo is India's premium luxury booking platform for hand-verified resorts, villas, and boutique stays.\n" +
                "Reservo Platform Details & Policies:\n" +
                "1. Support: Available 24/7. Call our helpline or trigger the secure SIP dialer widget.\n" +
                "2. Stays Context:\n" + resortsCtx.toString() + "\n" +
                "3. Payments: Securely processed via Stripe cards, UPI codes, and Indian Netbanking.\n" +
                "4. Wishlists: Users must log in to add/save retreats in their wishlists.\n" +
                "5. Active user companion mood context: " + mood + ".\n" +
                "Guidelines: Give friendly, expert, premium, and very concise travel suggestions. Recommend only our verified resorts listed above. Keep your responses under 3 sentences.";

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> contentMap = new HashMap<>();
        Map<String, Object> partMap = new HashMap<>();
        partMap.put("text", systemContext + "\nUser Message: " + prompt);
        contentMap.put("parts", Collections.singletonList(partMap));
        requestBody.put("contents", Collections.singletonList(contentMap));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
        return parseTextFromGeminiResponse(response);
    }

    private String queryGeminiItinerary(String dest, int days, List<String> interests, String budget, 
                                        List<com.reservo.backend.entity.Booking> bookings, 
                                        List<Resort> resorts) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

        StringBuilder context = new StringBuilder();
        context.append("You are Rivo, Reservo's travel buddy. Generate a realistic JSON itinerary.\n");
        if (bookings != null && !bookings.isEmpty()) {
            context.append("User has confirmed bookings in ").append(dest).append(":\n");
            for (com.reservo.backend.entity.Booking b : bookings) {
                if (b.getResortId() != null) {
                    Resort bookedResort = resortRepository.findById(b.getResortId()).orElse(null);
                    if (bookedResort != null && bookedResort.getLocation() != null
                            && bookedResort.getLocation().toLowerCase().contains(dest.toLowerCase())) {
                        context.append("- Resort: ").append(bookedResort.getName())
                               .append(" (Address: ").append(bookedResort.getLocation()).append(")")
                               .append(" from ").append(b.getCheckInDate()).append(" to ").append(b.getCheckOutDate()).append("\n");
                    }
                }
            }
        }

        if (resorts != null && !resorts.isEmpty()) {
            context.append("Approved partner resorts available to suggest in ").append(dest).append(":\n");
            for (Resort r : resorts) {
                context.append("- ").append(r.getName()).append(" in ").append(r.getLocation())
                       .append(" (Price: ").append(r.getPricePerNight()).append(" per night, rating: ").append(r.getRating()).append(")\n");
            }
        }

        String systemPrompt = context.toString();
        String promptText = String.format("%s\nGenerate a %d-day itinerary for %s. Interests: %s. Budget: %s. Use the user's booked stay details for their activities on those days, and recommend our approved partner resorts for accommodation or dinners.",
            systemPrompt, days, dest, String.join(", ", interests), budget);

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> contentMap = new HashMap<>();
        Map<String, Object> partMap = new HashMap<>();
        partMap.put("text", promptText);
        contentMap.put("parts", Collections.singletonList(partMap));
        requestBody.put("contents", Collections.singletonList(contentMap));

        // Enforce structured schema
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("responseMimeType", "application/json");

        Map<String, Object> schema = new HashMap<>();
        schema.put("type", "OBJECT");
        Map<String, Object> props = new HashMap<>();
        props.put("destination", Map.of("type", "STRING"));
        props.put("days", Map.of("type", "INTEGER"));

        Map<String, Object> timelineSchema = new HashMap<>();
        timelineSchema.put("type", "ARRAY");
        Map<String, Object> timelineItem = new HashMap<>();
        timelineItem.put("type", "OBJECT");
        Map<String, Object> timelineProps = new HashMap<>();
        timelineProps.put("day", Map.of("type", "INTEGER"));
        timelineProps.put("theme", Map.of("type", "STRING"));

        Map<String, Object> activitiesSchema = new HashMap<>();
        activitiesSchema.put("type", "ARRAY");
        Map<String, Object> activityItem = new HashMap<>();
        activityItem.put("type", "OBJECT");
        activityItem.put("properties", Map.of(
                "time", Map.of("type", "STRING"),
                "title", Map.of("type", "STRING"),
                "description", Map.of("type", "STRING")
        ));
        activitiesSchema.put("items", activityItem);
        timelineProps.put("activities", activitiesSchema);

        timelineItem.put("properties", timelineProps);
        timelineSchema.put("items", timelineItem);
        props.put("timeline", timelineSchema);

        schema.put("properties", props);
        generationConfig.put("responseSchema", schema);
        requestBody.put("generationConfig", generationConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
        return parseTextFromGeminiResponse(response);
    }

    private String parseTextFromGeminiResponse(Map<String, Object> response) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            Map<String, Object> firstCandidate = candidates.get(0);
            Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            log.error("Failed to parse Gemini response payload:", e);
            throw new RuntimeException("Malformed Gemini API payload");
        }
    }

    // ── LOCAL MOCK FALLBACK ENGINES ──────────────────────────────────────────────────

    private String generateLocalMockReply(String message, String mood) {
        String msg = message.toLowerCase();
        if (msg.contains("available") || msg.contains("resort") || msg.contains("list")) {
            List<Resort> approved = resortRepository.findByStatus(Resort.ResortStatus.APPROVED);
            if (approved == null || approved.isEmpty()) {
                return "We currently don't have any live resorts in our system, but our default collections are: Ocean Bliss Resort, Royal Palm Retreat, Sunset Lagoon, and Hill View Escape.";
            }
            StringBuilder sb = new StringBuilder();
            sb.append("Here are our available luxury resorts:\n");
            for (Resort r : approved) {
                sb.append("- ").append(r.getName()).append(" in ").append(r.getLocation()).append(" (₹").append(r.getPricePerNight()).append("/night)\n");
            }
            return sb.toString();
        }
        if (msg.contains("hello") || msg.contains("hi ")) {
            return "Greetings! I'm Rivo, your luxury travel guide. Are you looking to plan a relaxation getaway, explore adventurous mountains, or find beachfront suite deals?";
        }
        if (msg.contains("goa") || msg.contains("beach")) {
            return "Goa offers beautiful sandy shores and spectacular sunsets. I highly suggest looking at the Ocean Bliss Resort which has private beach lounge options and premium suites.";
        }
        if (msg.contains("bali") || msg.contains("palm") || msg.contains("indonesia")) {
            return "Bali is wonderful! The Royal Palm Retreat is perfect if you want tropical infinity pools and scenic villa views.";
        }
        if (msg.contains("maldives") || msg.contains("lagoon") || msg.contains("water")) {
            return "If you seek overwater bungalows and private butler service, Sunset Lagoon Resort in the Maldives is our top recommended escape.";
        }
        if (msg.contains("udaipur") || msg.contains("palace") || msg.contains("rajasthan")) {
            return "For a royal heritage experience overlooking Lake Pichola, you will love the Hill View Escape in Udaipur.";
        }

        // Mood-based default replies
        if ("luxury".equalsIgnoreCase(mood)) {
            return "Greetings from Rivo Luxury Concierge. I've highlighted properties offering VIP airport private pickups, infinity pools, and round-the-clock room dining service.";
        }
        if ("budget".equalsIgnoreCase(mood)) {
            return "Welcome! I've filtered our verified collections for smart luxury deals under ₹15,000 per night.";
        }
        if ("adventure".equalsIgnoreCase(mood)) {
            return "Looking for a thrill? Let's check out our mountain view retreats offering guided safaris, watersports, and trekking trails.";
        }

        return "Interesting query! I can help you search resorts, book suites, or generate custom travel plans. Let me know where you'd like to fly!";
    }

    private Resort scanAndMatchResort(String text) {
        String checkText = text.toLowerCase();
        List<Resort> approved = resortRepository.findByStatus(Resort.ResortStatus.APPROVED);
        for (Resort r : approved) {
            if (checkText.contains(r.getName().toLowerCase()) || checkText.contains(r.getLocation().toLowerCase().split(",")[0])) {
                return r;
            }
        }
        return null;
    }

    private String generateLocalMockItinerary(String dest, int days, String budget) {
        // Return a beautifully structured JSON itinerary matching our frontend expectations
        StringBuilder json = new StringBuilder();
        json.append("{\n");
        json.append("  \"destination\": \"").append(dest).append("\",\n");
        json.append("  \"days\": ").append(days).append(",\n");
        json.append("  \"timeline\": [\n");

        for (int d = 1; d <= days; d++) {
            json.append("    {\n");
            json.append("      \"day\": ").append(d).append(",\n");
            if (d == 1) {
                json.append("      \"theme\": \"Arrival and Concierge Leisure\",\n");
                json.append("      \"activities\": [\n");
                json.append("        { \"time\": \"10:00 AM\", \"title\": \"Arrival & Welcome Lounge Check-in\", \"description\": \"Check-in at your resort. Enjoy cold brew teas and signature welcome mocktails.\" },\n");
                json.append("        { \"time\": \"03:00 PM\", \"title\": \"Concierge Property Tour\", \"description\": \"Guided overview of the private lagoon, spa houses, and dining lounges.\" },\n");
                json.append("        { \"time\": \"07:30 PM\", \"title\": \"Sunset Beach Dinner\", \"description\": \"Luxury multi-course candlelit dinner with ocean wave music.\" }\n");
            } else if (d == 2) {
                json.append("      \"theme\": \"Luxury Adventure & Spa Wellness\",\n");
                json.append("      \"activities\": [\n");
                json.append("        { \"time\": \"08:00 AM\", \"title\": \"Yoga & Ocean-view Breakfast\", \"description\": \"Morning yoga session followed by a curated organic buffet buffet.\" },\n");
                json.append("        { \"time\": \"01:00 PM\", \"title\": \"Guided Excursions\", \"description\": \"Trekking local trails or water-sports with verified safety guides.\" },\n");
                json.append("        { \"time\": \"05:30 PM\", \"title\": \"Soma Spa Retreat\", \"description\": \"Relaxing therapeutic massages utilizing local herbal oils.\" }\n");
            } else {
                json.append("      \"theme\": \"Cultural Shopping & Departure\",\n");
                json.append("      \"activities\": [\n");
                json.append("        { \"time\": \"09:30 AM\", \"title\": \"Local Craft Tour\", \"description\": \"Visit nearby artisan shops and souvenir stands accompanied by our resort driver.\" },\n");
                json.append("        { \"time\": \"01:00 PM\", \"title\": \"Checkout & Private Airport Shuttle\", \"description\": \"Bidding farewell to the sanctuary and returning to the airport lounge.\" }\n");
            }
            json.append("      ]\n");
            json.append("    }").append(d < days ? ",\n" : "\n");
        }

        json.append("  ]\n");
        json.append("}");

        return json.toString();
    }
}
