import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CreditCard,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";

const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function hasValue(value) {
  return value !== null && value !== undefined;
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return dateFormatter.format(date);
}

function formatCount(value) {
  return hasValue(value) ? numberFormatter.format(value) : "N/A";
}

function formatBytes(bytes) {
  if (!hasValue(bytes)) return "N/A";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatLimit(value) {
  if (value === -1) return "Unlimited";
  return formatCount(value);
}

function TierBadge({ tier }) {
  return (
    <Badge
      variant="outline"
      className={
        tier === "PRO"
          ? "bg-orange-50 text-[#f26522] border-orange-200"
          : "bg-slate-50 text-slate-600 border-slate-200"
      }
    >
      {tier || "N/A"}
    </Badge>
  );
}

function RoleBadge({ roleName }) {
  return (
    <Badge
      variant={roleName === "ADMIN" ? "destructive" : "default"}
      className={roleName === "ADMIN" ? "" : "bg-blue-50 text-blue-700"}
    >
      {roleName || "N/A"}
    </Badge>
  );
}

function StatusBadge({ banned }) {
  return banned ? (
    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
      Banned
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="bg-green-50 text-green-700 border-green-200"
    >
      Active
    </Badge>
  );
}

function VerifiedBadge({ verified }) {
  return verified ? (
    <Badge
      variant="outline"
      className="bg-green-50 text-green-700 border-green-200"
    >
      Verified
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="bg-slate-50 text-slate-500 border-slate-200"
    >
      Unverified
    </Badge>
  );
}

function SectionCard({ title, Icon, children, className = "" }) {
  return (
    <Card className={`rounded-2xl border-slate-100 shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-slate-800">
          {React.createElement(Icon, {
            className: "h-5 w-5 text-[#f26522]",
            "aria-hidden": "true",
          })}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="max-w-[65%] break-words text-right text-sm font-semibold text-slate-800">
        {hasValue(value) && value !== "" ? value : "N/A"}
      </span>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold tabular-nums text-slate-900">
        {value}
      </p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-10 w-40 rounded-xl" />
      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64 rounded-lg" />
              <Skeleton className="h-5 w-80 rounded-lg" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-6 w-20 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="rounded-2xl border-slate-100 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-6 w-40 rounded-lg" />
              <Skeleton className="h-5 w-full rounded-lg" />
              <Skeleton className="h-5 w-5/6 rounded-lg" />
              <Skeleton className="h-5 w-3/4 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ title, message, onRetry, isRetrying }) {
  return (
    <div className="p-6">
      <Card className="rounded-2xl border-red-100 bg-red-50 shadow-sm">
        <CardContent className="p-8 text-center">
          <AlertCircle
            className="mx-auto h-11 w-11 text-red-500"
            aria-hidden="true"
          />
          <h1 className="mt-3 text-lg font-bold text-red-700">{title}</h1>
          <p className="mt-1 text-sm text-red-600">{message}</p>
          <div className="mt-5 flex justify-center gap-3">
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/admin/users">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Back to Users
              </Link>
            </Button>
            <Button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="rounded-xl bg-[#f26522] text-white hover:bg-[#d95316]"
            >
              {isRetrying ? (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setNotFound(false);
      const response = await axiosClient.get(`/api/admin/users/${id}`);
      setUser(response.data);
    } catch (fetchError) {
      console.error("Error fetching admin user detail:", fetchError);
      setUser(null);
      if (fetchError?.response?.status === 404) {
        setNotFound(true);
        setError("The requested user could not be found.");
      } else {
        setError("Unable to load user detail. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchUser, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchUser]);

  const featureEntries = useMemo(
    () =>
      Object.entries(user?.aiUsageByFeature || {}).filter(([, value]) =>
        hasValue(value),
      ),
    [user?.aiUsageByFeature],
  );

  if (isLoading && !user) {
    return <DetailSkeleton />;
  }

  if (error && !user) {
    return (
      <ErrorState
        title={notFound ? "User Not Found" : "Could Not Load User"}
        message={error}
        onRetry={fetchUser}
        isRetrying={isLoading}
      />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Button
          asChild
          variant="outline"
          className="w-fit rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <Link to="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to Users
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden rounded-2xl border-slate-100 shadow-sm">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f26522] text-2xl font-bold uppercase text-white shadow-lg shadow-orange-500/20">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={`${user.username || "User"} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user.username?.charAt(0) || "U"
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="break-words text-2xl font-black text-slate-900">
                    {user.username || "User Detail"}
                  </h1>
                  <p className="mt-1 break-words text-sm font-medium text-slate-500">
                    {user.email || "No email available"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <RoleBadge roleName={user.roleName} />
                    <TierBadge tier={user.subscriptionTier} />
                    <VerifiedBadge verified={user.emailVerified} />
                    <StatusBadge banned={user.banned} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:min-w-[420px]">
                <MetricCard
                  label="Documents"
                  value={formatCount(user.totalDocuments)}
                />
                <MetricCard label="AI Today" value={formatCount(user.aiUsageToday)} />
                <MetricCard label="Quizzes" value={formatCount(user.quizCount)} />
                <MetricCard
                  label="Projects"
                  value={formatCount(user.projectOwnedCount)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
        <div className="space-y-6">
          <SectionCard title="Account" Icon={Shield}>
            <DetailRow label="Username" value={user.username} />
            <DetailRow label="Email" value={user.email} />
            <DetailRow label="Role" value={user.roleName} />
            <DetailRow label="Tier" value={user.subscriptionTier} />
            <DetailRow label="Status" value={user.banned ? "Banned" : "Active"} />
            <DetailRow
              label="Email Verified"
              value={user.emailVerified ? "Verified" : "Unverified"}
            />
            <DetailRow
              label="Survey"
              value={user.surveyCompleted ? "Completed" : "Pending"}
            />
            <DetailRow label="Created" value={formatDate(user.createdAt)} />
            <DetailRow label="Updated" value={formatDate(user.updatedAt)} />
          </SectionCard>

          <SectionCard title="Documents" Icon={FileText}>
            <div className="grid gap-3 sm:grid-cols-4">
              <MetricCard label="Total" value={formatCount(user.totalDocuments)} />
              <MetricCard label="Public" value={formatCount(user.publicDocuments)} />
              <MetricCard label="Private" value={formatCount(user.privateDocuments)} />
              <MetricCard
                label="Storage"
                value={formatBytes(user.storageUsedBytes)}
              />
            </div>

            <div className="mt-5">
              <h2 className="text-sm font-bold text-slate-700">
                Recent Documents
              </h2>
              {Array.isArray(user.recentDocuments) &&
              user.recentDocuments.length > 0 ? (
                <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-100">
                  {user.recentDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <Link
                          to={`/admin/documents/${document.id}`}
                          className="inline-flex max-w-full items-center gap-2 break-words text-sm font-bold text-slate-800 hover:text-[#f26522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f26522]/30"
                        >
                          {document.title || "Untitled document"}
                          <ExternalLink
                            className="h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                          />
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          {document.visibility || "N/A"} |{" "}
                          {formatBytes(document.fileSize)} |{" "}
                          {formatDate(document.createdAt)}
                        </p>
                      </div>
                      {document.aiParseStatus && (
                        <Badge
                          variant="outline"
                          className="w-fit bg-slate-50 text-slate-600 border-slate-200"
                        >
                          {document.aiParseStatus}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                  No recent documents available.
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="AI Usage" Icon={Bot}>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <MetricCard label="Today" value={formatCount(user.aiUsageToday)} />
              <MetricCard label="Daily Limit" value={formatLimit(user.aiDailyLimit)} />
              <MetricCard
                label="Remaining"
                value={formatLimit(user.aiRemainingToday)}
              />
            </div>
            {featureEntries.length > 0 && (
              <div className="mt-5 rounded-2xl border border-slate-100 p-4">
                <h2 className="text-sm font-bold text-slate-700">
                  Usage by Feature
                </h2>
                <div className="mt-3 space-y-2">
                  {featureEntries.map(([feature, count]) => (
                    <div
                      key={feature}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <span className="break-words font-medium text-slate-500">
                        {feature}
                      </span>
                      <span className="font-bold tabular-nums text-slate-800">
                        {formatCount(count)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Learning Activity" Icon={GraduationCap}>
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="Quizzes" value={formatCount(user.quizCount)} />
              <MetricCard
                label="Flashcard Sets"
                value={formatCount(user.flashcardSetCount)}
              />
              <MetricCard label="Mindmaps" value={formatCount(user.mindmapCount)} />
              <MetricCard
                label="Owned Projects"
                value={formatCount(user.projectOwnedCount)}
              />
              <MetricCard
                label="Joined Projects"
                value={formatCount(user.projectJoinedCount)}
              />
            </div>
          </SectionCard>

          <SectionCard title="Profile" Icon={Users}>
            <DetailRow label="School" value={user.schoolName} />
            <DetailRow label="School Code" value={user.schoolCode} />
            <DetailRow label="Major" value={user.major} />
            <DetailRow label="Start Year" value={user.startYear} />
            <div className="pt-3">
              <p className="text-sm font-medium text-slate-500">Languages</p>
              {Array.isArray(user.languages) && user.languages.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {user.languages.map((language) => (
                    <Badge
                      key={language.id || language.code || language.name}
                      variant="outline"
                      className="bg-orange-50 text-[#f26522] border-orange-100"
                    >
                      {language.name || language.code || "Language"}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm font-semibold text-slate-800">N/A</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Membership / Payment" Icon={CreditCard}>
            <DetailRow label="Current Tier" value={user.subscriptionTier} />
            {user.latestPaymentStatus ? (
              <>
                <DetailRow
                  label="Latest Payment Status"
                  value={user.latestPaymentStatus}
                />
                <DetailRow
                  label="Latest Payment Date"
                  value={formatDate(user.latestPaymentDate)}
                />
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                No payment summary available.
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {isLoading && (
        <div className="fixed bottom-5 right-5 flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin text-[#f26522]" />
          Refreshing user
        </div>
      )}
    </div>
  );
}
