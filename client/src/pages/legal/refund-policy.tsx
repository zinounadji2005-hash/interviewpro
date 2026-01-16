import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function RefundPolicy() {
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
            <CardTitle className="text-3xl font-heading">Refund & Credit Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: January 2026</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
                <section>
                  <h2>1. Credit System Overview</h2>
                  <p>
                    InterviewPro uses a credit-based system to access premium features. 
                    Credits are consumed when you use specific services on our platform.
                  </p>
                  <h3>New Account Credits</h3>
                  <p>
                    New users receive 100 complimentary credits upon account creation 
                    to explore our platform and features.
                  </p>
                </section>

                <section>
                  <h2>2. Credit Usage</h2>
                  <p>Credits are consumed for the following services:</p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 text-left">Service</th>
                        <th className="border p-2 text-left">Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2">CV Optimization</td>
                        <td className="border p-2">10 credits</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Start New Interview Session</td>
                        <td className="border p-2">20 credits</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Voice Interview Session</td>
                        <td className="border p-2">20 credits</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Interview Evaluation</td>
                        <td className="border p-2">15 credits</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-sm text-muted-foreground mt-2">
                    Credit costs may be updated from time to time. Current costs are always 
                    displayed before you use a feature.
                  </p>
                </section>

                <section>
                  <h2>3. Purchasing Credits</h2>
                  <p>
                    Additional credits can be purchased through our platform. All purchases 
                    are processed securely through our payment provider.
                  </p>
                  <ul>
                    <li>Credits are added to your account immediately upon successful payment</li>
                    <li>You will receive a confirmation email for each purchase</li>
                    <li>Credits do not expire as long as your account remains active</li>
                  </ul>
                </section>

                <section>
                  <h2>4. Credit Restrictions</h2>
                  <ul>
                    <li><strong>Non-transferable:</strong> Credits cannot be transferred between accounts</li>
                    <li><strong>No cash value:</strong> Credits cannot be exchanged for cash</li>
                    <li><strong>Account-specific:</strong> Credits are tied to your account and cannot be gifted</li>
                  </ul>
                </section>

                <section>
                  <h2>5. Refund Policy</h2>
                  
                  <h3>Eligible for Refund</h3>
                  <p>You may request a refund in the following circumstances:</p>
                  <ul>
                    <li><strong>Technical failure:</strong> If a service fails to function and you were charged credits, we will refund those credits</li>
                    <li><strong>Duplicate charges:</strong> If you were accidentally charged twice for the same service</li>
                    <li><strong>Billing errors:</strong> If an error in our billing system resulted in incorrect charges</li>
                    <li><strong>Unused purchased credits:</strong> Within 14 days of purchase, if you have not used any of the purchased credits</li>
                  </ul>

                  <h3>Not Eligible for Refund</h3>
                  <p>Refunds are generally not provided for:</p>
                  <ul>
                    <li>Credits that have been used, even partially</li>
                    <li>Dissatisfaction with AI-generated content or feedback</li>
                    <li>Complimentary credits provided at account creation</li>
                    <li>Credits purchased more than 14 days ago</li>
                    <li>Accounts terminated for policy violations</li>
                  </ul>
                </section>

                <section>
                  <h2>6. How to Request a Refund</h2>
                  <p>To request a refund:</p>
                  <ol>
                    <li>Contact our support team through the platform</li>
                    <li>Provide your account email and details of your purchase</li>
                    <li>Explain the reason for your refund request</li>
                    <li>Our team will review and respond within 5 business days</li>
                  </ol>
                  <p>
                    Approved refunds will be processed to the original payment method 
                    within 10 business days.
                  </p>
                </section>

                <section>
                  <h2>7. Failed Payments</h2>
                  <p>
                    If a payment fails, no credits will be added to your account. 
                    Common reasons for failed payments include:
                  </p>
                  <ul>
                    <li>Insufficient funds</li>
                    <li>Expired or invalid card</li>
                    <li>Bank declined the transaction</li>
                    <li>Incorrect payment details</li>
                  </ul>
                  <p>
                    If you believe you were charged despite a failed payment, please 
                    contact support with your payment confirmation or bank statement.
                  </p>
                </section>

                <section>
                  <h2>8. Account Closure</h2>
                  <p>
                    If you choose to close your account, any remaining credits will be 
                    forfeited. We recommend using your credits before closing your account.
                  </p>
                  <p>
                    Unused purchased credits may be eligible for refund if the account 
                    is closed within 14 days of purchase and no credits have been used.
                  </p>
                </section>

                <section>
                  <h2>9. Changes to This Policy</h2>
                  <p>
                    We may update this policy from time to time. Changes to credit costs 
                    will be communicated before they take effect. Purchased credits will 
                    be honored at the rates they were purchased.
                  </p>
                </section>

                <section>
                  <h2>10. Contact Us</h2>
                  <p>
                    For questions about credits or refunds, please contact our support 
                    team through the platform.
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
