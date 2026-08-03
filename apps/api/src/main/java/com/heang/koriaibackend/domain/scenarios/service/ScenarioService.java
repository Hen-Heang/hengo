package com.heang.koriaibackend.domain.scenarios.service;

import com.heang.koriaibackend.common.utils.RandomUtils;
import com.heang.koriaibackend.domain.scenarios.dto.ScenarioResponse;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ScenarioService {

    private static final List<ScenarioResponse> SCENARIOS = List.of(
            new ScenarioResponse("1", "Ordering at a Restaurant", "Daily Life", "Beginner",
                    "Practice ordering food and drinks in Korean", "Order a full meal politely",
                    "안녕하세요! 식당에 오신 것을 환영합니다. 무엇을 주문하시겠어요? (Hello! Welcome to the restaurant. What would you like to order?)"),
            new ScenarioResponse("2", "At the Convenience Store", "Daily Life", "Beginner",
                    "Buy items and ask about prices", "Complete a purchase using Korean numbers and polite speech",
                    "어서오세요! 찾으시는 게 있으신가요? (Welcome! Is there something you're looking for?)"),
            new ScenarioResponse("3", "Taking the Subway", "Transport", "Beginner",
                    "Ask for directions and buy a subway ticket", "Navigate the Seoul subway in Korean",
                    "실례합니다. 명동역은 어느 방향인가요? (Excuse me. Which direction is Myeongdong station?)"),
            new ScenarioResponse("4", "Job Interview", "Professional", "Intermediate",
                    "Practice formal Korean in a job interview context", "Introduce yourself and answer interview questions formally",
                    "안녕하세요. 오늘 면접을 보러 온 지원자입니다. 잘 부탁드립니다. (Hello. I am the applicant here for today's interview. I look forward to working with you.)"),
            new ScenarioResponse("5", "Visiting a Doctor", "Health", "Intermediate",
                    "Describe symptoms and understand medical advice", "Communicate health issues clearly in Korean",
                    "어디가 불편하세요? 증상이 언제부터 시작됐나요? (Where does it hurt? When did the symptoms start?)"),
            new ScenarioResponse("6", "Making Friends at University", "Social", "Intermediate",
                    "Small talk and getting to know someone", "Have a natural conversation with a new Korean friend",
                    "안녕하세요! 저도 이 수업 듣는데, 혹시 어느 학과예요? (Hi! I'm also in this class, what's your major?)"),
            new ScenarioResponse("7", "Business Negotiation", "Professional", "Advanced",
                    "Negotiate terms and discuss business proposals in formal Korean", "Complete a business deal using honorific speech",
                    "오늘 미팅에 참석해 주셔서 감사드립니다. 제안서를 검토하셨는지요? (Thank you for attending today's meeting. Have you reviewed our proposal?)"),
            new ScenarioResponse("8", "Discussing Current Events", "Culture", "Advanced",
                    "Talk about news, politics, and social issues in Korean", "Express complex opinions fluently",
                    "최근 뉴스에서 흥미로운 기사를 보셨나요? 어떻게 생각하세요? (Have you seen any interesting news recently? What do you think?)"),
            new ScenarioResponse("9", "Daily Standup Meeting", "Workplace", "Intermediate",
                    "Report yesterday's progress, today's plan, and blockers in Korean", "Give a clear standup update using workplace honorifics",
                    "어제 작업한 내용부터 공유해 주시겠어요? (Could you share what you worked on yesterday first?)"),
            new ScenarioResponse("10", "Requesting Time Off", "Workplace", "Intermediate",
                    "Ask your manager for leave and explain the reason politely", "Get approval for time off using appropriate formality",
                    "팀장님, 다음 주에 휴가를 신청하고 싶은데 괜찮으실까요? (Team lead, I'd like to request a vacation next week, would that be okay?)"),
            new ScenarioResponse("11", "1-on-1 with Your Manager", "Workplace", "Intermediate",
                    "Discuss your performance and career goals with your manager", "Talk about progress, challenges, and goals using polite speech",
                    "이번 주에 일하시면서 어려운 점은 없으셨나요? (Were there any difficulties while working this week?)"),
            new ScenarioResponse("12", "Apologizing for a Mistake at Work", "Workplace", "Intermediate",
                    "Own up to an error and explain how you'll fix it", "Apologize sincerely and propose next steps in formal Korean",
                    "이번 실수에 대해 어떻게 된 일인지 설명해 주시겠어요? (Could you explain what happened with this mistake?)"),
            new ScenarioResponse("13", "First Day Greeting Coworkers", "Workplace", "Beginner",
                    "Introduce yourself to new colleagues on your first day", "Make a good first impression using polite self-introduction",
                    "안녕하세요, 새로 입사하신 분이시죠? 환영합니다! (Hello, you must be the new hire? Welcome!)")
    );

    public List<ScenarioResponse> getList() {
        return SCENARIOS;
    }

    public Optional<ScenarioResponse> getById(String id) {
        return SCENARIOS.stream().filter(s -> s.id().equals(id)).findFirst();
    }

    public ScenarioResponse getRandom() {
        return RandomUtils.pickRandom(SCENARIOS);
    }

    public ScenarioResponse getRandomByLevel(String level) {
        List<ScenarioResponse> matching = SCENARIOS.stream()
                .filter(s -> s.level().equalsIgnoreCase(level))
                .toList();
        List<ScenarioResponse> pool = matching.isEmpty() ? SCENARIOS : matching;
        return RandomUtils.pickRandom(pool);
    }
}
