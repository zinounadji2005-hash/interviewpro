import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Privacy() {
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
            <CardTitle className="text-2xl sm:text-3xl font-heading">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: January 2026</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-240px)] sm:h-[calc(100vh-280px)]">
              <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
                <section>
                  <h2>1. Introduction</h2>
                  <p>
                    Your privacy is important to us. This Privacy Policy explains how InterviewPro 
                    collects, uses, stores, and protects your personal information when you use 
                    our AI-powered career preparation platform.
                  </p>
                </section>

                <section>
                  <h2>2. Information We Collect</h2>
                  <h3>Account Information</h3>
                  <ul>
                    <li>Name (first and last name)</li>
                    <li>Email address</li>
                    <li>Account credentials (password is securely hashed)</li>
                  </ul>

                  <h3>CV and Career Information</h3>
                  <ul>
                    <li>CV/resume content that you upload</li>
                    <li>Target job roles and descriptions you provide</li>
                    <li>Career history and skills extracted from your CV</li>
                  </ul>

                  <h3>Interview Practice Data</h3>
                  <ul>
                    <li>Your answers during mock interviews</li>
                    <li>Voice recordings (if you use voice interview features)</li>
                    <li>Performance scores and feedback</li>
                    <li>Session history and progress data</li>
                  </ul>

                  <h3>Usage Information</h3>
                  <ul>
                    <li>How you interact with our platform</li>
                    <li>Features you use and frequency of use</li>
                    <li>Technical information (browser type, device type)</li>
                  </ul>
                </section>

                <section>
                  <h2>3. How We Use Your Information</h2>
                  <p>We use your information to:</p>
                  <ul>
                    <li><strong>Provide our services:</strong> Process your CV, generate interview questions, and provide feedback</li>
                    <li><strong>Improve your experience:</strong> Track your progress and personalize recommendations</li>
                    <li><strong>Enhance our platform:</strong> Improve AI accuracy and develop new features</li>
                    <li><strong>Communicate with you:</strong> Send service updates and respond to support requests</li>
                    <li><strong>Ensure security:</strong> Protect against fraud and unauthorized access</li>
                  </ul>
                </section>

                <section>
                  <h2>4. Data Storage and Security</h2>
                  <p>
                    We take your data security seriously and implement appropriate measures to 
                    protect your information:
                  </p>
                  <ul>
                    <li>Data is stored on secure, encrypted servers</li>
                    <li>Passwords are hashed using industry-standard algorithms</li>
                    <li>Access to user data is strictly controlled and limited</li>
                    <li>We use secure HTTPS connections for all data transmission</li>
                    <li>Regular security reviews and updates are performed</li>
                  </ul>
                </section>

                <section>
                  <h2>5. Data Sharing and Third Parties</h2>
                  <p>
                    <strong>Your CVs and interview data are NOT shared with third parties.</strong>
                  </p>
                  <p>We may share limited information only in these circumstances:</p>
                  <ul>
                    <li><strong>Service providers:</strong> We use AI services to power our features. Your data is processed to provide these features but is not retained by these providers for other purposes.</li>
                    <li><strong>Legal requirements:</strong> If required by law or valid legal process</li>
                    <li><strong>Safety:</strong> To protect the safety of users or the public</li>
                  </ul>
                  <p>
                    We do not sell your personal information to anyone.
                  </p>
                </section>

                <section>
                  <h2>6. Data Retention</h2>
                  <p>
                    We retain your data for as long as your account is active or as needed to 
                    provide our services. Specifically:
                  </p>
                  <ul>
                    <li><strong>Account data:</strong> Retained while your account is active</li>
                    <li><strong>CV data:</strong> Retained until you delete it or close your account</li>
                    <li><strong>Interview sessions:</strong> Retained for your progress tracking</li>
                    <li><strong>Voice recordings:</strong> Processed for transcription and deleted after session completion</li>
                  </ul>
                  <p>
                    After account deletion, we remove your personal data within 30 days, 
                    except where retention is required by law.
                  </p>
                </section>

                <section>
                  <h2>7. Your Rights</h2>
                  <p>You have the following rights regarding your personal data:</p>
                  <ul>
                    <li><strong>Right to Access:</strong> Request a copy of all personal data we hold about you</li>
                    <li><strong>Right to Correction:</strong> Update or correct any inaccurate or incomplete information</li>
                    <li><strong>Right to Deletion:</strong> Request complete deletion of your account and associated data</li>
                    <li><strong>Right to Data Portability:</strong> Download your CV and interview history in a common format</li>
                    <li><strong>Right to Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
                    <li><strong>Right to Restrict Processing:</strong> Request that we limit how we use your data</li>
                  </ul>
                  
                  <h3>How to Exercise Your Rights</h3>
                  <p>To exercise any of these rights, you can:</p>
                  <ol>
                    <li><strong>Self-Service (Recommended):</strong> Use the account settings and profile pages within the platform to update your information or manage your data</li>
                    <li><strong>Support Request:</strong> Contact our support team through the platform with your request</li>
                    <li><strong>Written Request:</strong> Submit a formal request through our help or support feature</li>
                  </ol>
                  <p>
                    When submitting a request, please provide your account email and a clear 
                    description of the action you would like us to take. We will verify your 
                    identity before processing requests to protect your privacy.
                  </p>
                  <p>
                    <strong>Response Time:</strong> We will acknowledge your request within 
                    5 business days and aim to fulfill valid requests within 30 days. If we 
                    need additional time, we will inform you of the reason and expected timeline.
                  </p>
                </section>

                <section>
                  <h2>8. Cookies and Analytics</h2>
                  <p>
                    We use essential cookies to maintain your session and remember your preferences. 
                    We may use analytics to understand how our platform is used and improve our 
                    services. You can manage cookie preferences through your browser settings.
                  </p>
                </section>

                <section>
                  <h2>9. Children's Privacy</h2>
                  <p>
                    InterviewPro is designed for adults preparing for professional employment. 
                    We do not knowingly collect personal information from children under 16. 
                    If you believe a child has provided us with personal information, 
                    please contact us immediately.
                  </p>
                </section>

                <section>
                  <h2>10. Changes to This Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you 
                    of significant changes via email or through the platform. The "Last updated" 
                    date at the top indicates when this policy was last revised.
                  </p>
                </section>

                <section>
                  <h2>11. Contact Us</h2>
                  <p>
                    If you have questions about this Privacy Policy or how we handle your data, 
                    please contact us through the platform or at our support channels.
                  </p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
