import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function EmailVerificationRequired() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Almost There!
          </CardTitle>
          <CardDescription className="text-gray-600">
            You need to verify your email address to continue
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Account created successfully</span>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                We've sent a verification link to your email address. Please
                check your inbox and click the link to verify your account.
              </p>
            </div>

            <div className="text-xs text-gray-500">
              Don't see the email? Check your spam folder or wait a few minutes
              for it to arrive.
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/">Return to Home</Link>
            </Button>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Need help?{" "}
                <Link href="/" className="text-blue-600 hover:underline">
                  Contact Support
                </Link>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
