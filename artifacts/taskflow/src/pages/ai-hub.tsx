import React from "react";
import { useSuggestTasks, useScheduleWorkload, useGetUserInsights, usePrioritizeTasks } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, Wand2, CalendarSync, SortAsc, Zap, Loader2, Link } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function AIHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = React.useState("");
  
  const suggestTasks = useSuggestTasks();
  const [suggestions, setSuggestions] = React.useState<any[]>([]);

  const handleSuggest = async () => {
    if (!prompt.trim()) return;
    try {
      const res = await suggestTasks.mutateAsync({ data: { prompt, projectId: 1 } }); // hardcoded for demo
      setSuggestions(res.suggestions);
      toast({ title: "Suggestions generated!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-primary" />
          AI Command Center
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Leverage intelligent tools to automate planning, optimize schedules, and extract insights from your team's workflow.
        </p>
      </div>

      <Tabs defaultValue="suggest" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="suggest">Task Gen</TabsTrigger>
          <TabsTrigger value="prioritize">Prioritize</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="suggest" className="mt-6 space-y-6">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                Natural Language Task Generation
              </CardTitle>
              <CardDescription>
                Describe what needs to be done, and AI will break it down into actionable, estimated tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="E.g., We need to build a user authentication system with email verification and password reset."
                className="min-h-[120px] resize-none text-base"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={handleSuggest} disabled={!prompt.trim() || suggestTasks.isPending}>
                  {suggestTasks.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  Generate Tasks
                </Button>
              </div>
              
              {suggestions.length > 0 && (
                <div className="pt-6 mt-6 border-t space-y-4">
                  <h3 className="font-semibold text-lg">Suggested Tasks</h3>
                  <div className="grid gap-4">
                    {suggestions.map((s, i) => (
                      <div key={i} className="p-4 rounded-lg border bg-muted/30">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{s.title}</h4>
                          <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded capitalize">
                            {s.priority} priority
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{s.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded border">
                            ~{s.estimatedHours} hours
                          </span>
                          <Button size="sm" variant="secondary">Add to Project</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prioritize" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SortAsc className="w-5 h-5 text-primary" />
                Smart Prioritization
              </CardTitle>
              <CardDescription>
                Select tasks and provide context. AI will determine the optimal execution order.
              </CardDescription>
            </CardHeader>
            <CardContent className="py-10 text-center text-muted-foreground border-t border-dashed m-6 mt-0">
              <SortAsc className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p>Select a project first to use the prioritization tool.</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/projects">Go to Projects</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-primary" />
                Personal Productivity Insights
              </CardTitle>
              <CardDescription>
                AI analysis of your work patterns, velocity, and focus areas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-background border shadow-sm flex items-center justify-center text-2xl font-bold text-primary">
                    85
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Productivity Score</h3>
                    <p className="text-sm text-muted-foreground">Top 15% of your team this week</p>
                  </div>
                </div>
                <div className="space-y-2 mt-6">
                  <h4 className="font-medium text-sm text-foreground">AI Observations:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside pl-4">
                    <li>You complete high-priority tasks 30% faster in the mornings.</li>
                    <li>You have a tendency to context-switch frequently on Wednesdays.</li>
                    <li>Recommendation: Block out 2 hours of deep work time for your upcoming architectural review.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
