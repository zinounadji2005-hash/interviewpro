import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background py-4 sm:py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl font-heading">Terms of Use</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: January 2026</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-240px)] sm:h-[calc(100vh-280px)]">
              <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
                <section>
                  <h2>1. Acceptance of Terms</h2>
                  <p>
                    By accessing or using InterviewPro, you agree to be bound by these Terms of Use. 
                    If you do not agree to these terms, please do not use our service.
                  </p>
                </section>

                <section>
                  <h2>2. Description of Service</h2>
                  <p>
                    InterviewPro is an AI-powered career preparation platform that provides:
                  </p>
                  <ul>
                    <li>CV/resume analysis and optimization suggestions</li>
                    <li>Mock interview practice with AI-generated questions</li>
                    <li>Performance feedback and scoring</li>
                    <li>Progress tracking and improvement recommendations</li>
                  </ul>
                  <p>
                    <strong>Important:</strong> InterviewPro is a preparation tool designed to help you 
                    improve your interview skills. We do not guarantee employment, interview success, 
                    or any specific outcomes. Your results depend on many factors beyond our control.
                  </p>
                </section>

                <section>
                  <h2>3. User Responsibilities</h2>
                  <p>By using InterviewPro, you agree to:</p>
                  <ul>
                    <li>Provide accurate and truthful information about yourself</li>
                    <li>Only upload CVs and documents that belong to you</li>
                    <li>Use the service for legitimate career preparation purposes</li>
                    <li>Maintain the confidentiality of your account credentials</li>
                    <li>Not share your account with others</li>
                  </ul>
                </section>

                <section>
                  <h2>4. Prohibited Activities</h2>
                  <p>You may not:</p>
                  <ul>
                    <li>Upload CVs or documents belonging to other individuals</li>
                    <li>Impersonate another person or misrepresent your identity</li>
                    <li>Create multiple accounts to circumvent credit limits or restrictions</li>
                    <li>Attempt to reverse engineer, copy, or exploit our AI systems</li>
                    <li>Use the service for any illegal or fraudulent purposes</li>
                    <li>Abuse, harass, or send inappropriate content through the platform</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                  </ul>
                </section>

                <section>
                  <h2>5. Account Suspension and Termination</h2>
                  <p>
                    We reserve the right to suspend or terminate your account if you:
                  </p>
                  <ul>
                    <li>Violate these Terms of Use</li>
                    <li>Engage in prohibited activities</li>
                    <li>Provide false or misleading information</li>
                    <li>Abuse the platform or other users</li>
                  </ul>
                  <p>
                    We will make reasonable efforts to notify you before taking such action, 
                    except in cases of serious violations.
                  </p>
                </section>

                <section>
                  <h2>6. Intellectual Property</h2>
                  <p>
                    The InterviewPro platform, including its design, features, and AI technology, 
                    is owned by us and protected by intellectual property laws. You retain ownership 
                    of any content you upload, including your CV and interview responses.
                  </p>
                  <p>
                    By using our service, you grant us a limited license to process your content 
                    for the purpose of providing our services.
                  </p>
                </section>

                <section>
                  <h2>7. AI-Generated Content Disclaimer</h2>
                  <p>
                    Our AI provides suggestions, feedback, and evaluations to help you improve. 
                    However:
                  </p>
                  <ul>
                    <li>AI-generated content is advisory and not professional career advice</li>
                    <li>AI may produce imperfect, incomplete, or occasionally inaccurate results</li>
                    <li>You are responsible for reviewing and deciding how to use AI suggestions</li>
                    <li>Final decisions about your CV and interview approach remain yours</li>
                  </ul>
                </section>

                <section>
                  <h2>8. Limitation of Liability</h2>
                  <p>
                    InterviewPro is provided "as is" without warranties of any kind. To the maximum 
                    extent permitted by law, we are not liable for:
                  </p>
                  <ul>
                    <li>Employment outcomes or interview results</li>
                    <li>Decisions made based on AI feedback</li>
                    <li>Loss of data or service interruptions</li>
                    <li>Any indirect, incidental, or consequential damages</li>
                  </ul>
                  <p>
                    Our total liability shall not exceed the amount you paid for the service 
                    in the 12 months preceding any claim.
                  </p>
                </section>

                <section>
                  <h2>9. Changes to Terms</h2>
                  <p>
                    We may update these Terms of Use from time to time. We will notify you of 
                    significant changes via email or through the platform. Continued use after 
                    changes constitutes acceptance of the updated terms.
                  </p>
                </section>

                <section>
                  <h2>10. Governing Law and Dispute Resolution</h2>
                  <p>
                    These Terms of Use and any disputes arising from your use of InterviewPro 
                    shall be governed by the laws of the jurisdiction where our company is registered.
                  </p>
                  <h3>Dispute Resolution Process</h3>
                  <p>In the event of a dispute, we encourage the following resolution process:</p>
                  <ol>
                    <li><strong>Informal Resolution:</strong> Contact our support team first. Most 
                    issues can be resolved quickly through direct communication.</li>
                    <li><strong>Good-Faith Negotiation:</strong> If informal resolution fails, both 
                    parties agree to attempt good-faith negotiation for at least 30 days before 
                    pursuing other remedies.</li>
                    <li><strong>Mediation:</strong> If negotiation is unsuccessful, either party may 
                    request non-binding mediation to resolve the dispute.</li>
                    <li><strong>Legal Proceedings:</strong> If all other methods fail, disputes may 
                    be submitted to the appropriate courts having jurisdiction.</li>
                  </ol>
                  <p>
                    You agree to provide written notice of any dispute to us before initiating 
                    legal proceedings. This notice should include your name, account details, 
                    a description of the issue, and the resolution you seek.
                  </p>
                </section>

                <section>
                  <h2>11. Severability</h2>
                  <p>
                    If any provision of these Terms is found to be unenforceable or invalid, 
                    that provision shall be limited or eliminated to the minimum extent necessary 
                    so that these Terms shall otherwise remain in full force and effect.
                  </p>
                </section>

                <section>
                  <h2>12. Contact Us</h2>
                  <p>
                    If you have questions about these Terms of Use, please contact us:
                  </p>
                  <ul>
                    <li><strong>Through the Platform:</strong> Use the support or help feature within your account</li>
                    <li><strong>Response Time:</strong> We aim to respond to all inquiries within 5 business days</li>
                  </ul>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
