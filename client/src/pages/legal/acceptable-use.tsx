import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AcceptableUse() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-heading">Acceptable Use Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: January 2026</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
                <section>
                  <h2>1. Purpose</h2>
                  <p>
                    This Acceptable Use Policy outlines the rules and guidelines for using 
                    InterviewPro. By using our platform, you agree to follow these guidelines 
                    to ensure a safe and productive experience for all users.
                  </p>
                </section>

                <section>
                  <h2>2. Permitted Use</h2>
                  <p>InterviewPro is designed for:</p>
                  <ul>
                    <li>Personal career preparation and interview practice</li>
                    <li>Optimizing and improving your own CV/resume</li>
                    <li>Practicing interview skills with AI-generated questions</li>
                    <li>Tracking your progress and identifying areas for improvement</li>
                  </ul>
                </section>

                <section>
                  <h2>3. Prohibited Activities</h2>
                  <p>
                    The following activities are strictly prohibited and may result in 
                    immediate account suspension or termination:
                  </p>

                  <h3>Identity and Document Violations</h3>
                  <ul>
                    <li><strong>Uploading others' CVs:</strong> You may only upload CVs that belong to you. Uploading someone else's CV is a violation of their privacy and our terms.</li>
                    <li><strong>Identity misrepresentation:</strong> Creating an account under a false identity or impersonating another person.</li>
                    <li><strong>Document forgery:</strong> Uploading fake, fabricated, or fraudulent documents.</li>
                  </ul>

                  <h3>Account Abuse</h3>
                  <ul>
                    <li><strong>Multiple accounts:</strong> Creating multiple accounts to circumvent credit limits, bypass restrictions, or abuse free trials.</li>
                    <li><strong>Account sharing:</strong> Sharing your account credentials with others or allowing others to use your account.</li>
                    <li><strong>Credit manipulation:</strong> Attempting to fraudulently obtain or manipulate credits.</li>
                  </ul>

                  <h3>Technical Abuse</h3>
                  <ul>
                    <li><strong>Reverse engineering:</strong> Attempting to reverse engineer, decompile, or extract our AI models or algorithms.</li>
                    <li><strong>Automated access:</strong> Using bots, scrapers, or automated tools to access our service without permission.</li>
                    <li><strong>System exploitation:</strong> Attempting to exploit vulnerabilities, bypass security measures, or gain unauthorized access.</li>
                    <li><strong>Data harvesting:</strong> Collecting or scraping data from our platform.</li>
                  </ul>

                  <h3>Content Violations</h3>
                  <ul>
                    <li><strong>Illegal content:</strong> Submitting content that is illegal, harmful, or promotes illegal activities.</li>
                    <li><strong>Offensive material:</strong> Uploading content that is harassing, discriminatory, or otherwise inappropriate.</li>
                    <li><strong>Spam:</strong> Using the platform to send unsolicited messages or content.</li>
                  </ul>

                  <h3>Misuse of Service</h3>
                  <ul>
                    <li><strong>Non-career purposes:</strong> Using the platform for purposes other than personal career preparation.</li>
                    <li><strong>Commercial exploitation:</strong> Reselling, redistributing, or commercially exploiting our services without authorization.</li>
                    <li><strong>Competitive analysis:</strong> Using our service to develop competing products or services.</li>
                  </ul>
                </section>

                <section>
                  <h2>4. CV Ownership Verification</h2>
                  <p>
                    To protect user privacy and prevent misuse, we implement CV ownership 
                    verification that compares the name on your uploaded CV with your account 
                    information. This helps ensure that:
                  </p>
                  <ul>
                    <li>You are only uploading your own documents</li>
                    <li>Your privacy is protected from others uploading your CV</li>
                    <li>The platform is used for its intended purpose</li>
                  </ul>
                </section>

                <section>
                  <h2>5. Consequences of Violations</h2>
                  <p>
                    Violations of this policy may result in the following actions, 
                    depending on the severity:
                  </p>
                  <ul>
                    <li><strong>Warning:</strong> For minor or first-time violations</li>
                    <li><strong>Temporary suspension:</strong> For repeated or moderate violations</li>
                    <li><strong>Permanent ban:</strong> For serious violations or repeated offenses</li>
                    <li><strong>Legal action:</strong> For violations that cause harm or involve illegal activity</li>
                  </ul>
                  <p>
                    We will make reasonable efforts to notify you before taking action, 
                    except in cases of serious violations that require immediate response.
                  </p>
                </section>

                <section>
                  <h2>6. Reporting Violations</h2>
                  <p>
                    If you become aware of any violations of this policy or suspicious 
                    activity on the platform, please report it to us immediately through 
                    our support channels. We take all reports seriously and will investigate 
                    promptly.
                  </p>
                </section>

                <section>
                  <h2>7. Changes to This Policy</h2>
                  <p>
                    We may update this Acceptable Use Policy from time to time. Significant 
                    changes will be communicated through the platform or via email. Continued 
                    use of the service after changes constitutes acceptance of the updated policy.
                  </p>
                </section>

                <section>
                  <h2>8. Contact Us</h2>
                  <p>
                    If you have questions about this policy or need to report a violation, 
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
