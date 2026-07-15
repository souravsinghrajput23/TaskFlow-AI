import groq from '../config/groq';

// Fallback generators in case GROQ_API_KEY is not set or fails
const getMockDescription = (title: string): string => {
  return `### Description
This task is to implement the **${title}** module. It includes the user interface integration, backend controllers support, and validation logic.

### Acceptance Criteria
- [ ] UI is fully responsive and matches the mockup design system.
- [ ] Unit tests cover core scenarios (minimum 80% coverage).
- [ ] Error handling handles all edge cases and returns readable notifications.
- [ ] API routes are documented and tested successfully in Postman.

### Recommended Priority
**MEDIUM**`;
};

const getMockSubtasks = (title: string): string[] => {
  return [
    `Setup repository branch for ${title}`,
    `Create REST API endpoints and define request validator schemas`,
    `Build UI page and connect with integration endpoints`,
    `Write unit and integration tests`,
    `Perform code review and merge branch`
  ];
};

const getMockDeadline = (title: string): { estimatedTime: string; reason: string } => {
  return {
    estimatedTime: '3 Days',
    reason: `Requires setup of frontend layout and backend integration APIs for ${title}, followed by regression testing.`
  };
};

const getMockSummary = (completedTasks: string[]): string => {
  if (completedTasks.length === 0) {
    return "No tasks were marked as completed today. Encourage the team to log progress on active tasks.";
  }
  return `Today your team made great progress by completing ${completedTasks.length} task(s), including: ${completedTasks.join(', ')}. Key features are now functional and ready for QA testing.`;
};

const getMockSuggestions = (metrics: { total: number; completed: number; pending: number; overdue: number }): string => {
  const { total, completed, pending, overdue } = metrics;
  return `### Project Health Insights
- **Overdue Tasks Warning**: There are currently **${overdue}** overdue tasks. We recommend re-assessing deadlines or redistributing the workload.
- **Resource Balancing**: With **${pending}** tasks pending and a completion rate of **${total > 0 ? Math.round((completed / total) * 100) : 0}%**, consider breaking large epics into smaller, 1-day subtasks.
- **Priority Check**: Ensure high priority tasks are assigned to active team members to reduce bottlenecks.`;
};

export class AiService {
  private static isMockMode(): boolean {
    const key = process.env.GROQ_API_KEY;
    return !key || key === 'gsk_placeholder_key' || key.trim() === '';
  }

  static async generateDescription(title: string): Promise<string> {
    if (this.isMockMode()) {
      console.log('GROQ API Key placeholder detected. Using mock Task Description Generator.');
      return getMockDescription(title);
    }

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert project manager. Generate a professional description and acceptance criteria in Markdown for the given task title. Also recommend a priority (LOW, MEDIUM, HIGH).'
          },
          {
            role: 'user',
            content: `Task Title: ${title}`
          }
        ],
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || getMockDescription(title);
    } catch (error) {
      console.error('Error generating description from Groq:', error);
      return getMockDescription(title);
    }
  }

  static async generateSubtasks(title: string, description?: string): Promise<string[]> {
    if (this.isMockMode()) {
      console.log('GROQ API Key placeholder detected. Using mock Subtask Generator.');
      return getMockSubtasks(title);
    }

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert software planner. Return ONLY a valid JSON array of strings containing subtasks for the task description. Do not return markdown format like ```json, just output raw JSON text array. No explanation.'
          },
          {
            role: 'user',
            content: `Task: ${title}\nDescription: ${description || 'N/A'}`
          }
        ],
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content?.trim() || '';
      // Clean up potential markdown formatting code blocks if Groq added them
      const jsonStr = content.replace(/^```json/, '').replace(/```$/, '').trim();
      return JSON.parse(jsonStr) as string[];
    } catch (error) {
      console.error('Error generating subtasks from Groq, falling back:', error);
      return getMockSubtasks(title);
    }
  }

  static async suggestDeadline(title: string, description?: string): Promise<{ estimatedTime: string; reason: string }> {
    if (this.isMockMode()) {
      console.log('GROQ API Key placeholder detected. Using mock Deadline Suggestion.');
      return getMockDeadline(title);
    }

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a technical estimator. Based on the task title and description, suggest a realistic estimated time and brief reason. Return ONLY a valid JSON object with keys: "estimatedTime" (string) and "reason" (string). No markdown formatting.'
          },
          {
            role: 'user',
            content: `Task: ${title}\nDescription: ${description || 'N/A'}`
          }
        ],
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content?.trim() || '';
      const jsonStr = content.replace(/^```json/, '').replace(/```$/, '').trim();
      return JSON.parse(jsonStr) as { estimatedTime: string; reason: string };
    } catch (error) {
      console.error('Error suggesting deadline from Groq, falling back:', error);
      return getMockDeadline(title);
    }
  }

  static async generateDailySummary(completedTasks: string[]): Promise<string> {
    if (this.isMockMode()) {
      console.log('GROQ API Key placeholder detected. Using mock Daily Progress Summary.');
      return getMockSummary(completedTasks);
    }

    if (completedTasks.length === 0) {
      return "No tasks completed today.";
    }

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a Scrum Master. Summarize the completed tasks into a single brief paragraph highlighting team achievements.'
          },
          {
            role: 'user',
            content: `Completed tasks today: ${completedTasks.join(', ')}`
          }
        ],
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content?.trim() || getMockSummary(completedTasks);
    } catch (error) {
      console.error('Error generating summary from Groq, falling back:', error);
      return getMockSummary(completedTasks);
    }
  }

  static async generateProjectSuggestions(metrics: { total: number; completed: number; pending: number; overdue: number }): Promise<string> {
    if (this.isMockMode()) {
      console.log('GROQ API Key placeholder detected. Using mock Project Suggestions.');
      return getMockSuggestions(metrics);
    }

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a delivery lead. Suggest 3 project management improvement tips based on the following project metrics. Focus on task completion, backlog health, and team productivity. Provide output in markdown.'
          },
          {
            role: 'user',
            content: `Total Tasks: ${metrics.total}\nCompleted Tasks: ${metrics.completed}\nPending Tasks: ${metrics.pending}\nOverdue Tasks: ${metrics.overdue}`
          }
        ],
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content?.trim() || getMockSuggestions(metrics);
    } catch (error) {
      console.error('Error generating suggestions from Groq, falling back:', error);
      return getMockSuggestions(metrics);
    }
  }
}
